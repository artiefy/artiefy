export type Ticket = {
    id: number;
    estudiante: string;
    asunto: string;
    descripcion: string;
    estado: 'Abierto' | 'En Progreso' | 'Resuelto';
    fechaCreacion: string | undefined;
    imagen?: string; // URL de la imagen subida
  }
  
  