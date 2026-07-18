export const GUIDED_SUBMISSION_LIMITS = {
  maxFiles: 3,
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxTotalFileSizeBytes: 10 * 1024 * 1024,
  maxRequestBodyBytes: 10 * 1024 * 1024 + 256 * 1024,
  maxUrls: 5,
  maxUrlLength: 2048,
  clientUploadTimeoutMs: 90_000,
} as const;

export interface GuidedActivitySubmissionFile {
  key: string;
  name: string;
  contentType: string;
  size: number;
}

export type GuidedActivitySubmissionErrorCode =
  | 'ACTIVITY_NOT_FOUND'
  | 'CONTENT_LENGTH_REQUIRED'
  | 'EMPTY_SUBMISSION'
  | 'ENROLLMENT_REQUIRED'
  | 'ENTITLEMENT_REQUIRED'
  | 'FILE_LIMIT_EXCEEDED'
  | 'FILE_SIGNATURE_INVALID'
  | 'FILE_TOTAL_TOO_LARGE'
  | 'INVALID_FILES'
  | 'INVALID_FORM_DATA'
  | 'INVALID_ORIGIN'
  | 'INVALID_REQUEST_ID'
  | 'INVALID_ROUTE_PARAMS'
  | 'INVALID_URLS'
  | 'PAYLOAD_TOO_LARGE'
  | 'PERSISTENCE_FAILED'
  | 'RATE_LIMITED'
  | 'RATE_LIMIT_UNAVAILABLE'
  | 'REQUEST_ABORTED'
  | 'SESSION_LOCKED'
  | 'SUBSCRIPTION_VERIFICATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'UPLOAD_FAILED'
  | 'URL_LIMIT_EXCEEDED'
  | 'USER_NOT_FOUND';

export interface GuidedActivitySubmissionSuccessResponse {
  success: true;
  activityId: number;
  isCompleted: true;
  submissionId: number;
}

export interface GuidedActivitySubmissionErrorResponse {
  success: false;
  code: GuidedActivitySubmissionErrorCode;
  error: string;
}

export type GuidedActivitySubmissionResponse =
  | GuidedActivitySubmissionSuccessResponse
  | GuidedActivitySubmissionErrorResponse;

// Public-safe view of a submitted file: never exposes the private S3 key.
export interface GuidedActivitySubmissionFilePreview {
  name: string;
  contentType: string;
  size: number;
}

export interface GuidedActivitySubmissionLatest {
  submissionId: number;
  submittedAt: string;
  files: GuidedActivitySubmissionFilePreview[];
  urls: string[];
}

export interface GuidedActivitySubmissionLatestSuccessResponse {
  success: true;
  submission: GuidedActivitySubmissionLatest | null;
}

export type GuidedActivitySubmissionLatestResponse =
  | GuidedActivitySubmissionLatestSuccessResponse
  | GuidedActivitySubmissionErrorResponse;

const ALLOWED_FILE_TYPES: Record<string, ReadonlySet<string>> = {
  csv: new Set(['text/csv', 'application/csv']),
  docx: new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  jpeg: new Set(['image/jpeg']),
  jpg: new Set(['image/jpeg']),
  pdf: new Set(['application/pdf']),
  png: new Set(['image/png']),
  pptx: new Set([
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ]),
  txt: new Set(['text/plain']),
  webp: new Set(['image/webp']),
  xlsx: new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]),
  zip: new Set(['application/zip', 'application/x-zip-compressed']),
};

export const GUIDED_SUBMISSION_FILE_ACCEPT = Object.keys(ALLOWED_FILE_TYPES)
  .map((extension) => `.${extension}`)
  .join(',');

export function getGuidedSubmissionFileError({
  name,
  size,
  type,
}: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (size <= 0) return 'No se permiten archivos vacíos.';

  if (size > GUIDED_SUBMISSION_LIMITS.maxFileSizeBytes) {
    return 'Cada archivo puede pesar hasta 5 MB.';
  }

  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  const allowedMimeTypes = ALLOWED_FILE_TYPES[extension];
  if (!allowedMimeTypes?.has(type.toLowerCase())) {
    return 'Tipo de archivo no permitido. Usa PDF, Office Open XML, TXT, CSV, JPG, PNG, WEBP o ZIP.';
  }

  return null;
}

export function normalizeGuidedSubmissionUrl(value: string): string | null {
  const normalizedValue = value.trim();
  if (
    normalizedValue.length === 0 ||
    normalizedValue.length > GUIDED_SUBMISSION_LIMITS.maxUrlLength
  ) {
    return null;
  }

  try {
    const url = new URL(normalizedValue);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? normalizedValue
      : null;
  } catch {
    return null;
  }
}

export function sanitizeGuidedSubmissionFilename(value: string): string {
  const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const cleaned = normalized
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!cleaned) return 'archivo';
  if (cleaned.length <= 120) return cleaned;

  const extensionMatch = cleaned.match(/(\.[a-zA-Z0-9]{1,8})$/);
  const extension = extensionMatch?.[1] ?? '';
  return `${cleaned.slice(0, 120 - extension.length)}${extension}`;
}

export function sanitizeGuidedSubmissionDisplayName(value: string): string {
  const cleaned = value
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'archivo';
  if (cleaned.length <= 120) return cleaned;

  const extensionMatch = cleaned.match(/(\.[a-zA-Z0-9]{1,8})$/);
  const extension = extensionMatch?.[1] ?? '';
  return `${cleaned.slice(0, 120 - extension.length)}${extension}`;
}
