'use client';

import React, { useState } from 'react';
import { BarChart, Users, GraduationCap } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/admin/ui/card';
import { DashboardMetrics } from '~/components/admin/ui/DashboardMetrics';
import { EstadisticasGenerales } from '~/components/admin/ui/EstadisticasGenerales';
import { EstudianteAnalisis } from '~/components/admin/ui/EstudianteAnalisis';
import { Input } from '~/components/admin/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/admin/ui/select';

interface Estudiante {
  id: number;
  nombre: string;
  email: string;
  cursos: {
    nombre: string;
    progreso: number;
    calificacion: number;
  }[];
  promedioGeneral: number;
  tasaFinalizacion: number;
  tiempoPromedioCompletado: number;
}

export default function Analisis() {
  const [estudiantes] = useState<Estudiante[]>([
    {
      id: 1,
      nombre: 'Ana García',
      email: 'ana.garcia@ejemplo.com',
      cursos: [
        {
          nombre: 'Introducción a la Programación',
          progreso: 80,
          calificacion: 85,
        },
        { nombre: 'Diseño UX/UI', progreso: 65, calificacion: 78 },
        { nombre: 'Marketing Digital', progreso: 90, calificacion: 92 },
      ],
      promedioGeneral: 85,
      tasaFinalizacion: 78,
      tiempoPromedioCompletado: 45,
    },
    {
      id: 2,
      nombre: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@ejemplo.com',
      cursos: [
        {
          nombre: 'Introducción a la Programación',
          progreso: 95,
          calificacion: 98,
        },
        { nombre: 'Bases de Datos', progreso: 70, calificacion: 75 },
        { nombre: 'Desarrollo Web', progreso: 85, calificacion: 88 },
      ],
      promedioGeneral: 87,
      tasaFinalizacion: 83,
      tiempoPromedioCompletado: 40,
    },
  ]);

  const [estudianteSeleccionado, setEstudianteSeleccionado] =
    useState<Estudiante | null>(null);
  const [filtro, setFiltro] = useState('');

  const estudiantesFiltrados = estudiantes.filter(
    (estudiante) =>
      estudiante.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      estudiante.email.toLowerCase().includes(filtro.toLowerCase())
  );

  const promedioGeneralTotal =
    estudiantes.reduce(
      (acc, estudiante) => acc + estudiante.promedioGeneral,
      0
    ) / estudiantes.length;
  const tasaFinalizacionTotal =
    estudiantes.reduce(
      (acc, estudiante) => acc + estudiante.tasaFinalizacion,
      0
    ) / estudiantes.length;
  const tiempoPromedioCompletadoTotal =
    estudiantes.reduce(
      (acc, estudiante) => acc + estudiante.tiempoPromedioCompletado,
      0
    ) / estudiantes.length;

  const estadisticasGenerales = [
    { categoria: 'Promedio General', valor: promedioGeneralTotal },
    { categoria: 'Tasa de Finalización', valor: tasaFinalizacionTotal },
    {
      categoria: 'Tiempo Promedio de Completado',
      valor: tiempoPromedioCompletadoTotal,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Análisis Educativo</h2>

      <DashboardMetrics
        metrics={[
          {
            title: 'Promedio General',
            value: promedioGeneralTotal.toFixed(2),
            icon: BarChart,
            href: '/analisis',
          },
          {
            title: 'Tasa de Finalización',
            value: `${tasaFinalizacionTotal.toFixed(2)}%`,
            icon: GraduationCap,
            href: '/analisis',
          },
          {
            title: 'Tiempo Promedio de Completado',
            value: `${tiempoPromedioCompletadoTotal.toFixed(0)} días`,
            icon: Users,
            href: '/analisis',
          },
        ]}
      />

      <EstadisticasGenerales
        titulo="Estadísticas Generales"
        estadisticas={estadisticasGenerales}
      />

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Estudiante para Análisis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <Input
              placeholder="Buscar estudiante..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="md:w-1/2"
            />
            <Select
              onValueChange={(value) =>
                setEstudianteSeleccionado(
                  estudiantes.find((e) => e.id.toString() === value) ?? null
                )
              }
            >
              <SelectTrigger className="md:w-1/2">
                <SelectValue placeholder="Seleccionar estudiante" />
              </SelectTrigger>
              <SelectContent>
                {estudiantesFiltrados.map((estudiante) => (
                  <SelectItem
                    key={estudiante.id}
                    value={estudiante.id.toString()}
                  >
                    {estudiante.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {estudianteSeleccionado && (
        <EstudianteAnalisis estudiante={estudianteSeleccionado} />
      )}
    </div>
  );
}
