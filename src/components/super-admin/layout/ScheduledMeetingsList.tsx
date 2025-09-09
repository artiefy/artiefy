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

  // --- Logs iniciales ---
  console.log('📌 Meetings recibidas en ScheduledMeetingsList:', meetings);
  const aws = (process.env.NEXT_PUBLIC_AWS_S3_URL ?? '').replace(/\/+$/, '');
  console.log('🔧 AWS base URL normalizada:', aws);

  if (!meetings?.length) {
    console.log('ℹ️ No hay clases agendadas para mostrar.');
    return <p className="text-muted text-sm">No hay clases agendadas.</p>;
  }

  // --- Zona horaria target para mostrar ---
  const tz = 'America/Bogota';
  console.log('🕰️ Zona horaria fija para UI:', tz);

  const formatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: tz,
  });

  // Si el string no trae zona, asumimos Bogotá (-05:00)
  const ensureDate = (isoLike: string) => {
    const hasTZ = /Z$|[+-]\d{2}:\d{2}$/.test(isoLike);
    const finalString = hasTZ ? isoLike : `${isoLike}-05:00`;
    const d = new Date(finalString);
    console.log('🧪 ensureDate()', {
      raw: isoLike,
      hasTZ,
      finalString,
      parsedISO: d.toISOString(),
      localPreview: d.toString(),
    });
    return d;
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

  const handleDeleteGroup = async (group: UIMeeting[]) => {
    if (!confirm(`¿Seguro que quieres eliminar estas ${group.length} clases y sus videos?`)) return;

    try {
      for (const m of group) {
        const res = await fetch('/api/super-admin/teams/delete', {
          method: 'DELETE',
          body: JSON.stringify({ id: m.id, video_key: m.video_key }),
          headers: { 'Content-Type': 'application/json' },
        });
        const data: unknown = await res.json();
        const { error } = data as { error?: string };
        if (!res.ok) throw new Error(error ?? "Error eliminando");
      }

      alert('Grupo eliminado correctamente');
      setOpenGroup(null); // opcional: cerrar el grupo
      setVideoToShow(null); // opcional: cerrar video si estaba abierto
      window.location.reload(); // 🔹 refresca la página

    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "error" in err &&
        typeof (err as Record<string, unknown>).error === "string"
      ) {
        console.error((err as Record<string, string>).error);
      } else {
        console.error(err);
      }
      alert("Error eliminando grupo"); // o clase
    }


  };


  const handleDelete = async (m: UIMeeting) => {
    if (!confirm('¿Seguro que quieres eliminar esta clase y su video?')) return;

    try {
      const res = await fetch('/api/super-admin/teams/delete', {
        method: 'DELETE',
        body: JSON.stringify({ id: m.id, video_key: m.video_key }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data: unknown = await res.json();
      const { error } = data as { error?: string };
      if (!res.ok) throw new Error(error ?? "Error eliminando");


      // 3) Actualizar UI
      setVideoToShow((prev) => (prev === m.videoUrl ? null : prev));
      setOpenGroup(null); // opcional: cerrar grupo para refrescar
      alert('Clase eliminada correctamente');
      window.location.reload(); // 🔹 refresca la página
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "error" in err &&
        typeof (err as Record<string, unknown>).error === "string"
      ) {
        console.error((err as Record<string, string>).error);
      } else {
        console.error(err);
      }
      alert("Error eliminando clase");
    }


  };


  // Extrae días únicos por grupo (usando ensureDate y tz fija)
  const getDaysOfWeek = (group: ScheduledMeeting[]) => {
    const days = group.map((m) =>
      ensureDate(m.startDateTime).toLocaleDateString('es-CO', {
        weekday: 'long',
        timeZone: tz,
      })
    );
    const unique = Array.from(new Set(days));
    return unique.join(', ');
  };

  console.log('🧩 Grupos por título principal:', groupedByMainTitle);

  return (
    <div className="mt-6 space-y-6">
      {Object.entries(groupedByMainTitle).map(([mainTitle, groupMeetings]) => {
        const subGroups = groupMeetings.reduce<Record<string, UIMeeting[]>>(
          (acc, meeting) => {
            const fullTitle = meeting.title || 'Sin título';
            if (!acc[fullTitle]) acc[fullTitle] = [];
            acc[fullTitle].push(meeting as UIMeeting); // ⚡ cast
            return acc;
          },
          {}
        );

        const daysText = getDaysOfWeek(groupMeetings);
        console.log('📚 Subgrupos para', mainTitle, subGroups);

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
                  onClick={() => handleDeleteGroup(groupMeetings)}
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
                      {classes.map((m, idx) => {
                        const start = ensureDate(m.startDateTime);
                        const end = ensureDate(m.endDateTime);

                        const isValidStart = !isNaN(start.getTime());
                        const isValidEnd = !isNaN(end.getTime());

                        const key = m.video_key;
                        const finalVideo =
                          m.videoUrl ??
                          (key ? `${aws}/video_clase/${key}` : null);

                        console.log('🧾 Clase item', {
                          idx,
                          title: m.title,
                          startRaw: m.startDateTime,
                          endRaw: m.endDateTime,
                          startISO: start.toISOString(),
                          endISO: end.toISOString(),
                          isValidStart,
                          isValidEnd,
                          joinUrl: m.joinUrl,
                          finalVideo,
                        });

                        const endShort = new Intl.DateTimeFormat('es-CO', {
                          timeStyle: 'medium',
                          timeZone: tz,
                        }).format(end);

                        return (
                          <li key={idx} className="text-sm text-gray-300">
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
                            <button
                              type="button"
                              onClick={() => handleDelete(m)}
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
