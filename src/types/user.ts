export type FechaNacimiento = {
  dia: string;
  mes: string;
  año: string;
}

export type Address = {
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
export interface Admin {
  // Admin properties
}

export interface Teacher {
  // Teacher properties
}

