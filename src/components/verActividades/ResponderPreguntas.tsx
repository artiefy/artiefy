"use client";
import { useEffect, useState } from "react";

import { Button } from "~/components/educators/ui/button";
import { Card, CardContent, CardFooter } from "~/components/educators/ui/card";

import type { Completado } from "~/types/typesActi";

interface QuestionListProps {
  activityId: number;
  onQuestionAnswered: (isCorrect: boolean) => void;
}

interface Feedback {
  isCorrect: boolean;
  message: string;
  attempted: boolean;
}

type Answers = Record<string, string>;

type FeedbackState = Record<string, Feedback>;

const ResponderPreguntas: React.FC<QuestionListProps> = ({
  activityId,
  onQuestionAnswered,
}) => {
  const [questions, setQuestions] = useState<Completado[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answers>({});
  const [feedback, setFeedback] = useState<FeedbackState>({});

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/educadores/question/completar2?activityId=${activityId}`,
        );
        if (!response.ok) {
          throw new Error("Error al obtener las preguntas");
        }
        const data = (await response.json()) as {
          success: boolean;
          questionsACompletar2: Completado[];
        };
        if (data.success) {
          setQuestions(data.questionsACompletar2);
        }
      } catch (error) {
        console.error("Error al cargar las preguntas:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchQuestions();
  }, [activityId]);

  const handleSubmit = (questionId: string, userAnswer: string) => {
    const currentQuestion = questions.find((q) => q.id === questionId);

    if (!currentQuestion?.correctAnswer) {
      console.error("No hay respuesta correcta definida");
      return;
    }

    if (!userAnswer) {
      setFeedback((prev) => ({
        ...prev,
        [questionId]: {
          isCorrect: false,
          message: "Por favor, ingrese una respuesta",
          attempted: false,
        },
      }));
      return;
    }

    // Normalizar ambas respuestas eliminando espacios extra y convirtiendo a minúsculas
    const normalizedUserAnswer = userAnswer
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
    const normalizedCorrectAnswer = currentQuestion.correctAnswer
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

    // Comparación exacta
    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    onQuestionAnswered(isCorrect);

    setFeedback((prev) => ({
      ...prev,
      [questionId]: {
        isCorrect,
        message: isCorrect
          ? "¡Correcto! 🎉"
          : `Incorrecto. La respuesta correcta es: "${currentQuestion.correctAnswer}" ❌`,
        attempted: true,
      },
    }));
  };

  if (loading) return <div className="text-center">Cargando actividad...</div>;

  return (
    <div className="my-2 space-y-4">
      {questions && questions.length > 0 ? (
        questions.map((question) => (
          <Card key={question.id} className="relative border-none shadow-lg">
            <CardContent className="pt-6">
              <p>Pregunta:</p>
              <h3 className="mb-2 text-lg font-semibold">{question.text}</h3>
              <p>Palabra para completar la frase:</p>
              <input
                type="text"
                className="w-2/4 rounded-lg border border-slate-200 p-4 shadow-lg outline-none"
                name="answer"
                placeholder="Ingrese aqui el complemento"
                value={answers[question.id.toString()] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id.toString()]: e.target.value,
                  }))
                }
                disabled={feedback[question.id.toString()]?.attempted}
              />
              {feedback[question.id.toString()] && (
                <p
                  className={`mt-2 ${feedback[question.id.toString()].isCorrect ? "text-green-600" : "text-red-600"}`}
                >
                  {feedback[question.id.toString()].message}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                variant="secondary"
                className="absolute right-10 bottom-6"
                onClick={() =>
                  handleSubmit(
                    question.id.toString(),
                    answers[question.id.toString()],
                  )
                }
                disabled={feedback[question.id.toString()]?.attempted}
              >
                Enviar
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <p>No hay preguntas disponibles.</p>
      )}
    </div>
  );
};

export default ResponderPreguntas;
