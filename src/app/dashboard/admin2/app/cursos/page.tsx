'use client';

import { useState } from 'react';
import { BookOpen, Users, TrendingUp, Search, Plus } from 'lucide-react';
import { Button } from '~/components/admin/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/admin/ui/card';
import { CourseDetails } from '~/components/admin/ui/CourseDetails';
import { CourseForm } from '~/components/admin/ui/Courseform';
import { DashboardMetrics } from '~/components/admin/ui/DashboardMetrics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/admin/ui/dialog';
import { Input } from '~/components/admin/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/admin/ui/pagination';
import { type Course } from '~/types/course';

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
        {
          id: 1,
          title: 'Introducción a los algoritmos',
          duration: 60,
          description: 'Conceptos básicos de algoritmos',
        },
        {
          id: 2,
          title: 'Variables y tipos de datos',
          duration: 45,
          description: 'Entendiendo las variables y tipos en programación',
        },
      ],
    },
    // Añade más cursos aquí para probar la paginación
  ]);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  const handleAddCourse = (newCourse: Partial<Course>) => {
    const course: Course = {
      ...newCourse,
      id: courses.length + 1,
      coverImageKey: null,
      rating: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalStudents: 0,
    } as Course;
    setCourses([...courses, course]);
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(
    indexOfFirstCourse,
    indexOfLastCourse
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6 bg-background p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Gestión de Cursos
      </h2>

      <div className="grid gap-4 md:gap-6">
        <DashboardMetrics
          metrics={[
            {
              title: 'Total Cursos',
              value: courses.length.toString(),
              icon: BookOpen,
              href: '/cursos',
            },
            {
              title: 'Estudiantes Inscritos',
              value: courses
                .reduce((acc, course) => acc + course.totalStudents, 0)
                .toString(),
              icon: Users,
              href: '/estudiantes',
            },
            {
              title: 'Promedio de Calificación',
              value: (
                courses.reduce((acc, course) => acc + (course.rating ?? 0), 0) /
                courses.length
              ).toFixed(1),
              icon: TrendingUp,
              href: '/analisis',
            },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              Buscar y Agregar Cursos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 size-4" /> Agregar Curso
                </Button>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {currentCourses.map((course) => (
          <Card key={course.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{course.title}</CardTitle>
            </CardHeader>
            <CardContent className="grow">
              <p className="mb-2 text-sm text-muted-foreground">
                {course.instructor}
              </p>
              <p className="line-clamp-3 text-sm">{course.description}</p>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {course.totalStudents} estudiantes
              </span>
              <Button
                variant="outline"
                onClick={() => setSelectedCourse(course)}
              >
                Ver Detalles
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => paginate(currentPage - 1)} />
            </PaginationItem>
            {Array.from(
              { length: Math.ceil(filteredCourses.length / coursesPerPage) },
              (_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    onClick={() => paginate(index + 1)}
                    isActive={index + 1 === currentPage}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext onClick={() => paginate(currentPage + 1)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {selectedCourse && (
        <Dialog
          open={!!selectedCourse}
          onOpenChange={() => setSelectedCourse(null)}
        >
          <DialogContent className="h-[90vh] w-full p-0 sm:max-w-[425px] md:max-w-[700px] lg:max-w-[900px]">
            <CourseDetails course={selectedCourse} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
