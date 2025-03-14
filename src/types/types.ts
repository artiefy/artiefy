export interface Course {
	id: string;
	name: string;
	title: string;
	imageUrl?: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	email: string;
	status: 'active' | 'inactive';
	lessons: Lesson[];
	students: Student[]; // Aseguramos que students es un array de Student[]
}


export interface Activity {
	id: string;
	title: string;
	type: 'quiz' | 'assignment' | 'video';
	duration: number;
	description: string;
	createdAt: string;
	updatedAt: string;
}

export interface Educator {
	id: string;
	name: string;
	email: string;
	phone: string;
	specialization: string;
	courses: Course[];
	status: 'active' | 'inactive';
	role: 'educador' | 'admin' | 'assistant' | 'teacher'; // Cambiado de "teacher" a "educador"
	joinDate: string;
	avatar: string;
	username: string;
	password?: string;
	coursesTaught: number;
}

export interface Student {
	students: Student[];
	id: string;
	name: string;
	email: string;
	phone: string;
	status: 'active' | 'inactive';
	role: 'student';
	joinDate: string;
	avatar: string;
	username: string;
	password?: string;
	courses: Course[];

}

export interface User {
	id: string;
	name: string;
	email: string;
	phone: string;
	status: 'active' | 'inactive';
	role: 'student' | 'educador' | 'admin' | 'assistant';
	joinDate: string;
	avatar: string;
}

export interface Ticket {
	id: string;
	title: string;
	description: string;
	priority: 'low' | 'medium' | 'high';
	status: 'open' | 'closed';
	createdAt: string;
	updatedAt: string;
}

export interface Message {
	id: string;
	ticketId: string;
	userId: string;
	content: string;
	createdAt: string;
}

export interface Enrollment {
	id: string;
	userId: string;
	courseId: string;
	status: 'active' | 'inactive';
	joinDate: string;
	completeDate: string;
}

export interface HistoryEntry {
	id: string;
	userId: string;
	content: string;
	createdAt: string;
	educatorId: string;
	action: 'create' | 'update' | 'delete' | 'role_change'; // Agregar 'role_change'
	timestamp: string; // Agregar timestamp
	changes: Record<string, string | number | boolean>; // Agregar changes
	performedBy: string; // Agregar performedBy
}

export interface CreateTicketInput {
	title: string;
	description: string;
	priority: 'low' | 'medium' | 'high';
	titulo: string;
	descripcion: string;
	prioridad: 'baja' | 'media' | 'alta';	
	estado: 'abierto' | 'cerrado';
	asignadoA: string | null;
	categorias: string[];
	urlImagen?: File;
}

export interface CreateMessageInput {
	ticketId: string;
	userId: string;
	content: string;
}

export interface CreateEnrollmentInput {
	userId: string;
	courseId: string;
}

export interface Lesson {
	id: string;
	title: string;
	content: string;
	duration: number;
	description: string;
	createdAt: string;
	updatedAt: string;
	// Campos faltantes
	resourceKey: string;
	resourceNames: string[];
	activities: Activity[];
	courseTitle?: string;
}