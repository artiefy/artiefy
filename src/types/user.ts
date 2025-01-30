export interface FechaNacimiento {
  dia: string;
  mes: string;
  año: string;
}

export interface Address {
  ciudad: string;
  pais: string;
  vecindario: string;
  direccion: string;
}

export interface Estudiante {
  id: number;
  idEstudiante: string;
  nombreCompleto: string;
  nombre: string;
  apellido: string;
  numeroDocumento: string;
  fechaNacimiento: FechaNacimiento;
  correo: string;
  password: string;
  edad: number;
  info_residencia: Address;
  cursos: { nombre: string; progreso: number }[];
}

// You can also export other user types here if needed
export type Admin = object;

export type Teacher = object;
