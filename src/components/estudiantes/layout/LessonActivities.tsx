import { useState } from "react"
import { FaCheckCircle, FaLock } from "react-icons/fa"
import { Button } from "~/components/estudiantes/ui/button"
import { Icons } from "~/components/estudiantes/ui/icons"
import type { Activity } from "~/types"
import ActivityModal from "./ActivityModal"

interface LessonActivitiesProps {
  activity: Activity | null
  isVideoCompleted: boolean
  isActivityCompleted: boolean
  isCompletingActivity: boolean
  handleActivityCompletion: () => void
}

const LessonActivities = ({
  activity,
  isVideoCompleted,
  isActivityCompleted,
  isCompletingActivity,
  handleActivityCompletion,
}: LessonActivitiesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const handleQuestionsAnswered = (answered: boolean) => {
    setAllQuestionsAnswered(answered)
  }

  return (
    <div className="w-72 bg-background p-4 shadow-lg">
      <h2 className="mb-4 text-2xl font-bold text-primary">Actividades</h2>
      {activity ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{activity.name}</h3>
            </div>
            {isActivityCompleted ? <FaCheckCircle className="text-green-500" /> : <FaLock className="text-gray-400" />}
          </div>
          <p className="mt-2 text-sm text-gray-600">{activity.description}</p>
          <Button onClick={openModal} className="mt-4 w-full bg-[#00BDD8] text-white hover:bg-[#00A5C0]">
            Ver Actividad
          </Button>
          <Button
            onClick={handleActivityCompletion}
            disabled={!isVideoCompleted || isActivityCompleted || isCompletingActivity || !allQuestionsAnswered}
            className={`mt-2 w-full ${
              isVideoCompleted && allQuestionsAnswered
                ? "bg-[#00BDD8] text-white hover:bg-[#00A5C0]"
                : "bg-gray-400 text-background"
            }`}
          >
            {isCompletingActivity ? (
              <Icons.spinner className="mr-2 text-background" />
            ) : isActivityCompleted ? (
              "Actividad Completada"
            ) : !allQuestionsAnswered ? (
              "Responde todas las preguntas"
            ) : isVideoCompleted ? (
              "Completar Actividad"
            ) : (
              "Ver video primero"
            )}
          </Button>
        </div>
      ) : (
        <p className="text-gray-600">No hay actividades disponibles</p>
      )}
      {activity && (
        <ActivityModal
          isOpen={isModalOpen}
          onClose={closeModal}
          activity={activity}
          onQuestionsAnswered={handleQuestionsAnswered}
        />
      )}
    </div>
  )
}

export default LessonActivities

