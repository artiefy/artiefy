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

export interface TicketListProps {
	tickets: ExtendedLocalTicket[];
	onSelectTicket: (ticket: ExtendedLocalTicket) => void;
	onDeleteTicket: (id: string) => void;
	// Removed duplicate TicketListProps interface
	description: string;
	status: 'abierto' | 'en progreso' | 'cerrado';
	assignedTechnician: string | null;
	priority: 'Baja' | 'Media' | 'Alta' | 'Crítico';
	createdAt: string;
	updatedAt: string;
	estudiante?: string;
	asunto?: string;
	descripcion?: string;
	prioridad?: string;
	imagen?: string;
	fechaCreacion?: string | Date;
}

export interface Ticket {
	id: number;
	title: string;
	description: string;
	status: 'abierto' | 'en progreso' | 'cerrado';
	assignedTechnician: string | null;
	priority: 'Baja' | 'Media' | 'Alta' | 'Crítico';
	createdAt: string;
	estudiante?: string;
	asunto?: string;
	descripcion?: string;
	prioridad?: string;
	imagen?: string;
	fechaCreacion?: string | Date;
	estado?: 'Abierto' | 'En Progreso' | 'Resuelto';
}

export interface CreateTicketInput {
	titulo: string;
	estado: 'pendiente' | 'en_proceso' | 'critico' | 'completado';
	asignadoA: string | null;
	prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
	descripcion: string;
	urlImagen?: File;
	categorias: string[];
}

interface ExtendedLocalTicket extends Ticket {
	interactions: string[];
	// otras propiedades extendidas...
}

