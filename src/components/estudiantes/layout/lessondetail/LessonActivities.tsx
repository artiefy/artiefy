import { useState } from 'react';
import { FaCheckCircle, FaLock, FaArrowDown } from 'react-icons/fa'; // Import FaCheckCircle and FaArrowDown
import { PiArrowFatLineLeftFill } from "react-icons/pi"; // Import PiArrowFatLineLeftFill
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import type { Activity } from '~/types';
import LessonActivityModal from './LessonActivityModal';

interface LessonActivitiesProps {
  activity: Activity | null;
  isVideoCompleted: boolean;
  isActivityCompleted: boolean;
  isCompletingActivity: boolean;
  handleActivityCompletion: () => void;
  userId: string; // Añadimos userId aquí
}

const LessonActivities = ({
  activity,
  isVideoCompleted,
  isActivityCompleted,
  isCompletingActivity,
  handleActivityCompletion,
  userId, // Añadimos userId aquí
}: LessonActivitiesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [activityCompleted, setActivityCompleted] = useState(isActivityCompleted); // New state for activity completion

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleQuestionsAnswered = (answered: boolean) => {
    setAllQuestionsAnswered(answered);
  };

  const markActivityAsCompleted = () => {
    setActivityCompleted(true);
  };

  const handleActivityComplete = () => {
    handleActivityCompletion();
    closeModal();
  };

  return (
    <div className="w-72 bg-background p-4 shadow-lg">
      <h2 className="mb-4 text-2xl font-bold text-primary">Actividades</h2>
      {activity ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{activity.name}</h3>
            </div>
            {activityCompleted ? <FaCheckCircle className="text-green-500" /> : <FaLock className="text-gray-400" />}
          </div>
          <p className="mt-2 text-sm text-gray-600">{activity.description}</p>
          {isVideoCompleted && (
            <div className="flex justify-center">
              <FaArrowDown className="my-4 text-green-500 mb-1 animate-bounce-up-down" /> {/* Add arrow icon with animation */}
            </div>
          )}
          <Button
            onClick={openModal}
            className={`mt-2 w-full ${activityCompleted ? 'bg-green-500 text-white' : isVideoCompleted ? 'bg-[#00BDD8] text-white hover:bg-[#00A5C0]' : 'bg-gray-400 text-background'}`} // Change background color based on isActivityCompleted and isVideoCompleted
            disabled={!isVideoCompleted} // Disable button until video is completed
          >
            {activityCompleted ? (
              <>
                Actividad Completada <FaCheckCircle className="ml-2" />
              </>
            ) : (
              'Ver Actividad'
            )}
          </Button>
          <Button
            onClick={handleActivityComplete}
            disabled={!isVideoCompleted || !activityCompleted || isCompletingActivity || !allQuestionsAnswered}
            className={`mt-2 w-full ${
              activityCompleted && allQuestionsAnswered
                ? 'bg-gradient-to-r from-[#004d40] to-[#00796b] text-white hover:bg-gradient-to-l animate-pulse'
                : 'bg-gray-400 text-background'
            }`}
          >
            {isCompletingActivity ? (
              <Icons.spinner className="mr-2 text-primary" />
            ) : activityCompleted ? (
              <>
                Siguiente Clase <PiArrowFatLineLeftFill className="ml-2" />
              </>
            ) : !allQuestionsAnswered ? (
              'Responde todas las preguntas'
            ) : isVideoCompleted ? (
              'Completar Actividad'
            ) : (
              'Ver video primero'
            )}
          </Button>
        </div>
      ) : (
        <p className="text-gray-600">No hay actividades disponibles</p>
      )}
      {activity && (
        <LessonActivityModal
          isOpen={isModalOpen}
          onClose={closeModal}
          activity={activity}
          onQuestionsAnswered={handleQuestionsAnswered}
          userId={userId} // Pasamos userId aquí
          markActivityAsCompleted={markActivityAsCompleted} // Pass activity completion handler
        />
      )}
    </div>
  );
};

export default LessonActivities;
