"use client"
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/estudiantes/ui/dialog';
import { Button } from '~/components/estudiantes/ui/button';
import type { Activity, Question } from '~/types'; // Elimina Option ya que no se usa directamente aquí
import { getActivityContent } from '~/server/actions/activities/getActivityContent';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  onQuestionsAnswered: (allAnswered: boolean) => void;
}

const ActivityModal = ({ isOpen, onClose, activity, onQuestionsAnswered }: ActivityModalProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);

  // Fetch questions when the modal is open
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const activityContent = await getActivityContent(activity.lessonsId);
        if (activityContent.length > 0 && activityContent[0].content?.questions) {
          setQuestions(activityContent[0].content.questions);
        } else {
          setQuestions([]);
        }
      } catch (error) {
        console.error('Error fetching activity content:', error);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      void fetchQuestions();
    }
  }, [isOpen, activity.lessonsId]);

  // Handle answer selection
  const handleAnswerChange = (questionId: string, optionId: string) => {
    const updatedAnswers = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(updatedAnswers);

    const allAnswered = questions.every((q) => updatedAnswers[q.id]);
    onQuestionsAnswered(allAnswered);

    // Calculate score in real-time
    const correctAnswers = questions.filter((q) => updatedAnswers[q.id] === q.correctOptionId).length;
    setScore(correctAnswers);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Actividad: {activity.name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div>Cargando preguntas...</div>
        ) : (
          <div>
            {questions.length > 0 ? (
              questions.map((question) => (
                <div key={question.id} className="mb-4">
                  <h3 className="font-semibold">{question.text}</h3>
                  <div className="mt-2">
                    {question.options.map((option) => (
                      <label key={option.id} className="block mb-2">
                        <input
                          type="radio"
                          name={question.id}
                          value={option.id}
                          checked={selectedAnswers[question.id] === option.id}
                          onChange={() => handleAnswerChange(question.id, option.id)}
                          className="mr-2"
                        />
                        {option.text}
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div>No hay preguntas disponibles.</div>
            )}
            <div className="mt-4">
              <h4 className="font-semibold">Calificación: {score} / {questions.length}</h4>
            </div>
          </div>
        )}
        <Button onClick={onClose} className="mt-4">
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityModal;
