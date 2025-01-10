'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { DashboardMetrics } from '~/components/ui/DashboardMetrics'
import { ClipboardList, Users, Clock } from 'lucide-react'
import { EvaluacionForm } from '~/components/ui/EvaluacionForm'

type Evaluacion = {
  id: number;
  nombre: string;
  curso: string;
  tipoPreguntas: string;
  duracion: string;
  puntajeMaximo: number;
}

export default function Evaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([
    { 
      id: 1, 
      nombre: 'Examen Final - Programación', 
      curso: 'Introducción a la Programación',
      tipoPreguntas: 'Opción múltiple, Respuesta corta',
      duracion: '2 horas',
      puntajeMaximo: 100
    },
    { 
      id: 2, 
      nombre: 'Quiz - Diseño UX', 
      curso: 'Diseño UX/UI',
      tipoPreguntas: 'Verdadero/Falso, Opción múltiple',
      duracion: '30 minutos',
      puntajeMaximo: 50
    },
  ])

  const handleAddEvaluacion = (nuevaEvaluacion: Omit<Evaluacion, 'id'>) => {
    setEvaluaciones([...evaluaciones, { ...nuevaEvaluacion, id: evaluaciones.length + 1 }])
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Gestión de Evaluaciones</h2>

      <DashboardMetrics
        metrics={[
          { title: "Total Evaluaciones", value: evaluaciones.length.toString(), icon: ClipboardList, href: "/evaluaciones" },
          { title: "Estudiantes Evaluados", value: "250", icon: Users, href: "/estudiantes" },
          { title: "Tiempo Promedio", value: "45 min", icon: Clock, href: "/analisis" },
        ]}
      />

      <div className="flex justify-between items-center">
        <Input
          placeholder="Buscar evaluaciones..."
          className="max-w-sm"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Crear Evaluación</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nueva Evaluación</DialogTitle>
            </DialogHeader>
            <EvaluacionForm onSubmit={handleAddEvaluacion} />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Curso</TableHead>
            <TableHead>Tipo de Preguntas</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Puntaje Máximo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluaciones.map((evaluacion) => (
            <TableRow key={evaluacion.id}>
              <TableCell>{evaluacion.nombre}</TableCell>
              <TableCell>{evaluacion.curso}</TableCell>
              <TableCell>{evaluacion.tipoPreguntas}</TableCell>
              <TableCell>{evaluacion.duracion}</TableCell>
              <TableCell>{evaluacion.puntajeMaximo}</TableCell>
              <TableCell>
                <Button variant="outline" className="mr-2">Editar</Button>
                <Button variant="outline">Ver Resultados</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

