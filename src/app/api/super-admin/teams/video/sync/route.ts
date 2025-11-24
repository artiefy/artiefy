// src/app/api/super-admin/teams/video/sync/route.ts
import { NextResponse } from 'next/server';

import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { eq, inArray, sql as dsql } from 'drizzle-orm';
import { Readable } from 'node:stream';
import { v4 as uuidv4 } from 'uuid';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';

export const runtime = 'nodejs';

interface VideoIdxItem {
    meetingId: string;
    videoKey: string;
    videoUrl: string;
    createdAt?: string;
    isSecondary?: boolean;
    source?: 'graph';
}

// ---------------------- Helpers ----------------------

function decodeMeetingId(encodedId: string): string {
    try {
        const decoded = Buffer.from(encodedId, 'base64').toString('utf8');
        const match = /19:meeting_[^@]+@thread\.v2/.exec(decoded);
        return match?.[0] ?? encodedId;
    } catch {
        return encodedId;
    }
}

async function getGraphToken(): Promise<string | undefined> {
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID!;
    const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET!;

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'https://graph.microsoft.com/.default');

    const res = await fetch(
        'https://login.microsoftonline.com/060f4acf-9732-441b-80f7-425de7381dd1/oauth2/v2.0/token',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        }
    );

    const data = (await res.json()) as { access_token?: string };
    return data.access_token;
}

const s3 = new S3Client({
    region: 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

interface GraphRecording {
    meetingId: string;
    recordingContentUrl?: string;
    createdDateTime?: string;
}

interface GetRecordingsResponse {
    value?: GraphRecording[];
    '@odata.nextLink'?: string;
}

interface ClassMeetingRow {
    id: number;
    joinUrl: string | null;
    meetingId: string | null;
    video_key: string | null;
    video_key_2: string | null;
    startDateTime: Date | null;
}

function errMsg(e: unknown): string {
    if (e instanceof Error && typeof e.message === 'string') return e.message;
    try {
        return JSON.stringify(e);
    } catch {
        return String(e);
    }
}

async function withDbRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
    let lastErr: unknown;

    for (let i = 0; i < tries; i++) {
        try {
            return await fn();
        } catch (e: unknown) {
            const msg = errMsg(e);
            const transient =
                msg.includes('fetch failed') ||
                msg.includes('ECONNRESET') ||
                msg.includes('ETIMEDOUT') ||
                msg.includes('ECONNREFUSED') ||
                msg.includes('503') ||
                msg.includes('502');

            lastErr = e;
            if (!transient || i === tries - 1) throw e;
            await new Promise((r) => setTimeout(r, 200 * Math.pow(2, i)));
        }
    }

    throw lastErr;
}

// Graph paginado
async function fetchAllGraphRecordings(
    token: string,
    userId: string
): Promise<GraphRecording[]> {
    const all: GraphRecording[] = [];
    let url =
        `https://graph.microsoft.com/v1.0/users/${userId}/onlineMeetings/` +
        `getAllRecordings(meetingOrganizerUserId='${userId}')?$top=50`;

    while (url) {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(20_000),
        });

        if (!res.ok) {
            const raw = await res.text().catch(() => '');
            throw new Error(`getAllRecordings error ${res.status}: ${raw}`);
        }

        const data = (await res.json()) as GetRecordingsResponse;
        all.push(...(data.value ?? []));
        url = data['@odata.nextLink'] ?? '';
    }

    return all;
}

function parseCreatedMs(iso?: string): number {
    if (!iso) return 0;
    const t = Date.parse(iso);
    return Number.isNaN(t) ? 0 : t;
}

function buildPublicVideoUrl(videoKey: string): string {
    return `https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${videoKey}`;
}

