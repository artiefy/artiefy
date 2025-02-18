import React from 'react'
import type { Estudiante } from '~/types/user'

interface EstudianteDetalleProps {
  estudiante: Estudiante
}

export function EstudianteDetalle({ estudiante }: EstudianteDetalleProps) {
  return (
    <div className="space-y-4 text-white text-sm md:text-base">
      <div>
        <h3 className="text-lg font-medium">Información Personal</h3>
        <p><strong>ID Estudiante:</strong> {estudiante.idEstudiante}</p>
        <p><strong>Nombre Completo:</strong> {estudiante.nombreCompleto}</p>
        <p><strong>Nombre:</strong> {estudiante.nombre}</p>
        <p><strong>Apellido:</strong> {estudiante.apellido}</p>
        <p><strong>Número de Documento:</strong> {estudiante.numeroDocumento}</p>
        <p><strong>Fecha de Nacimiento:</strong> {`${estudiante.fechaNacimiento.dia}/${estudiante.fechaNacimiento.mes}/${estudiante.fechaNacimiento.año}`}</p>
        <p><strong>Edad:</strong> {estudiante.edad}</p>
        <p><strong>Correo:</strong> {estudiante.correo}</p>
      </div>
      <div>
        <h3 className="text-lg font-medium">Residencia</h3>
        <p><strong>Ciudad:</strong> {estudiante.info_residencia.ciudad}</p>
        <p><strong>País:</strong> {estudiante.info_residencia.pais}</p>
        <p><strong>Vecindario:</strong> {estudiante.info_residencia.vecindario}</p>
        <p><strong>Dirección:</strong> {estudiante.info_residencia.direccion}</p>
      </div>
      <div>
        <h3 className="text-lg font-medium">Cursos</h3>
        <ul>
          {estudiante.cursos.map((curso: { nombre: string; progreso: number }, index: number) => (
            <li key={index}>
              {curso.nombre} - Progreso: {curso.progreso}%
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

