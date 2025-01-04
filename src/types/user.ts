export type Address = {
    ciudad: string;
    pais: string;
    vecindario: string;
    direccion: string;
  }
  
  export type FechaNacimiento = {
    dia: string;
    mes: string;
    año: string;
  }
  
  export interface Student {
    id?: number;
    nombre: string;
    apellido: string;
    correo: string;
    password: string;
    edad: number;
    fechaNacimiento: FechaNacimiento;
    info_residencia: Address;
  }
  
  