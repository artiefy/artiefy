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
  videoUrlExt?: string | null;
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

const detectVideoType = (
  url: string
): 'youtube' | 'teams' | 'meet' | 'loom' | 'iframe' | 'direct' => {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/teams\.microsoft\.com/i.test(url)) return 'teams';
  if (/meet\.google\.com/i.test(url)) return 'meet';
  if (/loom\.com/i.test(url)) return 'loom';
  if (/vimeo\.com|zoom\.us\/rec/i.test(url)) return 'iframe';
  return 'direct';
};

const getYoutubeEmbedUrl = (url: string): string => {
  const match =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(
      url
    );
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
};

const getLoomEmbedUrl = (url: string): string => {
  return url.replace('loom.com/share/', 'loom.com/embed/');
};

const buildFinalVideoUrls = (meeting: UIMeeting, awsBase: string): string[] => {
  const urls: string[] = [];

  const key1 = (meeting.video_key ?? '').toString().trim();
  if (key1) urls.push(`${awsBase}/video_clase/${key1}`);

  const key2 = (meeting.video_key_2 ?? '').toString().trim();
  if (key2) urls.push(`${awsBase}/video_clase/${key2}`);

  const extUrl = (meeting.videoUrlExt ?? '').toString().trim();
  if (extUrl && /^https?:\/\//i.test(extUrl) && !urls.includes(extUrl)) {
    urls.push(extUrl);
  }

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

const getExternalLabel = (type: 'teams' | 'meet' | 'iframe') => {
  if (type === 'teams') return '📹 Grabación de Microsoft Teams';
  if (type === 'meet') return '📹 Grabación de Google Meet';
  return '📹 Video externo';
};

export const ScheduledMeetingsList = ({
  meetings: initialMeetings,
}: ScheduledMeetingsListProps) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [videoToShow, setVideoToShow] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<number | null>(null);
  const [linkForm, setLinkForm] = useState<{
    videoUrlExt: string;
    title: string;
    weekNumber: string;
  }>({ videoUrlExt: '', title: '', weekNumber: '' });
  const [savingLink, setSavingLink] = useState(false);
  const [localMeetings, setLocalMeetings] =
    useState<UIMeeting[]>(initialMeetings);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  const handleSaveLink = async (meeting: UIMeeting) => {
    if (!linkForm.videoUrlExt.trim()) return;
    setSavingLink(true);
    try {
      const res = await fetch(`/api/super-admin/teams/update-meeting`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: meeting.id,
          videoUrlExt: linkForm.videoUrlExt.trim(),
          title: linkForm.title.trim() || meeting.title,
          weekNumber: linkForm.weekNumber
            ? Number(linkForm.weekNumber)
            : meeting.weekNumber,
        }),
      });
      if (!res.ok) throw new Error('Error guardando');
      setLocalMeetings((prev) =>
        prev.map((m) =>
          m.id === meeting.id
            ? {
                ...m,
                videoUrlExt: linkForm.videoUrlExt.trim(),
                title: linkForm.title.trim() || m.title,
                weekNumber: linkForm.weekNumber
                  ? Number(linkForm.weekNumber)
                  : m.weekNumber,
              }
            : m
        )
      );
      setEditingLinkId(null);
      setLinkForm({ videoUrlExt: '', title: '', weekNumber: '' });
    } catch (e) {
      console.error(e);
      showToast('Error al guardar el link', 'error');
    } finally {
      setSavingLink(false);
    }
  };

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
    return localMeetings.reduce<Record<string, UIMeeting[]>>((acc, meeting) => {
      const rawTitle = meeting.title ?? 'Sin título';
      const match = /^(.+?)(\s*\(.+\))?$/.exec(rawTitle);
      const base = match?.[1]?.trim() ?? 'Sin título';

      if (!acc[base]) acc[base] = [];
      acc[base].push(meeting);
      return acc;
    }, {});
  }, [localMeetings]);

  const handleDeleteGroup = useCallback(
    async (group: UIMeeting[]) => {
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

        const groupIds = group.map((m) => m.id);
        setLocalMeetings((prev) =>
          prev.filter((m) => !groupIds.includes(m.id))
        );
        setOpenGroup(null);
        setVideoToShow(null);
        showToast('Grupo eliminado correctamente', 'success');
      } catch (error) {
        console.error(error);
        showToast('Error eliminando grupo', 'error');
      }
    },
    [showToast]
  );

  const handleDeleteSingle = useCallback(
    async (meeting: UIMeeting) => {
      const ok = confirm('¿Seguro que quieres eliminar esta clase y su video?');
      if (!ok) return;

      try {
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

        setLocalMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
        setVideoToShow((prev) => (prev === meeting.videoUrl ? null : prev));
        showToast('Clase eliminada correctamente', 'success');
      } catch (error) {
        console.error(error);
        showToast('Error eliminando clase', 'error');
      }
    },
    [showToast]
  );

  if (!localMeetings?.length) {
    return <p className="text-sm text-muted">No hay clases agendadas.</p>;
  }

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[9999999] rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.message}
        </div>
      )}
      <div className="mt-6 space-y-6">
        {Object.entries(groupedByMainTitle)
          .sort(([, a], [, b]) => {
            const aMin = Math.min(
              ...a.map((m) => ensureDate(m.startDateTime).getTime())
            );
            const bMin = Math.min(
              ...b.map((m) => ensureDate(m.startDateTime).getTime())
            );
            return bMin - aMin;
          })
          .map(([mainTitle, groupMeetings]) => {
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
                className="
                rounded-2xl border border-gray-800 bg-gradient-to-br
                from-[#0f172a] to-[#1e293b] p-6 shadow-2xl transition-all
                duration-500
              "
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {mainTitle}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {groupMeetings.length} clases programadas — {daysText}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {(() => {
                        const dates = groupMeetings
                          .map((m) => ensureDate(m.startDateTime).getTime())
                          .filter((t) => !Number.isNaN(t));
                        if (!dates.length) return null;
                        const oldest = new Date(Math.min(...dates));
                        const newest = new Date(Math.max(...dates));
                        const fmt = new Intl.DateTimeFormat('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          timeZone: TIMEZONE,
                        });
                        return `${fmt.format(oldest)} → ${fmt.format(newest)}`;
                      })()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setOpenGroup(openGroup === mainTitle ? null : mainTitle)
                      }
                      className="
                      rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold
                      text-white shadow-md transition
                      hover:bg-blue-500
                    "
                    >
                      {openGroup === mainTitle ? 'Ocultar' : 'Ver más'}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteGroup(groupMeetings)}
                      className="
                      rounded bg-red-600 px-3 py-1 text-sm text-white
                      hover:bg-red-500
                    "
                    >
                      🗑 Eliminar todas las clases
                    </button>
                  </div>
                </div>

                {openGroup === mainTitle && (
                  <div className="mt-6 space-y-4">
                    {Object.entries(subGroups)
                      .sort(([, a], [, b]) => {
                        const aMin = Math.min(
                          ...a.map((m) => ensureDate(m.startDateTime).getTime())
                        );
                        const bMin = Math.min(
                          ...b.map((m) => ensureDate(m.startDateTime).getTime())
                        );
                        return bMin - aMin;
                      })
                      .map(([fullTitle, classes]) => (
                        <div
                          key={fullTitle}
                          className="
                          rounded-xl border border-gray-700 bg-[#111827] p-5
                          shadow-md
                        "
                        >
                          <p className="mb-2 text-base font-semibold text-white">
                            {fullTitle}
                          </p>

                          <ul className="space-y-2">
                            {classes
                              .slice()
                              .sort((a, b) => {
                                const aTime = ensureDate(
                                  a.startDateTime
                                ).getTime();
                                const bTime = ensureDate(
                                  b.startDateTime
                                ).getTime();
                                return aTime - bTime;
                              })
                              .map((meeting, index) => {
                                const start = ensureDate(meeting.startDateTime);
                                const end = ensureDate(meeting.endDateTime);

                                const isValidStart = !Number.isNaN(
                                  start.getTime()
                                );
                                const isValidEnd = !Number.isNaN(end.getTime());

                                const finalVideos = buildFinalVideoUrls(
                                  meeting,
                                  awsBase
                                );
                                const hasVideo = finalVideos.length > 0;

                                const endShort = new Intl.DateTimeFormat(
                                  'es-CO',
                                  {
                                    timeStyle: 'medium',
                                    timeZone: TIMEZONE,
                                  }
                                ).format(end);

                                const itemKey =
                                  meeting.id || meeting.meetingId
                                    ? `${meeting.id}-${meeting.meetingId}`
                                    : `${fullTitle}-${index}`;

                                return (
                                  <li
                                    key={itemKey}
                                    className="text-sm text-gray-300"
                                  >
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
                                        className="
                                        mr-3 inline-block text-blue-400
                                        underline transition
                                        hover:text-blue-300
                                      "
                                      >
                                        🔗 Enlace de clase
                                      </a>
                                    )}

                                    {hasVideo && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {finalVideos.map(
                                          (videoUrl, videoIdx) => (
                                            <button
                                              key={videoUrl}
                                              type="button"
                                              onClick={() =>
                                                setVideoToShow(videoUrl)
                                              }
                                              className="
                                            inline-block rounded bg-green-600
                                            px-3 py-1 text-sm text-white
                                            hover:bg-green-500
                                          "
                                            >
                                              🎥 Grabación{' '}
                                              {finalVideos.length > 1
                                                ? `${videoIdx + 1}`
                                                : ''}
                                            </button>
                                          )
                                        )}
                                      </div>
                                    )}

                                    {/* Botón para abrir el form de link externo */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingLinkId(
                                          meeting.id === editingLinkId
                                            ? null
                                            : meeting.id
                                        );
                                        setLinkForm({
                                          videoUrlExt: '',
                                          title: meeting.title ?? '',
                                          weekNumber: String(
                                            meeting.weekNumber ?? ''
                                          ),
                                        });
                                      }}
                                      className="
                                      mt-2 inline-block rounded border
                                      border-cyan-600 px-3 py-1 text-sm
                                      text-cyan-400 transition
                                      hover:bg-cyan-600 hover:text-white
                                    "
                                    >
                                      🔗{' '}
                                      {editingLinkId === meeting.id
                                        ? 'Cancelar'
                                        : 'Agregar link externo'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleDeleteSingle(meeting)
                                      }
                                      className="
                                      mt-2 ml-2 rounded bg-red-600 px-3 py-1
                                      text-sm text-white
                                      hover:bg-red-500
                                    "
                                    >
                                      🗑 Eliminar clase
                                    </button>

                                    {editingLinkId === meeting.id && (
                                      <div
                                        className="
                                        mt-3 space-y-3 rounded-xl border
                                        border-cyan-700/40 bg-[#0d1726] p-4
                                      "
                                      >
                                        <p
                                          className="
                                        text-xs font-semibold tracking-wide
                                        text-cyan-400 uppercase
                                      "
                                        >
                                          Datos de la clase
                                        </p>

                                        <div>
                                          <label
                                            className="
                                          mb-1 block text-xs text-gray-400
                                        "
                                          >
                                            Título de la clase
                                          </label>
                                          <input
                                            type="text"
                                            value={linkForm.title}
                                            onChange={(e) =>
                                              setLinkForm((p) => ({
                                                ...p,
                                                title: e.target.value,
                                              }))
                                            }
                                            placeholder="Ej: Clase 1 - Introducción"
                                            className="
                                            w-full rounded-lg border
                                            border-cyan-700/30 bg-slate-900 px-3
                                            py-2 text-sm text-white
                                            placeholder:text-white/30
                                            focus:border-cyan-500
                                            focus:outline-none
                                          "
                                          />
                                        </div>

                                        <div>
                                          <label
                                            className="
                                          mb-1 block text-xs text-gray-400
                                        "
                                          >
                                            Número de semana
                                          </label>
                                          <input
                                            type="number"
                                            min={1}
                                            value={linkForm.weekNumber}
                                            onChange={(e) =>
                                              setLinkForm((p) => ({
                                                ...p,
                                                weekNumber: e.target.value,
                                              }))
                                            }
                                            placeholder="Ej: 3"
                                            className="
                                            w-full rounded-lg border
                                            border-cyan-700/30 bg-slate-900 px-3
                                            py-2 text-sm text-white
                                            placeholder:text-white/30
                                            focus:border-cyan-500
                                            focus:outline-none
                                          "
                                          />
                                        </div>

                                        <div>
                                          <label
                                            className="
                                          mb-1 block text-xs text-gray-400
                                        "
                                          >
                                            Link de grabación externa{' '}
                                            <span className="text-cyan-400">
                                              *
                                            </span>
                                          </label>
                                          <input
                                            type="url"
                                            value={linkForm.videoUrlExt}
                                            onChange={(e) =>
                                              setLinkForm((p) => ({
                                                ...p,
                                                videoUrlExt: e.target.value,
                                              }))
                                            }
                                            placeholder="https://zoom.us/rec/... o https://loom.com/..."
                                            className="
                                            w-full rounded-lg border
                                            border-cyan-700/30 bg-slate-900 px-3
                                            py-2 text-sm text-white
                                            placeholder:text-white/30
                                            focus:border-cyan-500
                                            focus:outline-none
                                          "
                                          />
                                        </div>

                                        <div className="flex gap-2 pt-1">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void handleSaveLink(meeting)
                                            }
                                            disabled={
                                              savingLink ||
                                              !linkForm.videoUrlExt.trim()
                                            }
                                            className="
                                            rounded-lg bg-cyan-600 px-4 py-2
                                            text-sm font-semibold text-white
                                            transition
                                            hover:bg-cyan-500
                                            disabled:opacity-50
                                          "
                                          >
                                            {savingLink
                                              ? 'Guardando...'
                                              : '💾 Guardar'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditingLinkId(null)
                                            }
                                            className="
                                            rounded-lg border border-white/20
                                            px-4 py-2 text-sm text-white/60
                                            transition
                                            hover:text-white
                                          "
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                      </div>
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

        {/* ── Modal de video ── */}
        {videoToShow && (
          <div
            className="
            fixed inset-0 z-[999999] flex items-center justify-center
            bg-black/80
          "
            onClick={() => setVideoToShow(null)}
          >
            <div
              className="
              relative w-[92%] max-w-4xl rounded-xl bg-[#0f172a] p-5 shadow-2xl
            "
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setVideoToShow(null)}
                className="
                absolute top-3 right-3 z-[999999] rounded-full bg-black/40 px-2
                py-1 text-white
                hover:text-red-400
              "
                aria-label="Cerrar video"
                type="button"
              >
                ✖
              </button>

              {(() => {
                const type = detectVideoType(videoToShow);

                // S3 / mp4 directo
                if (type === 'direct') {
                  return (
                    <video
                      controls
                      autoPlay
                      className="w-full rounded-lg border border-gray-700"
                    >
                      <source src={videoToShow} type="video/mp4" />
                      Tu navegador no soporta la reproducción de video.
                    </video>
                  );
                }

                // YouTube — embed oficial
                if (type === 'youtube') {
                  return (
                    <div className="aspect-video w-full">
                      <iframe
                        src={getYoutubeEmbedUrl(videoToShow)}
                        className="size-full rounded-lg"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  );
                }

                // Loom — embed oficial
                if (type === 'loom') {
                  return (
                    <div className="aspect-video w-full">
                      <iframe
                        src={getLoomEmbedUrl(videoToShow)}
                        className="size-full rounded-lg"
                        allowFullScreen
                        allow="autoplay"
                      />
                    </div>
                  );
                }

                // Teams / Meet / Zoom / Vimeo — bloquean iframes, abrir en nueva pestaña
                return (
                  <div className="flex flex-col items-center gap-4 py-10 text-center">
                    <p className="text-lg font-semibold text-white">
                      {getExternalLabel(type as 'teams' | 'meet' | 'iframe')}
                    </p>
                    <p className="text-sm text-gray-400">
                      Este tipo de video no se puede reproducir directamente
                      aquí.
                    </p>
                    <a
                      href={videoToShow}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="
                      rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-semibold
                      text-white
                      hover:bg-cyan-500
                    "
                    >
                      🔗 Abrir grabación →
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
