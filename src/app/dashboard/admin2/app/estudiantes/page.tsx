'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { GenericTable } from '~/components/ui/GenericTable'
import { GenericForm } from '~/components/ui/GenericForm'
import { AddStudentForm } from '~/components/ui/AddStudentForm'

  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"
import { Label } from "~/components/ui/label"
import { DashboardMetrics } from '~/components/ui/DashboardMetrics'
import { Users, GraduationCap, TrendingUp } from 'lucide-react'
import { EstudianteDetalle } from '~/components/ui/EstudianteDetalle'

// Tipo para representar a un estudiante
type Estudiante = {
  id: number;
  nombre: string;
  email: string;
  fechaNacimiento: string;
  cursos: { nombre: string; progreso: number }[];
  contraseña?: string;
  telefono?: string;
  edad?: number;
}

function EstudiantesPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Estudiantes</h1>
      <AddStudentForm />
      {/* Aquí puedes añadir una lista de estudiantes existentes si lo deseas */}
    </div>
  )
}

export default function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([
    { 
      id: 1, 
      nombre: 'Ana García', 
      email: 'ana.garcia@ejemplo.com', 
      fechaNacimiento: '1995-05-15',
      cursos: [
        { nombre: 'Introducción a la Programación', progreso: 75 },
        { nombre: 'Diseño UX/UI', progreso: 50 },
      ]
    },
    { 
      id: 2, 
      nombre: 'Carlos Rodríguez', 
      email: 'carlos.rodriguez@ejemplo.com', 
      fechaNacimiento: '1998-09-22',
      cursos: [
        { nombre: 'Marketing Digital', progreso: 90 },
        { nombre: 'Introducción a la Programación', progreso: 30 },
      ]
    },
  ])

  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null)

  const handleAddEstudiante = (nuevoEstudiante: Omit<Estudiante, 'id'>) => {
    setEstudiantes([...estudiantes, { ...nuevoEstudiante, id: estudiantes.length + 1 }])
  }

  const handleEditEstudiante = (estudianteEditado: Estudiante) => {
    setEstudiantes(estudiantes.map(est => est.id === estudianteEditado.id ? estudianteEditado : est))
  }

  const columns = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Email', accessor: 'email' },
    { header: 'Fecha de Nacimiento', accessor: 'fechaNacimiento' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Gestión de Estudiantes</h2>

      <DashboardMetrics
        metrics={[
          { title: "Total Estudiantes", value: estudiantes.length.toString(), icon: Users, href: "/estudiantes" },
          { title: "Cursos Activos", value: "5", icon: GraduationCap, href: "/cursos" },
          { title: "Promedio de Progreso", value: "68%", icon: TrendingUp, href: "/analisis" },
        ]}
      />

      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar estudiantes..."
          className="max-w-sm"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Agregar Estudiante</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Estudiante</DialogTitle>
            </DialogHeader>
            <GenericForm
              fields={[
                { name: 'nombre', label: 'Nombre', type: 'text' },
                { name: 'email', label: 'Email', type: 'text' },
                { name: 'fechaNacimiento', label: 'Fecha de Nacimiento', type: 'text' },
              ]}
              onSubmit={handleAddEstudiante}
              submitLabel="Agregar Estudiante"
            />
          </DialogContent>
        </Dialog>
      </div>

      <GenericTable
        columns={columns}
        data={estudiantes}
        onRowClick={(estudiante) => setEstudianteSeleccionado(estudiante)}
        actions={(estudiante) => (
          <>
            <Button variant="outline" className="mr-2" onClick={() => setEstudianteSeleccionado(estudiante)}>Ver Detalles</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Editar</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Editar Estudiante</DialogTitle>
                </DialogHeader>
                <GenericForm
                  fields={[
                    { name: 'nombre', label: 'Nombre', type: 'text' },
                    { name: 'email', label: 'Email', type: 'text' },
                    { name: 'fechaNacimiento', label: 'Fecha de Nacimiento', type: 'text' },
                  ]}
                  onSubmit={handleEditEstudiante}
                  initialData={estudiante}
                  submitLabel="Actualizar Estudiante"
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      />

      {estudianteSeleccionado && (
        <Dialog open={!!estudianteSeleccionado} onOpenChange={() => setEstudianteSeleccionado(null)}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Detalles del Estudiante</DialogTitle>
            </DialogHeader>
            <EstudianteDetalle estudiante={estudianteSeleccionado} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

