'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { CourseForm } from '~/components/ui/Courseform'
import { CourseDetails } from '~/components/ui/CourseDetails'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { DashboardMetrics } from '~/components/ui/DashboardMetrics'
import { BookOpen, Users, TrendingUp, Search, Plus } from 'lucide-react'
import { Course } from '~/types/course'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Pagination } from "~/components/ui/pagination"

export default function Cursos() {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      title: 'Introducción a la Programación',
      coverImageKey: null,
      category: { id: 1, name: 'Programación' },
      description: 'Un curso básico para principiantes en programación',
      instructor: 'Juan Pérez',
      rating: 4.5,
      createdAt: '2023-01-01',
      updatedAt: '2023-06-15',
      totalStudents: 100,
      modalidad: { name: 'Online' },
      lessons: [
        { id: 1, title: 'Introducción a los algoritmos', duration: 60, description: 'Conceptos básicos de algoritmos' },
        { id: 2, title: 'Variables y tipos de datos', duration: 45, description: 'Entendiendo las variables y tipos en programación' },
      ]
    },
    // Añade más cursos aquí para probar la paginación
  ])

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const coursesPerPage = 6

  const handleAddCourse = (newCourse: Partial<Course>) => {
    const course: Course = {
      ...newCourse,
      id: courses.length + 1,
      coverImageKey: null,
      rating: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalStudents: 0,
    } as Course
    setCourses([...courses, course])
  }

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(courses.map(course => course.id === updatedCourse.id ? updatedCourse : course))
    setSelectedCourse(null)
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const indexOfLastCourse = currentPage * coursesPerPage
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 bg-background">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Gestión de Cursos</h2>

      <div className="grid gap-4 md:gap-6">
        <DashboardMetrics
          metrics={[
            { title: "Total Cursos", value: courses.length.toString(), icon: BookOpen, href: "/cursos" },
            { title: "Estudiantes Inscritos", value: courses.reduce((acc, course) => acc + course.totalStudents, 0).toString(), icon: Users, href: "/estudiantes" },
            { title: "Promedio de Calificación", value: (courses.reduce((acc, course) => acc + (course.rating || 0), 0) / courses.length).toFixed(1), icon: TrendingUp, href: "/analisis" },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Buscar y Agregar Cursos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Agregar Curso</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Curso</DialogTitle>
                </DialogHeader>
                <CourseForm onSubmit={handleAddCourse} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {currentCourses.map((course) => (
          <Card key={course.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-2">{course.instructor}</p>
              <p className="text-sm line-clamp-3">{course.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-sm font-medium">{course.totalStudents} estudiantes</span>
              <Button variant="outline" onClick={() => setSelectedCourse(course)}>Ver Detalles</Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredCourses.length / coursesPerPage)}
          onPageChange={paginate}
        />
      </div>

      {selectedCourse && (
        <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
          <DialogContent className="sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px] w-full h-[90vh] p-0">
            <CourseDetails course={selectedCourse} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

