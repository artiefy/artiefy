import React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/admin/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/admin/ui/chart';
import { Progress } from '~/components/admin/ui/progress';

interface Curso {
  nombre: string;
  progreso: number;
  calificacion: number;
}

interface EstudianteAnalisis {
  id: number;
  nombre: string;
  email: string;
  cursos: Curso[];
  promedioGeneral: number;
  tasaFinalizacion: number;
  tiempoPromedioCompletado: number;
}

interface EstudianteAnalisisProps {
  estudiante: EstudianteAnalisis;
}

export function EstudianteAnalisis({ estudiante }: EstudianteAnalisisProps) {
  const datosGrafico = estudiante.cursos.map((curso) => ({
    nombre: curso.nombre,
    progreso: curso.progreso,
    calificacion: curso.calificacion,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Estudiante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium">Promedio General</p>
              <p className="text-2xl font-bold">
                {estudiante.promedioGeneral.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Tasa de Finalización</p>
              <p className="text-2xl font-bold">
                {estudiante.tasaFinalizacion}%
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">
                Tiempo Promedio de Completado
              </p>
              <p className="text-2xl font-bold">
                {estudiante.tiempoPromedioCompletado} días
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progreso por Curso</CardTitle>
        </CardHeader>
        <CardContent>
          {estudiante.cursos.map((curso, index) => (
            <div key={index} className="mb-4">
              <div className="mb-1 flex justify-between">
                <span>{curso.nombre}</span>
                <span>{curso.progreso}%</span>
              </div>
              <Progress value={curso.progreso} className="w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calificaciones y Progreso por Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              progreso: {
                label: 'Progreso',
                color: 'hsl(var(--chart-1))',
              },
              calificacion: {
                label: 'Calificación',
                color: 'hsl(var(--chart-2))',
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafico}>
                <XAxis dataKey="nombre" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="progreso"
                  fill="var(--color-progreso)"
                  name="Progreso"
                />
                <Bar
                  dataKey="calificacion"
                  fill="var(--color-calificacion)"
                  name="Calificación"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
