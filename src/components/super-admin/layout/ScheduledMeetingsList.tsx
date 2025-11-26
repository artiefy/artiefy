'use client';

import React, { useCallback, useMemo, useState } from 'react';

import { ScheduledMeeting } from '../modals/ModalScheduleMeeting';

type UIMeeting = ScheduledMeeting & {
  id: number;
  meetingId: string;
  joinUrl?: string | null;
  recordingContentUrl?: string | null;
  videoUrl?: string | null;
  video_key?: string | null;
  video_key_2?: string | null;
};

interface ScheduledMeetingsListProps {
  meetings: UIMeeting[];
  color: string;
}

const TIMEZONE = 'America/Bogota';

const hasTimezoneInfo = (isoLike: string) =>
  /Z$|[+-]\d{2}:\d{2}$/.test(isoLike);

const ensureDate = (isoLike: string): Date => {
  const safe = isoLike?.trim() ?? '';
  if (!safe) return new Date(NaN);
  const finalString = hasTimezoneInfo(safe) ? safe : `${safe}-05:00`;
  return new Date(finalString);
};

const buildFinalVideoUrls = (meeting: UIMeeting, awsBase: string): string[] => {
  const urls: string[] = [];

  const key1 = (meeting.video_key ?? '').toString().trim();
  if (key1) urls.push(`${awsBase}/video_clase/${key1}`);

  const key2 = (meeting.video_key_2 ?? '').toString().trim();
  if (key2) urls.push(`${awsBase}/video_clase/${key2}`);

  const rawUrl = (meeting.videoUrl ?? '').toString().trim();
  const isValidRawUrl =
    rawUrl &&
    !/^(null|undefined)$/i.test(rawUrl) &&
    /^https?:\/\//i.test(rawUrl);

  if (isValidRawUrl && !urls.includes(rawUrl)) urls.push(rawUrl);

  return urls;
};

const getDaysOfWeek = (group: UIMeeting[]) => {
  const days = group
    .map((m) =>
      ensureDate(m.startDateTime).toLocaleDateString('es-CO', {
        weekday: 'long',
        timeZone: TIMEZONE,
      })
    )
    .filter(Boolean);

  return Array.from(new Set(days)).join(', ');
};

