'use client';
import { useCallback, useEffect, useState } from 'react';

import { Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

import QuestionForm from '~/components/educators/layout/QuestionsForms';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';

import type { Question } from '~/types/typesActi';

interface QuestionListProps {
  activityId: number;
  onEdit?: (question: Question & { tipo: 'OM' }) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({ activityId, onEdit }) => {
  const [questions, setQuestions] = useState<Question[]>([]); // Estado para las preguntas
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(
    undefined
  ); // Estado para la edición de preguntas
  const [loading, setLoading] = useState(true); // Estado para el estado de carga

  // Función para obtener las preguntas
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/educadores/question/opcionMulti?activityId=${activityId}`
      );
      const data = (await response.json()) as {
        success: boolean;
        questionsOM: Question[];
      };

      if (data.success) {
        const filteredQuestions =
          data.questionsOM?.filter(
            (q) => q?.text && q?.options && Array.isArray(q.options)
          ) ?? [];

        setQuestions(filteredQuestions);
      }
    } catch (error) {
      console.error('Error al cargar las preguntas:', error);
      toast('Error', {
        description: 'Error al cargar las preguntas',
      });
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  // Efecto para obtener las preguntas al cargar el componente
  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  const handleEdit = (question: Question) => {
    if (onEdit) {
      onEdit({ ...question, tipo: 'OM' });
    } else {
      setEditingQuestion(question);
    }
  };

  // Función para eliminar una pregunta
  const handleDelete = async (questionId: string) => {
    try {
      const response = await fetch(
        `/api/educadores/question/opcionMulti?activityId=${activityId}&questionId=${questionId}`,
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

  // Función para manejar el envío del formulario
  const handleFormSubmit = (_question: Question) => {
    setEditingQuestion(undefined);
    void fetchQuestions();
  };

  // Función para cancelar la edición
  const handleCancel = () => {
    setEditingQuestion(undefined);
  };

  // Retorno la vista del componente
  if (loading && questions.length > 0) {
    return (
      <div className="flex items-center justify-center p-8 text-white/60">
        Cargando preguntas...
      </div>
    );
  }

  return (
    <div className="my-2 space-y-4">
      {!onEdit && editingQuestion ? (
        <QuestionForm
          activityId={activityId}
          editingQuestion={editingQuestion}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          isUploading={false}
        />
      ) : questions.length > 0 ? (
        questions.map((question) => (
          <Card
            key={question.id}
            className="
              rounded-2xl border border-cyan-500/20 bg-slate-800
              shadow-[0_0_15px_rgba(34,211,238,0.06)]
            "
          >
            <CardContent className="pt-6">
              <h2
                className="
                  from-cyan-30 bg-gradient-to-r0 t-center mb-3 bg-gradient-to-r
                  to-white text-xl font-bold text-transparent
                "
              >
                Preguntas del tipo: opción múltiple
              </h2>
              <h3 className="text-sm font-semibold text-cyan-300/80">
                Pregunta:
              </h3>
              <p className="mb-3 text-white/90">{question.text}</p>
              <h4 className="text-xs font-semibold text-cyan-300/80">
                Peso de la pregunta
              </h4>
              <p className="mb-3 text-white/90">{question.pesoPregunta}%</p>
              <ul className="list-inside list-disc space-y-1 text-white/80">
                <span className="font-bold text-cyan-300/80">Respuesta:</span>
                {question.options?.map((option) => (
                  <li
                    key={option.id}
                    className={
                      option.id === question.correctOptionId
                        ? 'font-bold text-green-400'
                        : ''
                    }
                  >
                    {option.text}{' '}
                    {option.id === question.correctOptionId
                      ? '(Respuesta correcta)'
                      : ''}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter
              className="
                flex justify-end space-x-2 border-t border-cyan-500/10 pt-4
              "
            >
              <Button
                onClick={() => handleEdit(question)}
                variant="outline"
                className="
                  border-cyan-500/30 text-cyan-300
                  hover:bg-cyan-950/40 hover:text-cyan-200
                "
                size="sm"
              >
                <Edit className="mr-2 size-4" /> Editar
              </Button>
              <Button
                onClick={() => handleDelete(question.id)}
                variant="outline"
                className="
                  border-red-500/30 text-red-400
                  hover:bg-red-950/40 hover:text-red-300
                "
                size="sm"
              >
                <Trash className="mr-2 size-4" /> Eliminar
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <></>
      )}
    </div>
  );
};

export default QuestionList;
