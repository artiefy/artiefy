"use client"
import { useEffect, useState } from 'react';
import { FaCheckCircle, FaLock } from 'react-icons/fa';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { type Activity } from '~/types';

interface LessonActivitiesProps {
  activities: Activity[];
  isVideoCompleted: boolean;
  isActivityCompleted: boolean;
  isCompletingActivity: boolean;
  handleActivityCompletion: (activityId: number) => void;
}

const LessonActivities = ({
  activities,
  isVideoCompleted,
  isActivityCompleted,
  isCompletingActivity,
  handleActivityCompletion,
}: LessonActivitiesProps) => {
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Filtrar las actividades según su type_id
    const filtered = activities.filter(activity => activity.typeid === 1); // Cambia '1' por el ID del tipo de actividad que deseas mostrar
    setFilteredActivities(filtered);
  }, [activities]);

  return (
    <div className="w-72 bg-background p-4 shadow-lg">
      <h2 className="mb-4 text-2xl font-bold text-primary">Actividades</h2>
      {filteredActivities.length > 0 ? (
        filteredActivities.map(activity => (
          <div key={activity.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{activity.name}</h3>
              </div>
              {isActivityCompleted ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaLock className="text-gray-400" />
              )}
            </div>
            <p className="mt-2 text-sm text-gray-600">{activity.description}</p>
            <Button
              onClick={() => handleActivityCompletion(activity.id)}
              disabled={!isVideoCompleted || isActivityCompleted || isCompletingActivity}
              className={`mt-4 w-full ${
                isVideoCompleted
                  ? 'bg-[#00BDD8] text-white hover:bg-[#00A5C0]'
                  : 'bg-gray-400 text-background'
              }`}
            >
              {isCompletingActivity ? (
                <Icons.spinner className="mr-2 text-background" />
              ) : isActivityCompleted ? (
                'Actividad Completada'
              ) : isVideoCompleted ? (
                'Completar Actividad'
              ) : (
                'Ver video primero'
              )}
            </Button>
          </div>
        ))
      ) : (
        <p className="text-gray-600">No hay actividades disponibles</p>
      )}
    </div>
  );
};

export default LessonActivities;
