import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Pool } from '@neondatabase/serverless';
import { and, desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { randomUUID } from 'node:crypto';

import { env } from '~/env';
import {
  getGuidedSubmissionFileError,
  GUIDED_SUBMISSION_LIMITS,
  normalizeGuidedSubmissionUrl,
  sanitizeGuidedSubmissionDisplayName,
  sanitizeGuidedSubmissionFilename,
} from '~/lib/guidedActivitySubmissions';
import { db } from '~/server/db';
import * as schema from '~/server/db/schema';
import { guidedActivitySubmissions } from '~/server/db/schema';
import { ratelimit } from '~/server/ratelimit/ratelimit';
import { getGuidedActivitySubmissionAccess } from '~/server/services/guided-projects/guidedActivitySubmissionAccess';
import { hasActiveGuidedProjectEntitlement } from '~/server/services/guided-projects/guidedProjectEntitlement';
import {
  lockGuidedActivityAccess,
  persistGuidedActivityProgress,
} from '~/server/services/guided-projects/persistGuidedActivityProgress';
import { hasValidGuidedSubmissionFileSignature } from '~/server/services/guided-projects/validateGuidedSubmissionFileContent';

import type {
  GuidedActivitySubmissionErrorCode,
  GuidedActivitySubmissionErrorResponse,
  GuidedActivitySubmissionFile,
  GuidedActivitySubmissionLatestResponse,
  GuidedActivitySubmissionSuccessResponse,
} from '~/lib/guidedActivitySubmissions';

export const runtime = 'nodejs';

const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const S3_CLEANUP_TIMEOUT_MS = 8_000;

const ERROR_DEFINITIONS: Record<
  GuidedActivitySubmissionErrorCode,
  { message: string; status: number }
> = {
  ACTIVITY_NOT_FOUND: { message: 'Actividad no encontrada.', status: 404 },
  CONTENT_LENGTH_REQUIRED: {
    message: 'La solicitud debe indicar su tamaño.',
    status: 411,
  },
  EMPTY_SUBMISSION: {
    message: 'Agrega al menos un archivo o enlace.',
    status: 400,
  },
  ENROLLMENT_REQUIRED: {
    message: 'Debes estar inscrito en este proyecto guiado.',
    status: 403,
  },
  ENTITLEMENT_REQUIRED: {
    message:
      'Necesitas una suscripción Pro, Premium o Enterprise activa para entregar.',
    status: 403,
  },
  FILE_LIMIT_EXCEEDED: {
    message: 'Puedes adjuntar hasta 3 archivos.',
    status: 400,
  },
  FILE_SIGNATURE_INVALID: {
    message: 'El contenido de uno de los archivos no coincide con su tipo.',
    status: 400,
  },
  FILE_TOTAL_TOO_LARGE: {
    message: 'Los archivos pueden pesar hasta 10 MB en total.',
    status: 400,
  },
  INVALID_FILES: { message: 'La lista de archivos es inválida.', status: 400 },
  INVALID_FORM_DATA: { message: 'No se pudo leer la entrega.', status: 400 },
  INVALID_ORIGIN: { message: 'Origen de solicitud no permitido.', status: 403 },
  INVALID_REQUEST_ID: {
    message: 'Identificador de entrega inválido.',
    status: 400,
  },
  INVALID_ROUTE_PARAMS: {
    message: 'Proyecto o actividad inválidos.',
    status: 400,
  },
  INVALID_URLS: {
    message:
      'Todos los enlaces deben comenzar con http:// o https:// y tener hasta 2048 caracteres.',
    status: 400,
  },
  PAYLOAD_TOO_LARGE: {
    message: 'La entrega supera el tamaño máximo permitido.',
    status: 413,
  },
  PERSISTENCE_FAILED: {
    message: 'No se pudo guardar la entrega. Intenta nuevamente.',
    status: 500,
  },
  RATE_LIMITED: {
    message: 'Realizaste demasiados intentos. Espera antes de reintentar.',
    status: 429,
  },
  RATE_LIMIT_UNAVAILABLE: {
    message: 'No pudimos validar el límite de cargas. Intenta nuevamente.',
    status: 503,
  },
  REQUEST_ABORTED: { message: 'La carga fue cancelada.', status: 408 },
  SESSION_LOCKED: { message: 'Esta sesión está bloqueada.', status: 403 },
  SUBSCRIPTION_VERIFICATION_FAILED: {
    message: 'No pudimos verificar tu suscripción. Intenta nuevamente.',
    status: 503,
  },
  UNAUTHENTICATED: { message: 'No autenticado.', status: 401 },
  UPLOAD_FAILED: {
    message: 'No se pudieron subir los archivos. Intenta nuevamente.',
    status: 500,
  },
  URL_LIMIT_EXCEEDED: {
    message: 'Puedes agregar hasta 5 enlaces.',
    status: 400,
  },
  USER_NOT_FOUND: {
    message: 'Usuario no encontrado en la base de datos.',
    status: 403,
  },
};

interface RouteParams {
  params: Promise<{
    activityId: string;
    projectId: string;
  }>;
}

interface PreparedSubmissionFile extends GuidedActivitySubmissionFile {
  body: Uint8Array;
}

interface PersistedSubmissionResult {
  activityId: number;
  guidedProjectId: number;
  idempotent: boolean;
  submissionId: number;
}

class SubmissionTransactionError extends Error {
  constructor(
    readonly code: GuidedActivitySubmissionErrorCode,
    message?: string
  ) {
    super(message ?? ERROR_DEFINITIONS[code].message);
    this.name = 'SubmissionTransactionError';
  }
}

function respondWithError(
  code: GuidedActivitySubmissionErrorCode,
  message?: string,
  headers?: HeadersInit
) {
  const definition = ERROR_DEFINITIONS[code];
  return NextResponse.json<GuidedActivitySubmissionErrorResponse>(
    { success: false, code, error: message ?? definition.message },
    { status: definition.status, headers }
  );
}

const parsePositiveInteger = (value: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

function hasStrictSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return (
      originUrl.origin === request.nextUrl.origin &&
      originUrl.host.toLowerCase() === host.toLowerCase()
    );
  } catch {
    return false;
  }
}

