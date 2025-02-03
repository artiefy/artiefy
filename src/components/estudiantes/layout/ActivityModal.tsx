"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/estudiantes/ui/dialog"
import { Button } from "~/components/estudiantes/ui/button"
import type { Activity, Question } from "~/types"
import { getActivityContent } from "~/server/actions/activities/getActivityContent"

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  activity: Activity
  onQuestionsAnswered: (allAnswered: boolean) => void
}

const ActivityModal = ({ isOpen, onClose, activity, onQuestionsAnswered }: ActivityModalProps) => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true)
      try {
        const activityContent = await getActivityContent(activity.lessonsId)
        if (activityContent.length > 0 && activityContent[0].content?.questions) {
          setQuestions(activityContent[0].content.questions)
        } else {
          setQuestions([])
        }
      } catch (error) {
        console.error("Error fetching questions:", error)
        setQuestions([])
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      void fetchQuestions()
    }
  }, [isOpen, activity.lessonsId])

  useEffect(() => {
    const allQuestionsAnswered = questions.length > 0 && questions.every((q) => selectedAnswers[q.id])
    onQuestionsAnswered(allQuestionsAnswered)
  }, [questions, selectedAnswers, onQuestionsAnswered])

  const handleAnswerSelection = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmit = () => {
    console.log("Respuestas enviadas:", selectedAnswers)
    onClose()
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{activity.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">Cargando preguntas...</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{activity.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {questions.map((question) => (
            <div key={question.id} className="mb-4">
              <p className="font-semibold">{question.text}</p>
              {question.options.map((option) => (
                <div key={option.id} className="flex items-center mt-2">
                  <input
                    type="radio"
                    id={`${question.id}-${option.id}`}
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={selectedAnswers[question.id] === option.id}
                    onChange={() => handleAnswerSelection(question.id, option.id)}
                    className="mr-2"
                  />
                  <label htmlFor={`${question.id}-${option.id}`}>{option.text}</label>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit}>Enviar respuestas</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ActivityModal

