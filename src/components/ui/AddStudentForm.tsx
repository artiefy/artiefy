import React, { useState } from 'react';
import { Estudiante, FechaNacimiento, Address } from '~/types/user';
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

interface AddStudentFormProps {
  onSubmit: (estudiante: Omit<Estudiante, 'id'>) => void;
  initialData?: Partial<Estudiante>;
}

export function AddStudentForm({ onSubmit, initialData }: AddStudentFormProps) {
  const [student, setStudent] = useState<Partial<Estudiante>>({
    fechaNacimiento: {} as FechaNacimiento,
    info_residencia: {} as Address,
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setStudent(prev => ({
        ...prev,
        [parent as string]: {
          ...((prev[parent as keyof typeof prev] as object) || {}),
          [child as string]: value
        }
      }));
    } else {
      setStudent(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(student as Omit<Estudiante, 'id'>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="idEstudiante">ID de Estudiante</Label>
        <Input id="idEstudiante" name="idEstudiante" value={student.idEstudiante || ''} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="nombreCompleto">Nombre Completo</Label>
        <Input id="nombreCompleto" name="nombreCompleto" value={student.nombreCompleto || ''} onChange={handleChange} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" value={student.nombre || ''} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" name="apellido" value={student.apellido || ''} onChange={handleChange} required />
        </div>
      </div>
      <div>
        <Label htmlFor="numeroDocumento">Número de Documento</Label>
        <Input id="numeroDocumento" name="numeroDocumento" value={student.numeroDocumento || ''} onChange={handleChange} required />
      </div>
      <div>
        <Label>Fecha de Nacimiento</Label>
        <div className="grid grid-cols-3 gap-2">
          <Input name="fechaNacimiento.dia" placeholder="Día" value={student.fechaNacimiento?.dia || ''} onChange={handleChange} required />
          <Input name="fechaNacimiento.mes" placeholder="Mes" value={student.fechaNacimiento?.mes || ''} onChange={handleChange} required />
          <Input name="fechaNacimiento.año" placeholder="Año" value={student.fechaNacimiento?.año || ''} onChange={handleChange} required />
        </div>
      </div>
      <div>
        <Label htmlFor="correo">Correo Electrónico</Label>
        <Input id="correo" name="correo" type="email" value={student.correo || ''} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" value={student.password || ''} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="edad">Edad</Label>
        <Input id="edad" name="edad" type="number" value={student.edad?.toString() || ''} onChange={handleChange} required />
      </div>
      <div>
        <Label>Ubicación</Label>
        <Input name="info_residencia.ciudad" placeholder="Ciudad" value={student.info_residencia?.ciudad || ''} onChange={handleChange} required className="mt-1" />
        <Input name="info_residencia.pais" placeholder="País" value={student.info_residencia?.pais || ''} onChange={handleChange} required className="mt-1" />
        <Input name="info_residencia.vecindario" placeholder="Vecindario" value={student.info_residencia?.vecindario || ''} onChange={handleChange} required className="mt-1" />
        <Input name="info_residencia.direccion" placeholder="Dirección" value={student.info_residencia?.direccion || ''} onChange={handleChange} required className="mt-1" />
      </div>
      <Button type="submit">
        {initialData ? 'Actualizar Estudiante' : 'Agregar Estudiante'}
      </Button>
    </form>
  );
}

