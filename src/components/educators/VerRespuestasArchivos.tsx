"use client";
import { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";

import { Button } from "~/components/educators/ui/button";
import { Card, CardContent } from "~/components/educators/ui/card";
import { Input } from "~/components/educators/ui/input";

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

  /**
   * Función para obtener las respuestas de los estudiantes desde la API.
   */
  const fetchRespuestas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/educadores/respuestas-archivos/${activityId}`,
      );
      if (!response.ok) throw new Error("Error al obtener respuestas");
      const data = (await response.json()) as {
        respuestas: Record<string, RespuestaArchivo>;
      };

      // Inicializar las calificaciones con los valores de la base de datos
      const initialGrades: Record<string, string> = {};
      const initialComments: Record<string, string> = {};

      Object.entries(data.respuestas).forEach(([key, respuesta]) => {
        const grade = respuesta.grade;
        initialComments[key] = respuesta.comment ?? "";
        initialGrades[key] = grade !== null ? grade.toString() : "";
      });

      setComments(initialComments); // ✅ AGREGA ESTA LÍNEA

      setRespuestas(data.respuestas);
      setGrades(initialGrades);
    } catch (error) {
      console.error("Error al cargar respuestas:", error);
      toast("Error", {
        description: "No se pudieron cargar las respuestas",
      });
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    void fetchRespuestas();
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
    submissionKey: string,
  ) => {
    try {
      const response = await fetch("/api/educadores/calificar-archivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          questionId,
          userId,
          grade,
          comment: comments[submissionKey] ?? "", // ✅ Enviar comentario
          submissionKey,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data: RespuestaArchivo;
      };

      if (!response.ok) {
        throw new Error("Error al calificar");
      }

      if (!data.success) {
        throw new Error("La calificación no se guardó correctamente");
      }

      // Actualizar el estado local inmediatamente
      setRespuestas((prev) => ({
        ...prev,
        [submissionKey]: {
          ...prev[submissionKey],
          grade: parseFloat(data.data.grade?.toString() ?? "0"),
          status: "calificado",
        },
      }));

      setGrades((prev) => ({
        ...prev,
        [submissionKey]: grade.toString(),
      }));

      toast("Éxito", {
        description: "Calificación guardada correctamente",
      });
    } catch (error) {
      console.error("Error detallado al calificar:", error);
      toast("Error", {
        description:
          error instanceof Error ? error.message : "Error al calificar",
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
      value === "" ||
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
        const keyParts = key.split(":");
        const questionId = keyParts[2];
        const userIdReal = keyParts[3]; // 🆕 extraído del submissionKey

        console.log("🔍 handleSubmitGrade", {
          key,
          questionId,
          userIdReal,
          grade,
        });

        await calificarRespuesta(
          userIdReal, // ✅ aquí enviamos el userId correcto
          questionId,
          grade,
          key,
        );
      } catch (error) {
        console.error("Error en handleSubmitGrade:", error);
        await fetchRespuestas();
        toast("Error", {
          description:
            "No se pudo guardar la calificación. Intentando recargar los datos.",
        });
      }
    } else {
      toast("Error", {
        description: "La calificación debe estar entre 0 y 5",
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
      toast("Error", {
        description: "No se encontró el archivo para esta respuesta.",
      });
      return;
    }

    // Abrir directamente en una nueva pestaña o forzar descarga
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = respuestas[key].fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <div>Cargando respuestas...</div>;

  return (
    <div>
      <h2 className="my-2 ml-4 text-xl font-semibold text-blue-600">
        Respuestas de los Estudiantes
      </h2>
      <div className="grid gap-4 px-2 pb-4 md:grid-cols-2">
        {Object.entries(respuestas).length > 0 ? (
          Object.entries(respuestas).map(([key, respuesta]) => {
            console.log("🔍 Respuesta en frontend:", respuesta);

            return (
              <Card
                key={key}
                className="border-slate-200 transition-all hover:shadow-lg"
              >
                <CardContent className="space-y-6 p-6">
                  {/* Encabezado con datos del estudiante */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Estudiante:{" "}
                      {respuesta.userName && respuesta.userName !== "user"
                        ? respuesta.userName
                        : `ID: ${respuesta.userId}`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Archivo: <b>{respuesta.fileName}</b>
                    </p>
                    <p className="text-sm text-gray-500">
                      Enviado:{" "}
                      {new Date(respuesta.submittedAt).toLocaleString()}
                    </p>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        respuesta.status === "pendiente"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {respuesta.status === "calificado"
                        ? "✅ Calificado"
                        : "⏳ Pendiente"}
                    </span>
                  </div>

                  {/* Comentario del docente */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Comentario para el estudiante:
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      value={comments[key] ?? ""}
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
                    <p className="mt-1 text-sm text-gray-500">
                      Último comentario guardado: <i>{respuesta.comment}</i>
                    </p>
                  )}

                  {/* Zona de calificación y acciones */}
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    {/* Calificación */}
                    <div className="space-y-2 md:w-1/3">
                      <label className="block text-sm font-medium text-gray-700">
                        Calificación (0 - 5):
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        placeholder="0-5"
                        className="w-full border-slate-300 text-center"
                        value={grades[key] ?? ""}
                        onChange={(e) => handleGradeChange(key, e.target.value)}
                      />
                      <Button
                        onClick={() => handleSubmitGrade(key)}
                        className={`w-full transition-colors ${
                          respuesta.status === "calificado"
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        {respuesta.status === "calificado"
                          ? "Actualizar Nota"
                          : "✓ Enviar Nota"}
                      </Button>
                    </div>

                    {/* Acción de descarga */}
                    <div className="md:w-1/3">
                      <Button
                        onClick={() => descargarArchivo(key)}
                        className="w-full border-slate-300 bg-gray-100 text-black hover:bg-blue-50"
                      >
                        Descargar archivo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="col-span-2 text-center text-gray-500">
            No hay respuestas disponibles
          </p>
        )}
      </div>
    </div>
  );
}
