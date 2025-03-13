import Image from 'next/image'

import { Button } from "~/components/admin/ui/button"
import { Card } from "~/components/admin/ui/card"
import { cn } from "~/lib/utils"

import type { Course } from "~/types/types"

interface CourseGridProps {
  courses: Course[] | undefined
  onViewCourse: (course: Course) => void
  onClose: () => void
  className?: string
}

export function CourseGrid({ courses, onViewCourse, onClose, className }: CourseGridProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-2xl font-semibold text-white">Cursos en los que está inscrito</h2>
      {!courses || courses.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No hay cursos asignados actualmente.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="bg-[#1a2234] border-none overflow-hidden cursor-pointer transition-transform duration-200 hover:translate-y-[-2px]"
              onClick={() => onViewCourse(course)}
            >
              <div className="aspect-[2/1] relative bg-[#e2e8f0] flex items-center justify-center">
                  <Image
                    src={course.imageUrl ??  "/placeholder.svg"}
                    alt={course.title}
                    layout="fill"
                    objectFit="cover"
                  />
                 : (
                  <span className="text-gray-500 text-center px-4">Imagen no disponible</span>
                )
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-white line-clamp-2">{course.title}</h3>
                {course.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{course.description}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-400">{course.students.length} estudiantes</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onClose}
          className="bg-red-500 hover:bg-red-600 text-white px-8 transition-colors duration-200"
        >
          Cerrar
        </Button>
      </div>
    </div>
  )
}

