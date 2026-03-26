'use client';
import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { Card, CardContent } from '~/components/educators/ui/card';
import { Input } from '~/components/educators/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '~/components/educators/ui/tabs';

interface RespuestaArchivo {
  fileName: string;
  submittedAt: string;
  userId: string;
  userName: string;
  status: string;
  grade: number | null;
  fileContent: string; // ✅ Agregar esto
  comment?: string;
}

/**
 * Componente para ver y calificar las respuestas de los estudiantes en una actividad.
 *
 * @param {Object} props - Las propiedades del componente.
 * @param {string} props.activityId - El ID de la actividad para la cual se están viendo las respuestas.
 * @returns {JSX.Element} El componente de React.
 */
export default function VerRespuestasArchivos({
  activityId,
}: {
  activityId: string;
}) {
  const [respuestas, setRespuestas] = useState<
    Record<string, RespuestaArchivo>
  >({});
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [searchFilter, setSearchFilter] = useState('');

  /**
   * Función para obtener las respuestas de los estudiantes desde la API.
   */
  const fetchRespuestas = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const response = await fetch(
          `/api/educadores/respuestas-archivos/${activityId}`
        );
        if (!response.ok) throw new Error('Error al obtener respuestas');
        const data = (await response.json()) as {
          respuestas: Record<string, RespuestaArchivo>;
        };

        if (silent) {
          // Solo actualizar respuestas sin tocar grades/comments que el usuario esté editando
          setRespuestas(data.respuestas);
          // Solo agregar grades/comments para entries NUEVAS que no existían antes
          setGrades((prev) => {
            const updated = { ...prev };
            Object.entries(data.respuestas).forEach(([key, respuesta]) => {
              if (!(key in updated)) {
                updated[key] =
                  respuesta.grade !== null ? respuesta.grade.toString() : '';
              }
            });
            return updated;
          });
          setComments((prev) => {
            const updated = { ...prev };
            Object.entries(data.respuestas).forEach(([key, respuesta]) => {
              if (!(key in updated)) {
                updated[key] = respuesta.comment ?? '';
              }
            });
            return updated;
          });
        } else {
          const initialGrades: Record<string, string> = {};
          const initialComments: Record<string, string> = {};
          Object.entries(data.respuestas).forEach(([key, respuesta]) => {
            initialGrades[key] =
              respuesta.grade !== null ? respuesta.grade.toString() : '';
            initialComments[key] = respuesta.comment ?? '';
          });
          setRespuestas(data.respuestas);
          setGrades(initialGrades);
          setComments(initialComments);
        }
      } catch (error) {
        if (!silent) {
          console.error('Error al cargar respuestas:', error);
          toast('Error', {
            description: 'No se pudieron cargar las respuestas',
          });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [activityId]
  );

  useEffect(() => {
    void fetchRespuestas();
    const interval = setInterval(() => void fetchRespuestas(true), 1000);
    return () => clearInterval(interval);
  }, [fetchRespuestas]);

  /**
   * Función para calificar una respuesta de un estudiante.
   *
   * @param {string} userId - El ID del usuario.
   * @param {string} questionId - El ID de la pregunta.
   * @param {number} grade - La calificación asignada.
   * @param {string} submissionKey - La clave de la respuesta.
   */
  const calificarRespuesta = async (
    userId: string,
    questionId: string,
    grade: number,
    submissionKey: string
  ) => {
    try {
      const response = await fetch('/api/educadores/calificar-archivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          questionId,
          userId,
          grade,
          comment: comments[submissionKey] ?? '', // ✅ Enviar comentario
          submissionKey,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data: RespuestaArchivo;
      };

      if (!response.ok) {
        throw new Error('Error al calificar');
      }

      if (!data.success) {
        throw new Error('La calificación no se guardó correctamente');
      }

      // Actualizar el estado local inmediatamente
      setRespuestas((prev) => ({
        ...prev,
        [submissionKey]: {
          ...prev[submissionKey],
          grade: parseFloat(data.data.grade?.toString() ?? '0'),
          status: 'calificado',
        },
      }));

      setGrades((prev) => ({
        ...prev,
        [submissionKey]: grade.toString(),
      }));

      toast('Éxito', {
        description: 'Calificación guardada correctamente',
      });
    } catch (error) {
      console.error('Error detallado al calificar:', error);
      toast('Error', {
        description:
          error instanceof Error ? error.message : 'Error al calificar',
      });
      throw error;
    }
  };

  /**
   * Función para manejar el cambio de calificación en el input.
   *
   * @param {string} key - La clave de la respuesta.
   * @param {string} value - El valor de la calificación.
   */
  const handleGradeChange = (key: string, value: string) => {
    // Validar que el valor sea un número o vacío
    if (
      value === '' ||
      (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 5)
    ) {
      setGrades((prev) => ({ ...prev, [key]: value }));
    }
  };

  /**
   * Función para enviar la calificación de una respuesta.
   *
   * @param {string} key - La clave de la respuesta.
   */
  const handleSubmitGrade = async (key: string) => {
    const grade = Number(grades[key]);
    if (!isNaN(grade) && grade >= 0 && grade <= 5) {
      try {
        const keyParts = key.split(':');
        const questionId = keyParts[2];
        const userIdReal = keyParts[3]; // 🆕 extraído del submissionKey

        console.log('🔍 handleSubmitGrade', {
          key,
          questionId,
          userIdReal,
          grade,
        });

        await calificarRespuesta(
          userIdReal, // ✅ aquí enviamos el userId correcto
          questionId,
          grade,
          key
        );
      } catch (error) {
        console.error('Error en handleSubmitGrade:', error);
        await fetchRespuestas();
        toast('Error', {
          description:
            'No se pudo guardar la calificación. Intentando recargar los datos.',
        });
      }
    } else {
      toast('Error', {
        description: 'La calificación debe estar entre 0 y 5',
      });
    }
  };

  /**
   * Función para descargar el archivo de una respuesta.
   *
   * @param {string} key - La clave de la respuesta.
   */
  const descargarArchivo = (key: string) => {
    const fileUrl = respuestas[key]?.fileContent;
    if (!fileUrl) {
      toast('Error', {
        description: 'No se encontró el archivo para esta respuesta.',
      });
      return;
    }

    // Abrir directamente en una nueva pestaña o forzar descarga
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = respuestas[key].fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <div>Cargando respuestas...</div>;

  const ITEMS_PER_PAGE = 6;
  const entries = Object.entries(respuestas).filter(([, r]) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    const name = (r.userName ?? '').toLowerCase();
    const id = (r.userId ?? '').toLowerCase();
    return name.includes(term) || id.includes(term);
  });
  const pendientes = entries.filter(([, r]) => !r.grade || r.grade <= 0);
  const calificadas = entries.filter(
    ([, r]) => r.grade !== null && r.grade > 0
  );

  const renderCard = ([key, respuesta]: [string, RespuestaArchivo]) => (
    <Card
      key={key}
      className="
        group/card overflow-hidden rounded-2xl border border-slate-700/50
        bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-md
        backdrop-blur-sm transition-all duration-300
        hover:-translate-y-0.5 hover:border-cyan-500/30
        hover:shadow-[0_8px_30px_rgba(0,200,255,0.08)]
      "
    >
      <CardContent className="space-y-4 p-5">
        {/* Header: nombre + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-white">
              {respuesta.userName && respuesta.userName !== 'user'
                ? respuesta.userName
                : `ID: ${respuesta.userId}`}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {new Date(respuesta.submittedAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`
              shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold
              ${
                respuesta.grade !== null && respuesta.grade > 0
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }
            `}
          >
            {respuesta.grade !== null && respuesta.grade > 0
              ? `${respuesta.grade}/5`
              : 'Pendiente'}
          </span>
        </div>

        {/* Archivo o URL */}
        <div
          className="
            rounded-lg border border-slate-700/40 bg-slate-800/60 px-3 py-2
          "
        >
          {respuesta.fileContent?.startsWith('http') &&
          !respuesta.fileContent.includes('amazonaws.com') ? (
            <p className="truncate text-sm">
              <span className="text-slate-400">URL: </span>
              <a
                href={respuesta.fileContent}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  text-blue-400 underline decoration-blue-400/30
                  underline-offset-2
                  hover:text-blue-300 hover:decoration-blue-300
                "
              >
                {respuesta.fileContent}
              </a>
            </p>
          ) : (
            <p className="truncate text-sm text-slate-300">
              <span className="text-slate-400">Archivo: </span>
              <span className="font-medium text-white">
                {respuesta.fileName}
              </span>
            </p>
          )}
        </div>

        {/* Comentario del docente */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            Comentario para el estudiante
          </label>
          <textarea
            rows={2}
            className="
              w-full resize-none rounded-lg border border-slate-700/40
              bg-slate-800/60 px-3 py-2 text-sm text-white shadow-sm
              transition-colors
              placeholder:text-slate-500
              focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30
              focus:outline-none
            "
            value={comments[key] ?? ''}
            onChange={(e) =>
              setComments((prev) => ({
                ...prev,
                [key]: e.target.value,
              }))
            }
            placeholder="Escribe un comentario..."
          />
        </div>
        {respuesta.comment && (
          <p className="text-xs text-slate-400">
            Guardado: <i className="text-slate-300">{respuesta.comment}</i>
          </p>
        )}

        {/* Calificación + acciones en fila compacta */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Nota (0-5)
            </label>
            <Input
              type="number"
              min="0"
              max="5"
              step="0.1"
              placeholder="0-5"
              className="
                h-9 w-full rounded-lg border-slate-700/40 bg-slate-800/60
                text-center text-sm text-white
                placeholder:text-slate-500
              "
              value={grades[key] ?? ''}
              onChange={(e) => handleGradeChange(key, e.target.value)}
            />
          </div>
          <Button
            onClick={() => handleSubmitGrade(key)}
            className={`
              h-9 rounded-lg px-4 text-sm font-medium transition-all
              ${
                respuesta.status === 'calificado'
                  ? `
                    bg-blue-500 text-white
                    hover:bg-blue-600
                  `
                  : `
                    bg-green-500 text-white
                    hover:bg-green-600
                  `
              }
            `}
          >
            {respuesta.status === 'calificado' ? 'Actualizar' : 'Calificar'}
          </Button>
          {respuesta.fileContent?.startsWith('http') &&
          !respuesta.fileContent.includes('amazonaws.com') ? (
            <a
              href={respuesta.fileContent}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                type="button"
                className="
                  h-9 rounded-lg bg-blue-600 px-4 text-sm text-white
                  hover:bg-blue-700
                "
              >
                Abrir
              </Button>
            </a>
          ) : (
            <Button
              onClick={() => descargarArchivo(key)}
              className="
                h-9 rounded-lg bg-slate-600 px-4 text-sm text-white
                hover:bg-slate-700
              "
            >
              Descargar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const PaginatedGrid = ({
    items,
    emptyMsg,
  }: {
    items: [string, RespuestaArchivo][];
    emptyMsg: string;
  }) => {
    const [page, setPage] = useState(0);
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const paginated = items.slice(
      page * ITEMS_PER_PAGE,
      (page + 1) * ITEMS_PER_PAGE
    );

    if (items.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-slate-400">{emptyMsg}</p>
      );
    }

    return (
      <>
        <div
          className="
            grid gap-4
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          {paginated.map(renderCard)}
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="
                h-8 rounded-lg border-slate-700 bg-slate-800 text-xs
                text-slate-300
                hover:bg-slate-700
                disabled:opacity-40
              "
            >
              Anterior
            </Button>
            <span className="px-2 text-xs text-slate-400">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="
                h-8 rounded-lg border-slate-700 bg-slate-800 text-xs
                text-slate-300
                hover:bg-slate-700
                disabled:opacity-40
              "
            >
              Siguiente
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div>
      <h2 className="my-2 ml-4 text-xl font-semibold text-blue-600">
        Respuestas de los Estudiantes
      </h2>
      <div className="mb-3 px-2">
        <Input
          type="text"
          placeholder="Buscar por nombre de estudiante..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="
            h-9 max-w-sm rounded-lg border-slate-700/40 bg-slate-800/60 text-sm
            text-white
            placeholder:text-slate-500
          "
        />
      </div>
      <Tabs defaultValue="pendientes" className="px-2 pb-4">
        <TabsList className="mb-4">
          <TabsTrigger value="pendientes">
            Por Calificar ({pendientes.length})
          </TabsTrigger>
          <TabsTrigger value="calificadas">
            Calificadas ({calificadas.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pendientes">
          <PaginatedGrid
            items={pendientes}
            emptyMsg="No hay respuestas pendientes por calificar"
          />
        </TabsContent>
        <TabsContent value="calificadas">
          <PaginatedGrid
            items={calificadas}
            emptyMsg="No hay respuestas calificadas aún"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
