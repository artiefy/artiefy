'use client'

import React, { useState } from 'react';
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Address, FechaNacimiento, Student } from '~/types/user';

export function AddStudentForm() {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [student, setStudent] = useState<Partial<Student>>({
    fechaNacimiento: {} as FechaNacimiento,
    info_residencia: {} as Address,
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
    // Aquí iría la lógica para enviar los datos del estudiante al servidor
    console.log(student);
    // Después de enviar, podríamos ocultar el formulario y mostrar un mensaje de éxito
    setIsFormVisible(false);
  };

  if (!isFormVisible) {
    return (
      <Button onClick={() => setIsFormVisible(true)}>Agregar Estudiante</Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Nuevo Estudiante</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" value={student.nombre || ''} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="apellido">Apellido</Label>
            <Input id="apellido" name="apellido" value={student.apellido || ''} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="correo">Correo</Label>
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
            <Label>Fecha de Nacimiento</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input name="fechaNacimiento.dia" placeholder="Día" value={student.fechaNacimiento?.dia || ''} onChange={handleChange} required />
              <Input name="fechaNacimiento.mes" placeholder="Mes" value={student.fechaNacimiento?.mes || ''} onChange={handleChange} required />
              <Input name="fechaNacimiento.año" placeholder="Año" value={student.fechaNacimiento?.año || ''} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <Label>Ubicación</Label>
            <Input name="info_residencia.ciudad" placeholder="Ciudad" value={student.info_residencia?.ciudad || ''} onChange={handleChange} required />
            <Input name="info_residencia.pais" placeholder="País" value={student.info_residencia?.pais || ''} onChange={handleChange} required />
            <Input name="info_residencia.vecindario" placeholder="Vecindario" value={student.info_residencia?.vecindario || ''} onChange={handleChange} required />
            <Input name="info_residencia.direccion" placeholder="Dirección" value={student.info_residencia?.direccion || ''} onChange={handleChange} required />
          </div>
          <div className="flex justify-between">
            <Button type="submit">Guardar Estudiante</Button>
            <Button type="button" variant="outline" onClick={() => setIsFormVisible(false)}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