function pickClosestRow(
    rows: ClassMeetingRow[],
    recTimeMs: number
): ClassMeetingRow {
    if (!rows.length) {
        return {
            id: 0,
            joinUrl: null,
            meetingId: null,
            video_key: null,
            video_key_2: null,
            startDateTime: null,
        };
    }

    if (!recTimeMs) return rows[0];

    return rows.reduce((best, row) => {
        const t = row.startDateTime
            ? new Date(row.startDateTime).getTime()
            : Infinity;
        const bt = best.startDateTime
            ? new Date(best.startDateTime).getTime()
            : Infinity;

        return Math.abs(t - recTimeMs) < Math.abs(bt - recTimeMs) ? row : best;
    }, rows[0]);
}

// ---------------------- POST /sync ----------------------

export async function POST(req: Request) {
    const body = (await req.json().catch(() => ({}))) as {
        userId?: string;
        maxUploads?: number;
    };

    const userId = body.userId;
    const MAX_NEW_UPLOADS = Math.min(Math.max(body.maxUploads ?? 3, 1), 10);
    const PER_DOWNLOAD_TIMEOUT_MS = 90_000;

    if (!userId) {
        return NextResponse.json({ error: 'Falta userId' }, { status: 400 });
    }

    const token = await getGraphToken();
    if (!token) {
        return NextResponse.json({ error: 'Auth Graph' }, { status: 500 });
    }

    let recordings: GraphRecording[] = [];
    try {
        recordings = await fetchAllGraphRecordings(token, userId);
    } catch (e) {
        console.error('❌ getAllRecordings falló:', errMsg(e));
        return NextResponse.json({ error: 'Graph error' }, { status: 500 });
    }

    if (!recordings.length) {
        return NextResponse.json({
            synced: [],
            uploadsStarted: 0,
            hasMore: false,
        });
    }

    // Agrupar grabaciones por meetingId (decoded)
    const recordingsByMeeting = new Map<string, GraphRecording[]>();

    for (const r of recordings) {
        const decodedId = decodeMeetingId(r.meetingId);
        if (!decodedId) continue;

        const arr = recordingsByMeeting.get(decodedId) ?? [];
        arr.push({ ...r, meetingId: decodedId });
        recordingsByMeeting.set(decodedId, arr);
    }

    const uniqueIds = Array.from(recordingsByMeeting.keys());

    const rowsByMeetingId = new Map<string, ClassMeetingRow[]>();

    if (uniqueIds.length) {
        const rows = (await withDbRetry(() =>
            db
                .select({
                    id: classMeetings.id,
                    joinUrl: classMeetings.joinUrl,
                    meetingId: classMeetings.meetingId,
                    video_key: classMeetings.video_key,
                    video_key_2: classMeetings.video_key_2,
                    startDateTime: classMeetings.startDateTime,
                })
                .from(classMeetings)
                .where(inArray(classMeetings.meetingId, uniqueIds))
        )) as unknown as ClassMeetingRow[];

        for (const r of rows) {
            if (!r.meetingId) continue;
            const arr = rowsByMeetingId.get(r.meetingId) ?? [];
            arr.push(r);
            rowsByMeetingId.set(r.meetingId, arr);
        }
    }

    // Backfill meetingId por joinUrl
    const missingIds = uniqueIds.filter((id) => !rowsByMeetingId.has(id));

    if (missingIds.length) {
        const candidates = (await withDbRetry(() =>
            db
                .select({
                    id: classMeetings.id,
                    joinUrl: classMeetings.joinUrl,
                    meetingId: classMeetings.meetingId,
                    video_key: classMeetings.video_key,
                    video_key_2: classMeetings.video_key_2,
                    startDateTime: classMeetings.startDateTime,
                })
                .from(classMeetings)
                .where(dsql`${classMeetings.joinUrl} IS NOT NULL`)
                .limit(1000)
        )) as unknown as ClassMeetingRow[];

        const updates: { id: number; meetingId: string }[] = [];

        for (const mid of missingIds) {
            const matches = candidates.filter((row) => {
                try {
                    const decodedJoin = decodeURIComponent(row.joinUrl ?? '');
                    return decodedJoin.includes(mid);
                } catch {
                    return false;
                }
            });

            if (matches.length) {
                for (const m of matches) updates.push({ id: m.id, meetingId: mid });
                rowsByMeetingId.set(
                    mid,
                    matches.map((m) => ({ ...m, meetingId: mid }))
                );
            }
        }

        for (const u of updates) {
            await withDbRetry(() =>
                db
                    .update(classMeetings)
                    .set({ meetingId: u.meetingId })
                    .where(eq(classMeetings.id, u.id))
            );
        }
    }

    const synced: VideoIdxItem[] = [];
    let uploadsStarted = 0;

    // Procesar por meeting para permitir 2 grabaciones (video_key + video_key_2)
    for (const [meetingId, recs] of recordingsByMeeting.entries()) {
        try {
            const rowsForMeeting = rowsByMeetingId.get(meetingId) ?? [];
            if (!rowsForMeeting.length) continue;

            // Estado actual en DB (en cualquier fila del meeting)
            const rowWithPrimary = rowsForMeeting.find((r) => r.video_key);
            const rowWithSecondary = rowsForMeeting.find((r) => r.video_key_2);

            const existingPrimary = rowWithPrimary?.video_key ?? null;
            const existingSecondary = rowWithSecondary?.video_key_2 ?? null;

            // Si ya hay ambas, solo las devolvemos
            if (existingPrimary && existingSecondary) {
                synced.push({
                    meetingId,
                    videoKey: existingPrimary,
                    videoUrl: buildPublicVideoUrl(existingPrimary),
                    createdAt: recs[0]?.createdDateTime,
                    isSecondary: false,
                    source: 'graph',
                });
                synced.push({
                    meetingId,
                    videoKey: existingSecondary,
                    videoUrl: buildPublicVideoUrl(existingSecondary),
                    createdAt: recs[1]?.createdDateTime ?? recs[0]?.createdDateTime,
                    isSecondary: true,
                    source: 'graph',
                });
                continue;
            }

            // Ordenar recs por fecha para asignar 1er/2do video de forma estable
            const sortedRecs = recs
                .slice()
                .sort(
                    (a, b) => parseCreatedMs(a.createdDateTime) - parseCreatedMs(b.createdDateTime)
                );

            // Elegir fila objetivo:
            // - si existe primaria sin secundaria, usar esa;
            // - si no, usar la más cercana a la 1a grabación.
            const firstRecMs = parseCreatedMs(sortedRecs[0]?.createdDateTime);
            const targetRow =
                rowWithPrimary && !rowWithPrimary.video_key_2
                    ? rowWithPrimary
                    : pickClosestRow(rowsForMeeting, firstRecMs);

            let primaryKey = existingPrimary ?? targetRow.video_key;
            let secondaryKey = existingSecondary ?? targetRow.video_key_2;

            // Si existe primaria en otra fila y target no la tiene, sincronizamos respuesta igual
            if (primaryKey && !synced.some((s) => s.meetingId === meetingId && s.videoKey === primaryKey)) {
                synced.push({
                    meetingId,
                    videoKey: primaryKey,
                    videoUrl: buildPublicVideoUrl(primaryKey),
                    createdAt: sortedRecs[0]?.createdDateTime,
                    isSecondary: false,
                    source: 'graph',
                });
            }
            if (secondaryKey && !synced.some((s) => s.meetingId === meetingId && s.videoKey === secondaryKey)) {
                synced.push({
                    meetingId,
                    videoKey: secondaryKey,
                    videoUrl: buildPublicVideoUrl(secondaryKey),
                    createdAt: sortedRecs[1]?.createdDateTime ?? sortedRecs[0]?.createdDateTime,
                    isSecondary: true,
                    source: 'graph',
                });
            }

            // Subir lo que falte (máximo 2 grabaciones totales por meeting)
            for (const recording of sortedRecs) {
                if (primaryKey && secondaryKey) break;
                if (uploadsStarted >= MAX_NEW_UPLOADS) break;
                if (!recording.recordingContentUrl) continue;

                console.log(`⬇️ Descargando video para ${meetingId}...`);

                const dlController = new AbortController();
                const dlTimeout = setTimeout(
                    () => dlController.abort(),
                    PER_DOWNLOAD_TIMEOUT_MS
                );

                let videoRes: Response;
                try {
                    videoRes = await fetch(recording.recordingContentUrl, {
                        headers: { Authorization: `Bearer ${token}` },
                        signal: dlController.signal,
                    });
                } catch (e) {
                    console.error(`❌ Error inicio descarga (${meetingId}):`, errMsg(e));
                    clearTimeout(dlTimeout);
                    continue;
                }

                clearTimeout(dlTimeout);
                if (!videoRes.ok || !videoRes.body) continue;

                const videoKey = `${uuidv4()}.mp4`;

                const webStream =
                    videoRes.body as unknown as NodeWebReadableStream<Uint8Array>;
                const nodeStream = Readable.fromWeb(webStream);

                const contentType = videoRes.headers.get('content-type') ?? 'video/mp4';
                const contentLengthHeader = videoRes.headers.get('content-length');
                const contentLength =
                    contentLengthHeader && !Number.isNaN(Number(contentLengthHeader))
                        ? Number(contentLengthHeader)
                        : undefined;

                const uploader = new Upload({
                    client: s3,
                    params: {
                        Bucket: 'artiefy-upload',
                        Key: `video_clase/${videoKey}`,
                        Body: nodeStream,
                        ContentType: contentType,
                        ...(contentLength !== undefined
                            ? { ContentLength: contentLength }
                            : {}),
                    },
                    queueSize: 3,
                    partSize: 10 * 1024 * 1024,
                    leavePartsOnError: false,
                });

                console.log(`⬆️ Subiendo a S3 ${videoKey}...`);

                await uploader.done();

                console.log(`✅ Subido a S3 ${videoKey}`);
                uploadsStarted += 1;

                // Asignar a DB: primero video_key, luego video_key_2 (misma fila objetivo)
                const updatePayload =
                    !primaryKey
                        ? { video_key: videoKey }
                        : { video_key_2: videoKey };

                await withDbRetry(() =>
                    db
                        .update(classMeetings)
                        .set(updatePayload)
                        .where(eq(classMeetings.id, targetRow.id))
                );

                if (!primaryKey) primaryKey = videoKey;
                else secondaryKey = videoKey;

                synced.push({
                    meetingId,
                    videoKey,
                    videoUrl: buildPublicVideoUrl(videoKey),
                    createdAt: recording.createdDateTime,
                    isSecondary: Boolean(primaryKey && primaryKey !== videoKey),
                    source: 'graph',
                });
            }
        } catch (e: unknown) {
            // 👇 este log se queda igual como pediste
            console.error('❌ Error iteración recording:', errMsg(e));
            continue;
        }
    }

    // Deduplicar synced
    const uniqueSynced = Array.from(
        new Map(synced.map((s) => [`${s.meetingId}|${s.videoKey}`, s])).values()
    );

    // ¿hay más por sincronizar?
    const hasMore = Array.from(recordingsByMeeting.entries()).some(
        ([mid, recs]) => {
            const rows = rowsByMeetingId.get(mid) ?? [];
            if (!rows.length) return false;
            const hasPrimary = rows.some((r) => r.video_key);
            const hasSecondary = rows.some((r) => r.video_key_2);

            if (!hasPrimary) return true;
            if (recs.length > 1 && !hasSecondary) return true;
            return false;
        }
    );

    return NextResponse.json({
        synced: uniqueSynced,
        uploadsStarted,
        totalRecordings: recordings.length,
        hasMore,
    });
}
