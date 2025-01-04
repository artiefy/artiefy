'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { GenericTable } from '~/components/ui/GenericTable'
import { GenericForm } from '~/components/ui/GenericForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "~/components/ui/dialog"
import { DashboardMetrics } from '~/components/ui/DashboardMetrics'
import { BookOpen, Users, TrendingUp, Plus } from 'lucide-react'
import { CursoDetalle } from '~/components/ui/CursoDetalle'
import { RutaAprendizaje } from '~/components/ui/RutaAprendizaje'

type Curso = {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: string;
  estudiantes: number;
  materiales: string[];
}

export default function Cursos() {
  const [cursos, setCursos] = useState<Curso[]>([
    { 
      id: 1, 
      nombre: 'Introducción a la Programación', 
      descripcion: 'Curso básico de programación',
      duracion: '8 semanas',
      estudiantes: 120,
      materiales: ['Libro de texto', 'Ejercicios prácticos']
    },
    { 
      id: 2, 
      nombre: 'Diseño UX/UI', 
      descripcion: 'Fundamentos de diseño de experiencia de usuario',
      duracion: '6 semanas',
      estudiantes: 85,
      materiales: ['Guía de diseño', 'Herramientas de prototipado']
    },
  ])

  const [cursoSeleccionado, setCursoSeleccionado] = useState<Curso | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const handleAddCurso = (nuevoCurso: Omit<Curso, 'id' | 'estudiantes'>) => {
    setCursos([...cursos, { ...nuevoCurso, id: cursos.length + 1, estudiantes: 0 }])
    setIsAddDialogOpen(false)
  }

  const handleEditCurso = (cursoEditado: Curso) => {
    setCursos(cursos.map(curso => curso.id === cursoEditado.id ? cursoEditado : curso))
  }

  const columns = [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Duración', accessor: 'duracion' },
    { header: 'Estudiantes', accessor: 'estudiantes' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Gestión de Cursos</h2>

      <DashboardMetrics
        metrics={[
          { title: "Total Cursos", value: cursos.length.toString(), icon: BookOpen, href: "/cursos" },
          { title: "Estudiantes Inscritos", value: cursos.reduce((acc, curso) => acc + curso.estudiantes, 0).toString(), icon: Users, href: "/estudiantes" },
          { title: "Tasa de Finalización", value: "78%", icon: TrendingUp, href: "/analisis" },
        ]}
      />

      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar cursos..."
          className="max-w-sm"
        />
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Agregar Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Agregar Nuevo Curso</DialogTitle>
            </DialogHeader>
            <GenericForm
              fields={[
                { name: 'nombre', label: 'Nombre del Curso', type: 'text' },
                { name: 'descripcion', label: 'Descripción', type: 'textarea' },
                { name: 'duracion', label: 'Duración', type: 'text' },
                { name: 'materiales', label: 'Materiales (separados por comas)', type: 'textarea' },
              ]}
              onSubmit={handleAddCurso}
              submitLabel="Agregar Curso"
            />
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <GenericTable
        columns={columns}
        data={cursos}
        onRowClick={(curso) => setCursoSeleccionado(curso)}
        actions={(curso) => (
          <>
            <Button variant="outline" className="mr-2" onClick={() => setCursoSeleccionado(curso)}>Ver Detalles</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Editar</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Editar Curso</DialogTitle>
                </DialogHeader>
                <GenericForm
                  fields={[
                    { name: 'nombre', label: 'Nombre del Curso', type: 'text' },
                    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
                    { name: 'duracion', label: 'Duración', type: 'text' },
                    { name: 'materiales', label: 'Materiales (separados por comas)', type: 'textarea' },
                  ]}
                  onSubmit={handleEditCurso}
                  initialData={curso}
                  submitLabel="Actualizar Curso"
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      />

      {cursoSeleccionado && (
        <Dialog open={!!cursoSeleccionado} onOpenChange={() => setCursoSeleccionado(null)}>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Detalles del Curso</DialogTitle>
            </DialogHeader>
            <CursoDetalle curso={cursoSeleccionado} />
          </DialogContent>
        </Dialog>
      )}

      <RutaAprendizaje cursos={cursos} />
    </div>
  )
}

