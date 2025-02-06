'use client';

import { useState } from 'react';
import { Users, GraduationCap, TrendingUp } from 'lucide-react';
import { AddStudentForm } from '~/components/admin/ui/AddStudentForm';
import { Button } from '~/components/admin/ui/button';
import { DashboardMetrics } from '~/components/admin/ui/DashboardMetrics';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/admin/ui/dialog';
import { EstudianteDetalle } from '~/components/admin/ui/EstudianteDetalle';
import { GenericTable } from '~/components/admin/ui/GenericTable';
import { Input } from '~/components/admin/ui/input';
import type { Estudiante } from '~/types/user';

// Ensure AddStudentForm is correctly imported

export default function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([
    {
      id: 1,
      idEstudiante: 'EST001',
      nombreCompleto: 'Ana María García López',
      nombre: 'Ana María',
      apellido: 'García López',
      numeroDocumento: '1234567890',
      fechaNacimiento: { dia: '15', mes: '05', año: '1995' },
      correo: 'ana.garcia@ejemplo.com',
      password: 'contraseña123',
      edad: 28,
      info_residencia: {
        ciudad: 'Madrid',
        pais: 'España',
        vecindario: 'Centro',
        direccion: 'Calle Mayor 123',
      },
      cursos: [
        { nombre: 'Introducción a la Programación', progreso: 75 },
        { nombre: 'Diseño UX/UI', progreso: 50 },
      ],
    },
    {
      id: 2,
      idEstudiante: 'EST002',
      nombreCompleto: 'Carlos Alberto Rodríguez Sánchez',
      nombre: 'Carlos Alberto',
      apellido: 'Rodríguez Sánchez',
      numeroDocumento: '0987654321',
      fechaNacimiento: { dia: '22', mes: '09', año: '1998' },
      correo: 'carlos.rodriguez@ejemplo.com',
      password: 'contraseña456',
      edad: 25,
      info_residencia: {
        ciudad: 'Barcelona',
        pais: 'España',
        vecindario: 'Gracia',
        direccion: 'Avenida Diagonal 456',
      },
      cursos: [
        { nombre: 'Marketing Digital', progreso: 90 },
        { nombre: 'Introducción a la Programación', progreso: 30 },
      ],
    },
  ]);

  const [estudianteSeleccionado, setEstudianteSeleccionado] =
    useState<Estudiante | null>(null);

  const handleAddEstudiante = (nuevoEstudiante: Omit<Estudiante, 'id'>) => {
    setEstudiantes([
      ...estudiantes,
      { ...nuevoEstudiante, id: estudiantes.length + 1 },
    ]);
  };

  const handleEditEstudiante = (estudianteEditado: Omit<Estudiante, 'id'>) => {
    setEstudiantes(
      estudiantes.map((est) =>
        est.id === estudianteSeleccionado?.id
          ? { ...estudianteEditado, id: est.id }
          : est
      )
    );
    setEstudianteSeleccionado(null);
  };

  const columns = [
    { header: 'ID Estudiante', accessor: 'idEstudiante' },
    { header: 'Nombre Completo', accessor: 'nombreCompleto' },
    { header: 'Correo', accessor: 'correo' },
    { header: 'Edad', accessor: 'edad' },
    { header: 'Ciudad', accessor: 'info_residencia.ciudad' },
  ];

  return (
    <div className="space-y-6 bg-background p-8 text-foreground">
      <h2 className="text-3xl font-bold tracking-tight text-white mb-6 sm:mb-8">
        Gestión de Estudiantes
      </h2>

      <DashboardMetrics
        metrics={[
          {
            title: 'Total Estudiantes',
            value: estudiantes.length.toString(),
            icon: Users,
            href: '/estudiantes',
          },
          {
            title: 'Cursos Activos',
            value: '5',
            icon: GraduationCap,
            href: '/cursos',
          },
          {
            title: 'Promedio de Progreso',
            value: '68%',
            icon: TrendingUp,
            href: '/analisis',
          },
        ]}
      />

      <div className="flex items-center justify-between space-x-4 bg-white p-6 rounded-lg">
        <Input placeholder="Buscar estudiantes..." className="max-w-sm " />
        <Dialog>
          <DialogTrigger asChild>
            <Button>Agregar Estudiante</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px] ">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Estudiante</DialogTitle>
            </DialogHeader>
            <AddStudentForm onSubmit={handleAddEstudiante} />
          </DialogContent>
        </Dialog>
      </div>

      <GenericTable
        columns={columns}
        data={estudiantes.map((estudiante) => ({
          idEstudiante: estudiante.idEstudiante,
          nombreCompleto: estudiante.nombreCompleto,
          correo: estudiante.correo,
          edad: estudiante.edad,
          ciudad: estudiante.info_residencia.ciudad,
        }))}
        onRowClick={(row) => {
          const estudiante = estudiantes.find(
            (est) => est.idEstudiante === row.idEstudiante
          );
          if (estudiante) {
            setEstudianteSeleccionado(estudiante);
          }
        }}
        actions={(estudiante) => (
          <>
            <Button
              variant="outline"
              className="mr-2"
              onClick={() =>
                setEstudianteSeleccionado(estudiante as unknown as Estudiante)
              }
            >
              Ver Detalles
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Editar</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Editar Estudiante</DialogTitle>
                </DialogHeader>
                <AddStudentForm
                  onSubmit={handleEditEstudiante}
                  initialData={estudiante as unknown as Estudiante}
                />
              </DialogContent>
            </Dialog>
          </>
        )}
      />

      {estudianteSeleccionado && (
        <Dialog
          open={!!estudianteSeleccionado}
          onOpenChange={() => setEstudianteSeleccionado(null)}
        >
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Detalles del Estudiante</DialogTitle>
            </DialogHeader>
            <EstudianteDetalle estudiante={estudianteSeleccionado} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
