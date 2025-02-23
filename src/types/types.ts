export type Role = 'admin' | 'teacher' | 'assistant';

export interface Educator {
	id: string;
	name: string;
	email: string;
	phone: string;
	specialization: string;
	courses: string[];
	status: 'active' | 'inactive';
	role: Role;
	joinDate: string;
	avatar: string;
	credentials?: {
		username: string;
		lastPasswordChange: string;
	};
}

export interface HistoryEntry {
  educatorId: string;
	id: string;
	timestamp: string;
	action: 'create' | 'update' | 'delete' | 'role_change';
	changes: Record<string, any>;
	performedBy: string;
}
