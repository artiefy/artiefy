export interface Student {
	id: string
	name: string
	email: string
	status: "active" | "inactive"
  }

  export interface Course {
    id: string;
    name: string;
}
  
  export interface Course {
	id: string
	title: string
	imageUrl?: string
	students: Student[]
	description?: string
	startDate?: string
	endDate?: string
  }
  
  export interface Educator {
	id: string
	name: string
	email: string
	phone: string
	specialization: string
	courses: Course[]
	status: "active" | "inactive"
	role: "educador" | "admin" | "assistant" // Cambiado de "teacher" a "educador"
	joinDate: string
	avatar: string
  }
  
  export interface HistoryEntry {
	id: string
	educatorId: string
	action: "create" | "update" | "delete" | "role_change"
	changes: Record<string, any>
	timestamp: string
	performedBy: string
  }
  
  
  export interface Educator {
	id: string
	name: string
	email: string
	phone: string
	specialization: string
	role: "admin" | "assistant" | "educador"
	status: "active" | "inactive"
	username: string
  }