// Derives the bucket's real region from the public S3 base URL (e.g. us-east-2).
// AWS_REGION may point at a different region and cause a PermanentRedirect (301)
// on PutObject, so we trust the bucket URL first — same approach as the profile
// cover upload route.
function getBucketRegion(): string {
  try {
    const host = new URL(env.NEXT_PUBLIC_AWS_S3_URL).hostname;
    const match = /\.?s3[.-]([a-z0-9-]+)\.amazonaws\.com$/i.exec(host);
    return match?.[1] ?? env.AWS_REGION;
  } catch {
    return env.AWS_REGION;
  }
}

function getS3Client() {
  return new S3Client({
    region: getBucketRegion(),
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

async function deleteObjectsBounded(
  client: S3Client,
  keys: string[],
  reason: string
) {
  const uniqueKeys = [...new Set(keys)];
  if (uniqueKeys.length === 0) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), S3_CLEANUP_TIMEOUT_MS);

  try {
    const results = await Promise.allSettled(
      uniqueKeys.map((key) =>
        client.send(
          new DeleteObjectCommand({
            Bucket: env.AWS_BUCKET_NAME,
            Key: key,
          }),
          { abortSignal: controller.signal }
        )
      )
    );
    const failedCount = results.filter(
      (result) => result.status === 'rejected'
    ).length;

    if (failedCount > 0) {
      console.error('[guided-submission] cleanup_incomplete', {
        attemptedCount: uniqueKeys.length,
        failedCount,
        reason,
        timedOut: controller.signal.aborted,
      });
    }
  } finally {
    clearTimeout(timeout);
  }
}

function revalidateGuidedSubmissionPaths(
  guidedProjectId: number,
  activityId: number
) {
  try {
    revalidatePath(`/estudiantes/proyectos-guiados/${guidedProjectId}`);
    revalidatePath(
      `/estudiantes/proyectos-guiados/${guidedProjectId}/actividades/${activityId}`
    );
  } catch {
    console.warn('[guided-submission] path_revalidation_failed', {
      activityId,
      guidedProjectId,
    });
  }
}

function mapAccessFailure(
  reason:
    | 'ACTIVITY_NOT_FOUND'
    | 'ENROLLMENT_REQUIRED'
    | 'SESSION_LOCKED'
    | 'USER_NOT_FOUND'
): GuidedActivitySubmissionErrorCode {
  return reason;
}

function mapProgressFailure(
  reason:
    | 'ACTIVITY_NOT_FOUND'
    | 'ENROLLMENT_REQUIRED'
    | 'INVALID_PROJECT'
    | 'SESSION_LOCKED'
): GuidedActivitySubmissionErrorCode {
  return reason === 'INVALID_PROJECT' ? 'ACTIVITY_NOT_FOUND' : reason;
}

export async function POST(request: NextRequest, context: RouteParams) {
  if (!hasStrictSameOrigin(request)) {
    return respondWithError('INVALID_ORIGIN');
  }

  const { activityId: activityIdParam, projectId: projectIdParam } =
    await context.params;
  const activityId = parsePositiveInteger(activityIdParam);
  const projectId = parsePositiveInteger(projectIdParam);
  if (!activityId || !projectId) {
    return respondWithError('INVALID_ROUTE_PARAMS');
  }

  const { userId } = await auth();
  if (!userId) return respondWithError('UNAUTHENTICATED');

  let clerkUser: Awaited<ReturnType<typeof currentUser>>;
  try {
    clerkUser = await currentUser();
  } catch {
    return respondWithError('SUBSCRIPTION_VERIFICATION_FAILED');
  }
  if (!clerkUser || clerkUser.id !== userId) {
    return respondWithError('UNAUTHENTICATED');
  }
  if (!hasActiveGuidedProjectEntitlement(clerkUser)) {
    return respondWithError('ENTITLEMENT_REQUIRED');
  }

  let rateLimitResult: Awaited<ReturnType<typeof ratelimit.limit>>;
  try {
    rateLimitResult = await ratelimit.limit(`guided-submission:${userId}`);
  } catch {
    console.error('[guided-submission] rate_limit_unavailable');
    return respondWithError('RATE_LIMIT_UNAVAILABLE');
  }
  if (!rateLimitResult.success) {
    const retryAfter = Math.max(
      1,
      Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
    );
    return respondWithError('RATE_LIMITED', undefined, {
      'Retry-After': String(retryAfter),
    });
  }

  const access = await getGuidedActivitySubmissionAccess({
    activityId,
    projectId,
    userId,
  });
  if (!access.success) {
    return respondWithError(mapAccessFailure(access.reason));
  }

  const contentLengthHeader = request.headers.get('content-length');
  if (!contentLengthHeader) {
    return respondWithError('CONTENT_LENGTH_REQUIRED');
  }
  const contentLength = Number(contentLengthHeader);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    return respondWithError('CONTENT_LENGTH_REQUIRED');
  }
  if (contentLength > GUIDED_SUBMISSION_LIMITS.maxRequestBodyBytes) {
    return respondWithError('PAYLOAD_TOO_LARGE');
  }
  if (
    !request.headers.get('content-type')?.startsWith('multipart/form-data;')
  ) {
    return respondWithError('INVALID_FORM_DATA');
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return respondWithError('INVALID_FORM_DATA');
  }

  const requestIdValue = formData.get('requestId');
  const requestId =
    typeof requestIdValue === 'string' ? requestIdValue.trim() : '';
  if (!REQUEST_ID_PATTERN.test(requestId)) {
    return respondWithError('INVALID_REQUEST_ID');
  }

  const rawFiles = formData.getAll('files');
  if (rawFiles.some((entry) => !(entry instanceof File))) {
    return respondWithError('INVALID_FILES');
  }
  const files = rawFiles as File[];
  if (files.length > GUIDED_SUBMISSION_LIMITS.maxFiles) {
    return respondWithError('FILE_LIMIT_EXCEEDED');
  }

  const totalFileSize = files.reduce((total, file) => total + file.size, 0);
  if (totalFileSize > GUIDED_SUBMISSION_LIMITS.maxTotalFileSizeBytes) {
    return respondWithError('FILE_TOTAL_TOO_LARGE');
  }
  for (const file of files) {
    const fileError = getGuidedSubmissionFileError(file);
    if (fileError) return respondWithError('INVALID_FILES', fileError);
  }

  const rawUrls = formData.getAll('urls');
  if (rawUrls.length > GUIDED_SUBMISSION_LIMITS.maxUrls) {
    return respondWithError('URL_LIMIT_EXCEEDED');
  }
  if (rawUrls.some((entry) => typeof entry !== 'string')) {
    return respondWithError('INVALID_URLS');
  }
  const normalizedUrls = rawUrls.map((entry) =>
    normalizeGuidedSubmissionUrl(entry as string)
  );
  if (normalizedUrls.some((url) => url === null)) {
    return respondWithError('INVALID_URLS');
  }
  const urls = [...new Set(normalizedUrls as string[])];
  if (urls.length > GUIDED_SUBMISSION_LIMITS.maxUrls) {
    return respondWithError('URL_LIMIT_EXCEEDED');
  }
  if (files.length === 0 && urls.length === 0) {
    return respondWithError('EMPTY_SUBMISSION');
  }

  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const uploadAttemptId = randomUUID();
  const preparedFiles: PreparedSubmissionFile[] = [];

  for (const [index, file] of files.entries()) {
    if (request.signal.aborted) return respondWithError('REQUEST_ABORTED');

    let body: Uint8Array;
    try {
      body = new Uint8Array(await file.arrayBuffer());
    } catch {
      return respondWithError('INVALID_FILES');
    }
    if (!hasValidGuidedSubmissionFileSignature(file, body)) {
      return respondWithError('FILE_SIGNATURE_INVALID');
    }

    const displayName = sanitizeGuidedSubmissionDisplayName(file.name);
    const keyFilename = sanitizeGuidedSubmissionFilename(displayName);
    preparedFiles.push({
      body,
      contentType: file.type.toLowerCase(),
      key: [
        'guided-activity-submissions',
        projectId,
        activityId,
        safeUserId,
        requestId,
        uploadAttemptId,
        `${index + 1}-${keyFilename}`,
      ].join('/'),
      name: displayName,
      size: file.size,
    });
  }

  const candidateKeys = preparedFiles.map((file) => file.key);
  const s3Client = getS3Client();
  try {
    for (const file of preparedFiles) {
      await s3Client.send(
        new PutObjectCommand({
          Body: file.body,
          Bucket: env.AWS_BUCKET_NAME,
          ContentType: file.contentType,
          Key: file.key,
        }),
        { abortSignal: request.signal }
      );
    }
  } catch (error) {
    console.error('[guided-submission] upload_failed', {
      aborted: request.signal.aborted,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      fileCount: preparedFiles.length,
    });
    await deleteObjectsBounded(s3Client, candidateKeys, 'upload-failure');
    return respondWithError(
      request.signal.aborted ? 'REQUEST_ABORTED' : 'UPLOAD_FAILED'
    );
  }

  if (request.signal.aborted) {
    await deleteObjectsBounded(s3Client, candidateKeys, 'request-aborted');
    return respondWithError('REQUEST_ABORTED');
  }

  const pool = new Pool({ connectionString: env.POSTGRES_URL });
  const transactionalDb = drizzle({ client: pool, schema });
  let submissionResult: PersistedSubmissionResult;

  try {
    submissionResult = await transactionalDb.transaction(
      async (tx): Promise<PersistedSubmissionResult> => {
        const lockedAccess = await lockGuidedActivityAccess(tx, {
          activityId,
          expectedGuidedProjectId: projectId,
          userId,
        });
        if (!lockedAccess.success) {
          throw new SubmissionTransactionError(
            mapProgressFailure(lockedAccess.reason),
            lockedAccess.message
          );
        }

        const [duplicateSubmission] = await tx
          .select({
            id: guidedActivitySubmissions.id,
          })
          .from(guidedActivitySubmissions)
          .where(
            and(
              eq(guidedActivitySubmissions.userId, userId),
              eq(guidedActivitySubmissions.activityId, activityId),
              eq(guidedActivitySubmissions.requestId, requestId)
            )
          )
          .limit(1);

        if (duplicateSubmission) {
          const progressResult = await persistGuidedActivityProgress(tx, {
            activityId,
            expectedGuidedProjectId: projectId,
            incrementAttemptCount: false,
            isCompleted: true,
            lockedAccess: lockedAccess.access,
            userId,
          });
          if (!progressResult.success) {
            throw new SubmissionTransactionError(
              mapProgressFailure(progressResult.reason),
              progressResult.message
            );
          }

          return {
            activityId,
            guidedProjectId: progressResult.guidedProjectId,
            idempotent: true,
            submissionId: duplicateSubmission.id,
          };
        }

        const [submission] = await tx
          .insert(guidedActivitySubmissions)
          .values({
            activityId,
            files: preparedFiles.map(({ body: _body, ...file }) => file),
            requestId,
            submittedAt: new Date(),
            urls,
            userId,
          })
          .returning({ id: guidedActivitySubmissions.id });
        if (!submission) {
          throw new SubmissionTransactionError('PERSISTENCE_FAILED');
        }

        const progressResult = await persistGuidedActivityProgress(tx, {
          activityId,
          expectedGuidedProjectId: projectId,
          incrementAttemptCount: true,
          isCompleted: true,
          lockedAccess: lockedAccess.access,
          userId,
        });
        if (!progressResult.success) {
          throw new SubmissionTransactionError(
            mapProgressFailure(progressResult.reason),
            progressResult.message
          );
        }

        return {
          activityId,
          guidedProjectId: progressResult.guidedProjectId,
          idempotent: false,
          submissionId: submission.id,
        };
      }
    );
  } catch (error) {
    const code =
      error instanceof SubmissionTransactionError
        ? error.code
        : 'PERSISTENCE_FAILED';
    console.error('[guided-submission] persistence_failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      fileCount: preparedFiles.length,
      knownFailure: error instanceof SubmissionTransactionError,
    });
    await deleteObjectsBounded(s3Client, candidateKeys, 'persistence-failure');
    return respondWithError(
      code,
      error instanceof SubmissionTransactionError ? error.message : undefined
    );
  } finally {
    try {
      await pool.end();
    } catch {
      console.warn('[guided-submission] neon_pool_close_failed');
    }
  }

  if (submissionResult.idempotent) {
    await deleteObjectsBounded(s3Client, candidateKeys, 'idempotent-retry');
  }

  revalidateGuidedSubmissionPaths(submissionResult.guidedProjectId, activityId);
  return NextResponse.json<GuidedActivitySubmissionSuccessResponse>({
    success: true,
    activityId,
    isCompleted: true,
    submissionId: submissionResult.submissionId,
  });
}

