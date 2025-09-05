'use client';

import { useState } from 'react';

import { ScheduledMeeting } from '../modals/ModalScheduleMeeting';

// ⬇️ añade esto arriba del archivo (después de imports)
type UIMeeting = ScheduledMeeting & {
  id: number;
  meetingId: string;
  joinUrl?: string | null;
  recordingContentUrl?: string | null;
  videoUrl?: string | null;
  video_key?: string | null;
};

interface ScheduledMeetingsListProps {
  meetings: UIMeeting[];
  color: string;
}

export const ScheduledMeetingsList = ({
  meetings,
}: ScheduledMeetingsListProps) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [videoToShow, setVideoToShow] = useState<string | null>(null);
  console.log('📌 Meetings recibidas en ScheduledMeetingsList:', meetings);
  const aws = (process.env.NEXT_PUBLIC_AWS_S3_URL ?? '').replace(/\/+$/, '');

  if (!meetings?.length) {
    return <p className="text-muted text-sm">No hay clases agendadas.</p>;
  }

  const tz = 'America/Bogota';
  const formatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: tz,
  });

  const ensureDate = (isoLike: string) => {
    const hasTZ = /Z$|[+\-]\d{2}:\d{2}$/.test(isoLike);
    return new Date(hasTZ ? isoLike : `${isoLike}Z`);
  };

  const groupedByMainTitle = meetings.reduce<Record<string, UIMeeting[]>>(
    (acc, meeting) => {
      const rawTitle = meeting.title ?? 'Sin título';
      const match = /^(.+?)(\s*\(.+\))?$/.exec(rawTitle);
      const base = match?.[1]?.trim() ?? 'Sin título';
      if (!acc[base]) acc[base] = [];
      acc[base].push(meeting);
      return acc;
    },
    {}
  );

  // Extrae días únicos por grupo
  const getDaysOfWeek = (group: ScheduledMeeting[]) => {
    const days = group.map((m) =>
      new Date(m.startDateTime).toLocaleDateString('es-CO', {
        weekday: 'long',
      })
    );
    const unique = Array.from(new Set(days));
    return unique.join(', ');
  };

  return (
    <div className="mt-6 space-y-6">
      {Object.entries(groupedByMainTitle).map(([mainTitle, groupMeetings]) => {
        const subGroups = groupMeetings.reduce<
          Record<string, ScheduledMeeting[]>
        >((acc, meeting) => {
          const fullTitle = meeting.title || 'Sin título';
          if (!acc[fullTitle]) acc[fullTitle] = [];
          acc[fullTitle].push(meeting);
          return acc;
        }, {});

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
              <button
                onClick={() =>
                  setOpenGroup(openGroup === mainTitle ? null : mainTitle)
                }
                className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500"
              >
                {openGroup === mainTitle ? 'Ocultar' : 'Ver más'}
              </button>
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
                      {classes.map((m, idx) => {
                        const start = ensureDate(m.startDateTime);
                        const end = ensureDate(m.endDateTime);

                        const isValidStart = !isNaN(start.getTime());
                        const isValidEnd = !isNaN(end.getTime());

                        const key = m.video_key;
                        const finalVideo =
                          m.videoUrl ??
                          (key ? `${aws}/video_clase/${key}` : null);

                        return (
                          <li key={idx} className="text-sm text-gray-300">
                            <p>
                              🕒{' '}
                              {isValidStart && isValidEnd ? (
                                <>
                                  {formatter.format(start)} →{' '}
                                  {end.toLocaleTimeString('es-CO')}
                                </>
                              ) : (
                                <span className="text-red-400">
                                  Fecha inválida
                                </span>
                              )}
                            </p>

                            {m.joinUrl && (
                              <a
                                href={m.joinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mr-3 inline-block text-blue-400 underline transition hover:text-blue-300"
                              >
                                🔗 Enlace de clase
                              </a>
                            )}

                            {finalVideo && (
                              <button
                                type="button"
                                onClick={() => setVideoToShow(finalVideo)}
                                className="mt-2 inline-block rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-500"
                              >
                                ▶ Ver grabación
                              </button>
                            )}
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
