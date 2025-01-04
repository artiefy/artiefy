'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { DashboardMetrics } from '~/components/ui/DashboardMetrics'
import { Users, BookOpen, Star } from 'lucide-react'
import { TutorForm } from '~/components/ui/TutorForm'
import { TutorDetalle } from '~/components/ui/TutorDetalle'

type Tutor = {
  id: number;
  nombre: string;
  email: string;
  especialidad: string;
  cursos: string[];
  estudiantes: number;
  calificacion: number;
}

export default function Tutores() {
  const [tutores, setTutores] = useState<Tutor[]>([
    { 
      id: 1, 
      nombre: 'Dr. Juan Pérez', 
      email: 'juan.perez@universidad.edu', 
      especialidad: 'Ciencias de la Computación',
      cursos: ['Introducción a la Programación', 'Estructuras de Datos'],
      estudiantes: 45,
      calificacion: 4.8
    },
    { 
      id: 2, 
      nombre: 'Dra. María Rodríguez', 
      email: 'maria.rodriguez@universidad.edu', 
      especialidad: 'Inteligencia Artificial',
      cursos: ['Machine Learning', 'Redes Neuronales'],
      estudiantes: 38,
      calificacion: 4.9
    },
  ])

  const [tutorSeleccionado, setTutorSeleccionado] = useState<Tutor | null>(null)

  const handleAddTutor = (nuevoTutor: Omit<Tutor, 'id' | 'estudiantes' | 'calificacion'>) => {
    setTutores([...tutores, { ...nuevoTutor, id: tutores.length + 1, estudiantes: 0, calificacion: 0 }])
  }

  const handleEditTutor = (tutorEditado: Tutor) => {
    setTutores(tutores.map(tutor => tutor.id === tutorEditado.id ? tutorEditado : tutor))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Gestión de Tutores</h2>

      <DashboardMetrics
        metrics={[
          { title: "Total Tutores", value: tutores.length.toString(), icon: Users, href: "/tutores" },
          { title: "Cursos Impartidos", value: tutores.reduce((acc, tutor) => acc + tutor.cursos.length, 0).toString(), icon: BookOpen, href: "/cursos" },
          { title: "Calificación Promedio", value: (tutores.reduce((acc, tutor) => acc + tutor.calificacion, 0) / tutores.length).toFixed(1), icon: Star, href: "/analisis" },
        ]}
      />

      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar tutores..."
          className="max-w-sm"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Agregar Tutor</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Tutor</DialogTitle>
            </DialogHeader>
            <TutorForm onSubmit={handleAddTutor} />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Especialidad</TableHead>
            <TableHead>Estudiantes</TableHead>
            <TableHead>Calificación</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tutores.map((tutor) => (
            <TableRow key={tutor.id}>
              <TableCell>{tutor.nombre}</TableCell>
              <TableCell>{tutor.email}</TableCell>
              <TableCell>{tutor.especialidad}</TableCell>
              <TableCell>{tutor.estudiantes}</TableCell>
              <TableCell>{tutor.calificacion}</TableCell>
              <TableCell>
                <Button variant="outline" className="mr-2" onClick={() => setTutorSeleccionado(tutor)}>Ver Detalles</Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Editar</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Editar Tutor</DialogTitle>
                    </DialogHeader>
                    <TutorForm onSubmit={handleEditTutor} tutor={tutor} />
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {tutorSeleccionado && (
        <Dialog open={!!tutorSeleccionado} onOpenChange={() => setTutorSeleccionado(null)}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Detalles del Tutor</DialogTitle>
            </DialogHeader>
            <TutorDetalle tutor={tutorSeleccionado} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

