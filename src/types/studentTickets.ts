export interface StudentTicket {
  id: number;
  email: string;
  description: string;
  comments: string;
  estado: "abierto" | "en proceso" | "en revision" | "solucionado" | "cerrado";
  tipo: "otro" | "bug" | "revision" | "logs";
  creatorId: string;
  coverImageKey?: string | null;
  videoKey?: string | null;
  documentKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentTicketDTO {
  email: string;
  description: string;
  tipo: StudentTicket["tipo"];
  estado: StudentTicket["estado"];
  title?: string; // Optional title for the ticket
}