export const ScheduledMeetingsList = ({
  meetings,
}: ScheduledMeetingsListProps) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [videoToShow, setVideoToShow] = useState<string | null>(null);

  const awsBase = useMemo(
    () => (process.env.NEXT_PUBLIC_AWS_S3_URL ?? '').replace(/\/+$/, ''),
    []
  );

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: TIMEZONE,
      }),
    []
  );

  const groupedByMainTitle = useMemo(() => {
    return meetings.reduce<Record<string, UIMeeting[]>>((acc, meeting) => {
      const rawTitle = meeting.title ?? 'Sin título';
      const match = /^(.+?)(\s*\(.+\))?$/.exec(rawTitle);
      const base = match?.[1]?.trim() ?? 'Sin título';

      if (!acc[base]) acc[base] = [];
      acc[base].push(meeting);
      return acc;
    }, {});
  }, [meetings]);

  const handleDeleteGroup = useCallback(async (group: UIMeeting[]) => {
    const ok = confirm(
      `¿Seguro que quieres eliminar estas ${group.length} clases y sus videos?`
    );
    if (!ok) return;

    try {
      for (const meeting of group) {
        const res = await fetch('/api/super-admin/teams/delete', {
          method: 'DELETE',
          body: JSON.stringify({
            id: meeting.id,
            video_key: meeting.video_key,
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Error eliminando');
      }

      alert('Grupo eliminado correctamente');
      setOpenGroup(null);
      setVideoToShow(null);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Error eliminando grupo');
    }
  }, []);

  const handleDeleteSingle = useCallback(async (meeting: UIMeeting) => {
    const ok = confirm('¿Seguro que quieres eliminar esta clase y su video?');
    if (!ok) return;

    try {
      const res = await fetch('/api/super-admin/teams/delete', {
        method: 'DELETE',
        body: JSON.stringify({ id: meeting.id, video_key: meeting.video_key }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Error eliminando');

      setVideoToShow((prev) => (prev === meeting.videoUrl ? null : prev));
      setOpenGroup(null);
      alert('Clase eliminada correctamente');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Error eliminando clase');
    }
  }, []);

  if (!meetings?.length) {
    return <p className="text-muted text-sm">No hay clases agendadas.</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      {Object.entries(groupedByMainTitle).map(([mainTitle, groupMeetings]) => {
        const subGroups = groupMeetings.reduce<Record<string, UIMeeting[]>>(
          (acc, meeting) => {
            const fullTitle = meeting.title || 'Sin título';
            if (!acc[fullTitle]) acc[fullTitle] = [];
            acc[fullTitle].push(meeting);
            return acc;
          },
          {}
        );

        const daysText = getDaysOfWeek(groupMeetings);

        return (
          <div
            key={mainTitle}
            className="rounded-2xl border border-gray-800 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 shadow-2xl transition-all duration-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">{mainTitle}</h3>
                <p className="text-sm text-gray-400">
                  {groupMeetings.length} clases programadas — {daysText}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setOpenGroup(openGroup === mainTitle ? null : mainTitle)
                  }
                  className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500"
                >
                  {openGroup === mainTitle ? 'Ocultar' : 'Ver más'}
                </button>

                <button
                  type="button"
                  onClick={() => void handleDeleteGroup(groupMeetings)}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500"
                >
                  🗑 Eliminar todas las clases
                </button>
              </div>
            </div>

            {openGroup === mainTitle && (
              <div className="mt-6 space-y-4">
                {Object.entries(subGroups).map(([fullTitle, classes]) => (
                  <div
                    key={fullTitle}
                    className="rounded-xl border border-gray-700 bg-[#111827] p-5 shadow-md"
                  >
                    <p className="mb-2 text-base font-semibold text-white">
                      {fullTitle}
                    </p>

                    <ul className="space-y-2">
                      {classes
                        .slice()
                        .sort((a, b) => {
                          const aTime = ensureDate(a.startDateTime).getTime();
                          const bTime = ensureDate(b.startDateTime).getTime();
                          return aTime - bTime;
                        })
                        .map((meeting, index) => {
                          const start = ensureDate(meeting.startDateTime);
                          const end = ensureDate(meeting.endDateTime);

                          const isValidStart = !Number.isNaN(start.getTime());
                          const isValidEnd = !Number.isNaN(end.getTime());

                          const finalVideos = buildFinalVideoUrls(
                            meeting,
                            awsBase
                          );
                          const hasVideo = finalVideos.length > 0;

                          const endShort = new Intl.DateTimeFormat('es-CO', {
                            timeStyle: 'medium',
                            timeZone: TIMEZONE,
                          }).format(end);

                          const itemKey =
                            meeting.id || meeting.meetingId
                              ? `${meeting.id}-${meeting.meetingId}`
                              : `${fullTitle}-${index}`;

                          return (
                            <li key={itemKey} className="text-sm text-gray-300">
                              <p>
                                🕒{' '}
                                {isValidStart && isValidEnd ? (
                                  <>
                                    {formatter.format(start)} → {endShort}
                                  </>
                                ) : (
                                  <span className="text-red-400">
                                    Fecha inválida
                                  </span>
                                )}
                              </p>

                              {meeting.joinUrl && (
                                <a
                                  href={meeting.joinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mr-3 inline-block text-blue-400 underline transition hover:text-blue-300"
                                >
                                  🔗 Enlace de clase
                                </a>
                              )}

                              {hasVideo && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {finalVideos.map((videoUrl, videoIdx) => (
                                    <button
                                      key={videoUrl}
                                      type="button"
                                      onClick={() => setVideoToShow(videoUrl)}
                                      className="inline-block rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-500"
                                    >
                                      🎥 Grabación{' '}
                                      {finalVideos.length > 1
                                        ? `${videoIdx + 1}`
                                        : ''}
                                    </button>
                                  ))}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => void handleDeleteSingle(meeting)}
                                className="mt-2 ml-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-500"
                              >
                                🗑 Eliminar clase
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {videoToShow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="relative w-[90%] max-w-3xl rounded-lg bg-[#111827] p-6 shadow-xl">
            <button
              onClick={() => setVideoToShow(null)}
              className="absolute top-3 right-3 text-white hover:text-red-400"
              aria-label="Cerrar video"
              type="button"
            >
              ✖
            </button>

            <video controls className="w-full rounded border border-gray-600">
              <source src={videoToShow} type="video/mp4" />
              Tu navegador no soporta la reproducción de video.
            </video>
          </div>
        </div>
      )}
    </div>
  );
};
