'use client';
import { useEffect, useState } from 'react';

import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';

import type { VerdaderoOFlaso } from '~/types/typesActi';

interface QuestionListProps {
  activityId: number;
  onQuestionAnswered: (isCorrect: boolean) => void;
}

interface Feedback {
  isCorrect: boolean;
  message: string;
  attempted: boolean;
}

type FeedbackState = Record<string, Feedback>;

const VerQuestionVOFList: React.FC<QuestionListProps> = ({
  activityId,
  onQuestionAnswered,
}) => {
  const [questionsVOF, setQuestionsVOF] = useState<VerdaderoOFlaso[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | null>
  >({});
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState>({});

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/educadores/question/VerdaderoOFalso?activityId=${activityId}`
        );
        console.log('API response:', response); // Add logging
        if (!response.ok) {
          throw new Error(`Error fetching questions: ${response.statusText}`);
        }
        const data = (await response.json()) as {
          success: boolean;
          questionsVOF?: VerdaderoOFlaso[];
        };
        console.log('API data:', data); // Add logging
        if (data.success && data.questionsVOF) {
          // Asegurarse de que los objetos dentro del arreglo options se están deserializando correctamente
          const deserializedQuestions = data.questionsVOF.map((question) => ({
            ...question,
            options: question.options
              ? question.options.map((option) => ({
                  ...option,
                }))
              : [],
          }));
          console.log('Fetched questions:', deserializedQuestions); // Add logging
          setQuestionsVOF(deserializedQuestions);
        } else {
          console.error('Error fetching questions: No questions found');
        }
      } catch (error) {
        console.error('Error al cargar las preguntas:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchQuestions();
  }, [activityId]);

  const handleOptionChange = (questionId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = (questionId: string, selectedOptionId: string) => {
    const currentQuestion = questionsVOF.find((q) => q.id === questionId);

    if (!selectedOptionId) {
      setFeedback((prev) => ({
        ...prev,
        [questionId]: {
          isCorrect: false,
          message: 'Por favor, seleccione una opción',
          attempted: false,
        },
      }));
      return;
    }

    const isCorrect = selectedOptionId === currentQuestion?.correctOptionId;
    onQuestionAnswered(isCorrect);

    setFeedback((prev) => ({
      ...prev,
      [questionId]: {
        isCorrect,
        message: isCorrect
          ? '¡Correcto! 🎉'
          : `Incorrecto. La respuesta correcta es: "${
              currentQuestion?.options.find(
                (opt) => opt.id === currentQuestion.correctOptionId
              )?.text
            }" ❌`,
        attempted: true,
      },
    }));
  };

  if (loading) return <div className="text-center">Cargando actividad...</div>;

  return (
    <div className="my-2 space-y-4">
      {questionsVOF &&
        questionsVOF.length > 0 &&
        questionsVOF.map((question) => (
          <Card
            key={question.id}
            className="relative justify-start border-none shadow-lg"
          >
            <CardContent className="pt-6">
              <h3>Pregunta:</h3>
              <h3 className="mb-2 text-lg font-semibold">{question.text}</h3>
              <ul className="space-y-1">
                {question.options?.map((option) => (
                  <li key={option.id}>
                    <label className={'text-black'}>
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.id}
                        className="mr-2"
                        checked={selectedOptions[question.id] === option.id}
                        onChange={() =>
                          handleOptionChange(question.id, option.id)
                        }
                        disabled={feedback[question.id]?.attempted}
                      />
                      {option.text}
                    </label>
                  </li>
                ))}
              </ul>
              {feedback[question.id] && (
                <p
                  className={`mt-2 ${
                    feedback[question.id].isCorrect
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {feedback[question.id].message}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                variant="secondary"
                className="absolute right-10 bottom-6"
                onClick={() =>
                  handleSubmit(question.id, selectedOptions[question.id] ?? '')
                }
                disabled={feedback[question.id]?.attempted}
              >
                Enviar
              </Button>
            </CardFooter>
          </Card>
        ))}
    </div>
  );
};

export default VerQuestionVOFList;
