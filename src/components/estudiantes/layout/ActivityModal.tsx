"use client"
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/estudiantes/ui/dialog';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import type { Activity, Question } from '~/types';
import { getActivityContent } from '~/server/actions/activities/getActivityContent';
import { completeActivity } from '~/server/actions/progress/completeActivity'; // Import completeActivity action
import { saveActivityScore } from '~/server/actions/progress/saveActivityScore'; // Import saveActivityScore action

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  userId: string;
  onQuestionsAnswered: (allAnswered: boolean) => void;
  markActivityAsCompleted: () => void; // New prop for activity completion callback
}

const ActivityModal = ({ isOpen, onClose, activity, userId, onQuestionsAnswered, markActivityAsCompleted }: ActivityModalProps) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [allCorrect, setAllCorrect] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false); // New state for spinner
  const [attempts, setAttempts] = useState<Record<string, number>>({}); // New state for attempts

  // Fetch questions when the modal is open
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const activityContent = await getActivityContent(activity.lessonsId, userId); // Ensure lessonsId is a number
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
  }, [isOpen, activity.lessonsId, userId]);

  // Handle answer selection
  const handleAnswerChange = (questionId: string, optionId: string) => {
    if (attempts[questionId] >= 2) return; // Prevent more than 2 attempts

    const updatedAnswers = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(updatedAnswers);

    const updatedAttempts = { ...attempts, [questionId]: (attempts[questionId] || 0) + 1 };
    setAttempts(updatedAttempts);

    const allAnswered = questions.every((q) => updatedAnswers[q.id]);
    onQuestionsAnswered(allAnswered);

    // Calculate score and check if all answers are correct in real-time
    const correctAnswers = questions.filter((q) => updatedAnswers[q.id] === q.correctOptionId).length;
    setScore(correctAnswers);
    setAllCorrect(correctAnswers === questions.length);
  };

  // Handle activity completion
  const handleCompleteActivity = async () => {
    setIsCompleting(true); // Set spinner state to true
    try {
      await completeActivity(activity.id); // Mark activity as completed in the database
      await saveActivityScore(activity.id.toString(), userId, score); // Ensure activity.id is a string
      markActivityAsCompleted();
      onClose();
    } catch (error) {
      console.error('Error completing activity:', error);
    } finally {
      setIsCompleting(false); // Set spinner state to false
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex flex-col items-center justify-center font-bold text-2xl'>Bienvenido a la Actividad</DialogTitle>
          <p className="flex flex-col items-center justify-center text-sm text-gray-500">Por favor, selecciona las respuestas correctamente.</p>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            Cargando preguntas...
            <Icons.blocks className="w-16 h-16 mt-4 fill-primary" />
          </div>
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
                          disabled={attempts[question.id] >= 2} // Disable input after 2 attempts
                        />
                        {option.text}
                      </label>
                    ))}
                  </div>
                  {attempts[question.id] >= 2 && (
                    <p className="text-red-500">Has alcanzado el límite de intentos para esta pregunta.</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center">No hay preguntas disponibles.</div>
            )}
            <div className="mt-4 text-center">
              {allCorrect ? (
                <h4 className="font-semibold text-green-500">¡Felicidades! Respondiste todas las preguntas correctamente. Calificación: 5.0</h4>
              ) : (
                <h4 className="font-semibold">Calificación: {score} / {questions.length}</h4>
              )}
            </div>
          </div>
        )}
        <Button
          onClick={handleCompleteActivity}
          className="active:scale-95 mt-4 w-full bg-[#00BDD8] text-white hover:bg-[#00A5C0]"
          disabled={!allCorrect || isCompleting} // Disable button if not all questions are answered correctly or if completing
        >
          {isCompleting ? <Icons.spinner style={{width:"25px", height:"25px"}} /> : 'Completar Actividad'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityModal;