// Returns the current user's most recent submission for this activity so the
// dialog can show what was already delivered. Never exposes private S3 keys.
export async function GET(_request: NextRequest, context: RouteParams) {
  const { activityId: activityIdParam, projectId: projectIdParam } =
    await context.params;
  const activityId = parsePositiveInteger(activityIdParam);
  const projectId = parsePositiveInteger(projectIdParam);
  if (!activityId || !projectId) {
    return respondWithError('INVALID_ROUTE_PARAMS');
  }

  const { userId } = await auth();
  if (!userId) return respondWithError('UNAUTHENTICATED');

  const access = await getGuidedActivitySubmissionAccess({
    activityId,
    projectId,
    userId,
  });
  if (!access.success) {
    return respondWithError(mapAccessFailure(access.reason));
  }

  let latest: {
    id: number;
    files: GuidedActivitySubmissionFile[];
    urls: string[];
    submittedAt: Date;
  } | null = null;
  try {
    const [row] = await db
      .select({
        id: guidedActivitySubmissions.id,
        files: guidedActivitySubmissions.files,
        urls: guidedActivitySubmissions.urls,
        submittedAt: guidedActivitySubmissions.submittedAt,
      })
      .from(guidedActivitySubmissions)
      .where(
        and(
          eq(guidedActivitySubmissions.userId, userId),
          eq(guidedActivitySubmissions.activityId, activityId)
        )
      )
      .orderBy(
        desc(guidedActivitySubmissions.submittedAt),
        desc(guidedActivitySubmissions.id)
      )
      .limit(1);
    latest = row ?? null;
  } catch (error) {
    console.error('[guided-submission] latest_fetch_failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return respondWithError('PERSISTENCE_FAILED');
  }

  return NextResponse.json<GuidedActivitySubmissionLatestResponse>({
    success: true,
    submission: latest
      ? {
          submissionId: latest.id,
          submittedAt: latest.submittedAt.toISOString(),
          files: latest.files.map((file) => ({
            name: file.name,
            contentType: file.contentType,
            size: file.size,
          })),
          urls: latest.urls,
        }
      : null,
  });
}
