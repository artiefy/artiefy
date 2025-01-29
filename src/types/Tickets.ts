export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface Assignee {
	id: number;
	name: string;
	role: string;
	avatar: string;
}


export interface LocalTicket {
	id: number;
	title: string;
	description: string;
	status: TicketStatus;
	priority: TicketPriority;
	createdAt: Date;
	updatedAt: Date;
	studentName: string;
	studentEmail: string;
	assignee?: Assignee;
	attachments?: string[];
	image?: string; // URL of the uploaded image
}

interface TicketListProps {

	tickets: LocalTicket[];
  
	onSelectTicket: (ticket: LocalTicket) => void;
  
	onDeleteTicket: (id: number) => void;
  
  }
  

export interface Ticket {
	id: number;
	title: string;
	description: string;
	status: TicketStatus;
	priority: TicketPriority;
	createdAt: Date;
	updatedAt: Date;
	studentName: string;
	studentEmail: string;
	assignee?: Assignee;
	attachments?: string[];
	image?: string; // URL of the uploaded image
}

export interface Ticket {
	id: number;

	estudiante: string;

	asunto: string;

	descripcion: string;

	prioridad: string;

	imagen?: string;

	estado: 'Abierto' | 'En Progreso' | 'Resuelto';
}

export interface Ticket {
	id: number;

	estudiante: string;

	asunto: string;


	prioridad: string;

	imagen?: string;

	fechaCreacion?: string | Date;

	// Add other properties here
}


