'use client';
import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';

import { Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

import FormActCompletado from '~/components/educators/layout/FormActCompletado';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';

import type { QuestionFilesSubida } from '~/types/typesActi';

interface QuestionListProps {
  activityId: number;
  onEdit?: (question: QuestionFilesSubida & { tipo: 'ARCHIVO' }) => void;
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
        `/api/educadores/question/archivos?activityId=${activityId}`
      );
      if (!response.ok) {
        throw new Error('Error al obtener las preguntas');
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
      console.error('Error al cargar las preguntas:', error);
      toast('Error', {
        description: 'Error al cargar las preguntas',
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
      onEdit({ ...question, tipo: 'ARCHIVO' }); // 👈 Pasar a padre con tipo
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
          method: 'DELETE',
        }
      );
      if (response.ok) {
        // Actualizar el estado local en lugar de hacer fetch
        setQuestions(questions.filter((q) => q.id !== questionId));
        toast('Pregunta eliminada', {
          description: 'La pregunta se eliminó correctamente',
        });
      }
    } catch (error) {
      console.error('Error al eliminar la pregunta:', error);
      toast('Error', {
        description: 'Error al eliminar la pregunta',
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
    <div className="my-4 space-y-6">
      {!onEdit && (
        <div
          className="
          rounded-2xl border border-cyan-500/20 bg-slate-900 p-8 shadow-2xl
        "
        >
          <FormActCompletado
            activityId={activityId}
            onSubmit={handleFormSubmit}
          />
        </div>
      )}
      {questions.length > 0 ? (
        questions.map((question) => (
          <Card
            key={question.id}
            className="
              rounded-2xl border-none bg-slate-900 text-white shadow-xl
            "
          >
            {editingQuestion?.id === question.id ? (
              <div
                className="
                rounded-2xl border border-cyan-500/20 bg-slate-900 p-8
                shadow-2xl
              "
              >
                <FormActCompletado
                  activityId={activityId}
                  editingQuestion={editingQuestion}
                  onSubmit={handleFormSubmit}
                  onCancel={handleCancel}
                />
              </div>
            ) : (
              <>
                <CardContent className="space-y-4 pt-6">
                  <h3
                    className="
                    mb-2 bg-gradient-to-r from-cyan-400 to-white bg-clip-text
                    text-xl font-extrabold tracking-tight text-transparent
                  "
                  >
                    Pregunta de subida de archivo
                  </h3>

                  <div>
                    <p className="text-sm text-cyan-300">Pregunta:</p>
                    <p className="font-bold text-white">{question.text}</p>
                  </div>

                  <div>
                    <p className="text-sm text-cyan-300">
                      Criterios de evaluación:
                    </p>
                    <p className="font-bold text-white">
                      {question.parametros}
                    </p>
                  </div>

                  {/* Imagen complementaria */}
                  {question.portadaKey && (
                    <div>
                      <p className="mb-1 text-sm text-cyan-300">
                        Imagen complementaria:
                      </p>
                      <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${question.portadaKey}`}
                        alt="Imagen complementaria"
                        width={800}
                        height={450}
                        className="
                          max-h-60 w-full rounded-md border border-cyan-500/30
                          object-cover shadow
                        "
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Archivo de ayuda */}
                  {question.archivoKey && (
                    <div>
                      <p className="mb-1 text-sm text-cyan-300">
                        Archivo de ayuda:
                      </p>
                      {question.archivoKey.endsWith('.mp4') ? (
                        <video
                          controls
                          className="w-full rounded-md bg-slate-800 shadow"
                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${question.archivoKey}`}
                        />
                      ) : /\.(pdf|docx?|pptx?)$/i.exec(question.archivoKey) ? (
                        <iframe
                          src={`https://docs.google.com/gview?url=${process.env.NEXT_PUBLIC_AWS_S3_URL}/${question.archivoKey}&embedded=true`}
                          className="
                            h-60 w-full rounded-md border border-cyan-500/30
                            bg-slate-800 shadow
                          "
                        />
                      ) : (
                        <a
                          href={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${question.archivoKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                            inline-block rounded bg-cyan-600 px-4 py-2
                            text-white transition-all duration-150
                            hover:bg-cyan-700
                          "
                        >
                          Abrir archivo
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="mt-2 flex justify-end gap-3">
                  <Button
                    onClick={() => handleEdit(question)}
                    variant="outline"
                    className="
                      border-cyan-500/30 text-cyan-300 transition-all
                      duration-150
                      hover:bg-cyan-950/40 hover:text-white
                    "
                    size="sm"
                  >
                    <Edit className="mr-2 size-4" /> Editar
                  </Button>
                  <Button
                    onClick={() => handleDelete(question.id)}
                    variant="outline"
                    className="
                      border-red-600/30 text-red-400 transition-all duration-150
                      hover:bg-red-900/40 hover:text-white
                    "
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
        <p className="text-center text-slate-400">No hay preguntas creadas</p>
      )}
    </div>
  );
};

export default QuestionSubidaList;
