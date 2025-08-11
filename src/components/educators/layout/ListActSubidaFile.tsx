"use client";
import { useCallback, useEffect, useState } from "react";

import Image from "next/image";

import { Edit, Trash } from "lucide-react";
import { toast } from "sonner";

import FormActCompletado from "~/components/educators/layout/FormActCompletado";
import { Button } from "~/components/educators/ui/button";
import { Card, CardContent, CardFooter } from "~/components/educators/ui/card";

import type { QuestionFilesSubida } from "~/types/typesActi";

interface QuestionListProps {
  activityId: number;
  onEdit?: (question: QuestionFilesSubida & { tipo: "ARCHIVO" }) => void;
  shouldRefresh?: boolean; // ✅ agregar esta prop
}

const QuestionSubidaList: React.FC<QuestionListProps> = ({
  activityId,
  onEdit,
  shouldRefresh,
}) => {
  const [questions, setQuestions] = useState<QuestionFilesSubida[]>([]); // Estado para las preguntas
  const [editingQuestion, setEditingQuestion] = useState<
    QuestionFilesSubida | undefined
  >(undefined); // Estado para la edición de preguntas
  const [loading, setLoading] = useState(true); // Estado para el estado de carga

  // Función para obtener las preguntas
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/educadores/question/archivos?activityId=${activityId}`,
      );
      if (!response.ok) {
        throw new Error("Error al obtener las preguntas");
      }
      const data = (await response.json()) as {
        success: boolean;
        questionsFilesSubida: QuestionFilesSubida[];
      };

      // Comparar si las preguntas han cambiado antes de actualizar el estado
      const hasQuestionsChanged =
        JSON.stringify(data.questionsFilesSubida) !== JSON.stringify(questions);

      if (hasQuestionsChanged) {
        setQuestions(data.questionsFilesSubida);
      }
    } catch (error) {
      console.error("Error al cargar las preguntas:", error);
      toast("Error", {
        description: "Error al cargar las preguntas",
      });
    } finally {
      setLoading(false);
    }
  }, [activityId, questions]);

  useEffect(() => {
    if (shouldRefresh) {
      void fetchQuestions();
    }
  }, [shouldRefresh, fetchQuestions]);

  // Efecto para obtener las preguntas al cargar el componente y hacer polling si estamos editando
  useEffect(() => {
    void fetchQuestions();

    // Solo hacemos polling si estamos editando
    let interval: NodeJS.Timeout | undefined;
    if (editingQuestion) {
      interval = setInterval(() => {
        void fetchQuestions();
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchQuestions, editingQuestion]);

  // Función para editar una pregunta
  const handleEdit = (question: QuestionFilesSubida) => {
    if (onEdit) {
      onEdit({ ...question, tipo: "ARCHIVO" }); // 👈 Pasar a padre con tipo
    } else {
      setEditingQuestion(question);
    }
  };

  // Función para eliminar una pregunta
  const handleDelete = async (questionId: string) => {
    try {
      const response = await fetch(
        `/api/educadores/question/archivos?activityId=${activityId}&questionId=${questionId}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        // Actualizar el estado local en lugar de hacer fetch
        setQuestions(questions.filter((q) => q.id !== questionId));
        toast("Pregunta eliminada", {
          description: "La pregunta se eliminó correctamente",
        });
      }
    } catch (error) {
      console.error("Error al eliminar la pregunta:", error);
      toast("Error", {
        description: "Error al eliminar la pregunta",
      });
    }
  };

  // Función para manejar el envio del formulario
  const handleFormSubmit = () => {
    setEditingQuestion(undefined);
    void fetchQuestions();
  };

  // Función para cancelar la edición de una pregunta
  const handleCancel = () => {
    setEditingQuestion(undefined);
  };

  // Retorno la vista del componente
  if (loading && questions.length > 0) {
    return <div>Cargando preguntas...</div>;
  }

  // Retorno la vista del componente
  return (
    <div className="my-2 space-y-4">
      {!onEdit && (
        <FormActCompletado
          activityId={activityId}
          onSubmit={handleFormSubmit}
        />
      )}
      {questions.length > 0 ? (
        questions.map((question) => (
          <Card key={question.id} className="border-none shadow-lg">
            {editingQuestion?.id === question.id ? (
              <FormActCompletado
                activityId={activityId}
                editingQuestion={editingQuestion}
                onSubmit={handleFormSubmit}
                onCancel={handleCancel}
              />
            ) : (
              <>
                <CardContent className="space-y-4 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Pregunta de subida de archivos
                  </h3>

                  <div>
                    <p className="text-sm text-gray-600">Pregunta:</p>
                    <p className="font-bold text-gray-900">{question.text}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">
                      Criterios de evaluación:
                    </p>
                    <p className="font-bold text-gray-900">
                      {question.parametros}
                    </p>
                  </div>

                  {/* Imagen complementaria */}
                  {question.portadaKey && (
                    <div>
                      <p className="mb-1 text-sm text-gray-600">
                        Imagen complementaria:
                      </p>
                      <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${question.portadaKey}`}
                        alt="Imagen complementaria"
                        width={800} // Ajusta según tu diseño
                        height={450}
                        className="max-h-60 w-full rounded-md border object-cover shadow"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}

                  {/* Archivo de ayuda */}
                  {question.archivoKey && (
                    <div>
                      <p className="mb-1 text-sm text-gray-600">
                        Archivo de ayuda:
                      </p>
                      {question.archivoKey.endsWith(".mp4") ? (
                        <video
                          controls
                          className="w-full rounded-md shadow"
                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${question.archivoKey}`}
                        />
                      ) : /\.(pdf|docx?|pptx?)$/i.exec(question.archivoKey) ? (
                        <iframe
                          src={`https://docs.google.com/gview?url=${process.env.NEXT_PUBLIC_AWS_S3_URL}/${question.archivoKey}&embedded=true`}
                          className="h-60 w-full rounded-md border shadow"
                        />
                      ) : (
                        <a
                          href={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${question.archivoKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                          Abrir archivo
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleEdit(question)}
                    variant="outline"
                    className="text-white hover:text-blue-800"
                    size="sm"
                  >
                    <Edit className="mr-2 size-4" /> Editar
                  </Button>
                  <Button
                    onClick={() => handleDelete(question.id)}
                    variant="outline"
                    className="text-red-600 hover:text-red-800"
                    size="sm"
                  >
                    <Trash className="mr-2 size-4" /> Eliminar
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        ))
      ) : (
        <p className="text-center text-gray-500">No hay preguntas creadas</p>
      )}
    </div>
  );
};

export default QuestionSubidaList;
