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
interface AssignTechnicianModalProps {

    ticketId: number;



	onAssign: (updatedTicket: LocalTicket, newImage?: File) => void;



    onClose: () => void;

}


  
export interface TicketListProps {
	tickets: ExtendedLocalTicket[];
	onSelectTicket: (ticket: ExtendedLocalTicket) => void;
	onDeleteTicket: (id: number) => void;
}
  

export interface Ticket {

	id: number;
  
	title: string;
  
	description: string;
  
	status: 'abierto' | 'en progreso' | 'cerrado';
  
	assignedTechnician: string | null;
  
	priority: 'Baja' | 'Media' | 'Alta' | 'Crítico';
  
	history: any[];
  
	attachments: any[];
  
  }
  

// Removed duplicate TicketDetailProps interface
  
export interface TicketListProps {
	tickets: ExtendedLocalTicket[];
	onSelectTicket: (ticket: ExtendedLocalTicket) => void;
	onDeleteTicket: (id: number) => void;
// Removed duplicate TicketListProps interface
	description: string;
	status: 'abierto' | 'en progreso' | 'cerrado';
	assignedTechnician: string | null;
	priority: 'Baja' | 'Media' | 'Alta' | 'Crítico';
	createdAt: string;
	updatedAt: string;
	history: any[];
	attachments: any[];
	// otras propiedades...
  }


export interface Ticket {
	id: number;
	title: string;
	description: string;
	status: 'abierto' | 'en progreso' | 'cerrado';
	assignedTechnician: string | null;
	priority: 'Baja' | 'Media' | 'Alta' | 'Crítico';
	history: any[];
	attachments: any[];
	estudiante?: string;
	asunto?: string;
	descripcion?: string;
	prioridad?: string;
	imagen?: string;
	fechaCreacion?: string | Date;
	estado?: 'Abierto' | 'En Progreso' | 'Resuelto';
}

export interface TicketDetailProps {
	ticket: LocalTicket;
	onUpdateTicket: (updatedTicket: LocalTicket) => void;
	onDeleteTicket: () => void;
}


// Definición de tipos
export interface Ticket {
	id: number;
	title: string;
	description: string;
	// otras propiedades...
  }
  
  interface ExtendedLocalTicket extends Ticket {
	interactions: string[];
	// otras propiedades extendidas...
  }
  
  // Función onCreate que acepta Ticket
  const onCreate = (ticket: Ticket) => {
	// lógica para manejar el ticket
  };
  
  // Conversión de ExtendedLocalTicket a Ticket
  const handleCreate = (newTicket: ExtendedLocalTicket) => {
	const { interactions, ...ticket } = newTicket;
	onCreate(ticket);
  };
  
