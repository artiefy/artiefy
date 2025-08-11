'use client';

import { useState } from 'react';

import { ScheduledMeeting } from '../modals/ModalScheduleMeeting';

interface ScheduledMeetingsListProps {
  meetings: (ScheduledMeeting & { videoUrl?: string | null })[];
  color: string;
}

export const ScheduledMeetingsList = ({
  meetings,
}: ScheduledMeetingsListProps) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [videoToShow, setVideoToShow] = useState<string | null>(null);

  if (!meetings?.length) {
    return <p className="text-muted text-sm">No hay clases agendadas.</p>;
  }

  const formatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const groupedMeetings = meetings.reduce<
    Record<string, (ScheduledMeeting & { videoUrl?: string | null })[]>
  >((acc, meeting) => {
    const rawTitle = meeting.title || 'Sin título';
    const baseTitle = rawTitle.split('(Clase')[0]?.trim() || 'Sin título';
    if (!acc[baseTitle]) acc[baseTitle] = [];
    acc[baseTitle].push(meeting);
    return acc;
  }, {});

  return (
    <div className="mt-6 space-y-6">
      {Object.entries(groupedMeetings).map(([titleBase, groupMeetings]) => (
        <div
          key={titleBase}
          className="rounded-2xl border border-gray-800 bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 shadow-2xl transition-all duration-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">{titleBase}</h3>
              <p className="text-sm text-gray-400">
                {groupMeetings.length} clases programadas
              </p>
            </div>
            <button
              onClick={() =>
                setOpenGroup(openGroup === titleBase ? null : titleBase)
              }
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500"
            >
              {openGroup === titleBase ? 'Ocultar' : 'Ver más'}
            </button>
          </div>

          <div
            className={`grid overflow-hidden transition-all duration-500 ${
              openGroup === titleBase
                ? 'mt-6 scale-100 grid-cols-1 gap-4 opacity-100'
                : 'max-h-0 scale-95 opacity-0'
            }`}
          >
            {groupMeetings.map((m, idx) => {
              const start = new Date(m.startDateTime);
              const end = new Date(m.endDateTime);
              const isValidStart = !isNaN(start.getTime());
              const isValidEnd = !isNaN(end.getTime());

              return (
                <div
                  key={idx}
                  className="group relative rounded-xl border border-gray-700 bg-[#111827] p-5 shadow-lg transition hover:border-blue-500 hover:shadow-blue-700/40"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <p className="text-base font-semibold text-white">
                      {m.title}
                    </p>
                    <span className="text-xs text-gray-400">
                      Semana {m.weekNumber}
                    </span>
                  </div>

                  {isValidStart && isValidEnd ? (
                    <p className="mb-2 text-sm text-gray-300">
                      🕒 {formatter.format(start)} →{' '}
                      {end.toLocaleTimeString('es-CO')}
                    </p>
                  ) : (
                    <p className="mb-2 text-sm text-red-400">
                      ⚠️ Fecha inválida o faltante
                    </p>
                  )}

                  {m.joinUrl && (
                    <a
                      href={m.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-400 underline decoration-dotted transition hover:text-blue-300"
                    >
                      🔗 Enlace de clase
                    </a>
                  )}

                  {m.videoUrl && (
                    <div className="mt-3">
                      <button
                        onClick={() => setVideoToShow(m.videoUrl!)}
                        className="inline-flex items-center gap-2 rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-green-500"
                      >
                        ▶️ Ver grabación
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
