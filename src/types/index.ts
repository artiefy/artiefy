export interface User {
	id: string;
	role: string;
	name: string | null;
	email: string;
	createdAt: Date;
	updatedAt: Date;
	phone?: string | null;
	country?: string | null;
	city?: string | null;
	address?: string | null;
	age?: number | null;
	birthDate?: Date | null;
}

export interface Course {
	id: number;
	title: string;
	description: string | null;
	coverImageKey: string | null;
	categoryid: number;
	instructor: string;
	createdAt: string | number | Date;
	updatedAt: string | number | Date;
	creatorId: string;
	rating: number | null;
	modalidadesid: number;
	dificultadid: number;
	totalStudents: number;
	lessons: Lesson[];
	category?: Category;
	modalidad?: Modalidad;
	dificultad?: Dificultad;
	enrollments?: Enrollment[] | { length: number };
	creator?: User;
}

export interface Category {
	id: number;
	name: string;
	description: string | null;
	courses?: { length: number };
	preferences?: Preference[];
	is_featured: boolean | null;
}

export interface Preference {
	id: number;
	name: string;
	area_cono: string | null;
	userId: string;
	categoryid: number;
	user?: User;
	category?: Category;
}

export interface CourseTaken {
	id: number;
	userId: string;
	courseId: number;
	user?: User;
	course?: Course;
}

export interface Lesson {
	id: number;
	title: string;
	description: string | null;
	duration: number;
	coverImageKey: string;
	coverVideoKey: string;
	courseId: number;
	createdAt: Date;
	updatedAt: Date;
	porcentajecompletado: number;
	resourceKey: string;
	userProgress: number;
	isCompleted: boolean;
	lastUpdated: Date;
	course?: Course;
	activities?: Activity[]; // Relación con actividades
	isLocked: boolean | null;
	resourceNames: string[]; // Añadir resourceName como un array de strings
}

export interface LessonWithProgress extends Lesson {
	porcentajecompletado: number;
	isCompleted: boolean;
	isLocked: boolean; // Cambiado de 'boolean | null' a 'boolean'
	resourceNames: string[];
	courseId: number;
	createdAt: Date;
	content?: {
		questions?: Question[];
	};
}

export interface UserLessonsProgress {
	userId: string;
	lessonId: number;
	progress: number;
	isCompleted: boolean;
	isLocked: boolean | null;
	lastUpdated: Date;
}

export interface UserActivitiesProgress {
	userId: string;
	activityId: number;
	progress: number;
	isCompleted: boolean;
	lastUpdated: Date;
	revisada: boolean | null; // Add this field
}

export interface Modalidad {
	id?: number;
	name: string;
	description?: string | null;
	courses?: Course[];
}

export interface Score {
	id: number;
	score: number;
	userId: string;
	categoryid: number;
	user?: User;
	category?: Category;
}

export interface Dificultad {
	id?: number;
	name: string;
	description?: string;
}

export interface Activity {
	id: number;
	name: string;
	description: string | null;
	lastUpdated: Date;
	lessonsId: number;
	revisada: boolean | null; // Cambiado de boolean a boolean | null
	porcentaje: number | null;
	parametroId: number | null;
	typeActi?: TypeActi;
	userActivitiesProgress?: UserActivitiesProgress[];
	content?: {
		questions: Question[];
	};
	fechaMaximaEntrega: Date | null;
	typeid: number;
	isCompleted: boolean;
	userProgress: number;
	createdAt: Date; // Added createdAt property
}

export interface Question {
	id: string;
	text: string;
	type: 'VOF' | 'OM' | 'COMPLETAR';
	correctOptionId?: string;
	options?: Option[];
	correctAnswer?: string;
	answer?: string;
}

export interface Option {
	id: string;
	text: string;
}

export interface TypeActi {
	id: number;
	name: string;
	description: string | null;
	activities?: Activity[];
}

export interface Enrollment {
	id: number;
	userId: string;
	courseId: number;
	enrolledAt: Date;
	completed: boolean | null;
}

export interface Project {
	id: number;
	name: string;
	description: string | null;
	coverImageKey: string | null;
	coverVideoKey: string | null;
	type_project: string;
	userId: string;
	categoryid: number;
	category?: Category;
	user?: User;
}

export interface ProjectTaken {
	id: number;
	userId: string;
	projectId: number;
	user?: User;
	project?: Project;
}

export interface PaginatedCourses {
	courses: Course[];
	total: number;
	page: number;
	pageSize: number;
}

export interface GetCoursesResponse {
	courses: Course[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface GetCoursesParams {
	pagenum?: number;
	pageSize?: number;
	categoryId?: number;
	searchTerm?: string;
}

export type UserWithEnrollments = User & { enrollments: Enrollment[] };
export type UserWithCreatedCourses = User & { createdCourses: Course[] };
export type CourseWithEnrollments = Course & { enrollments: Enrollment[] };
export type CategoryWithPreferences = Category & { preferences: Preference[] };

export interface SavedAnswer {
	questionId: string;
	answer: string;
	isCorrect: boolean;
}

export interface ActivityResults {
	score: number;
	answers: Record<string, SavedAnswer>;
	passed: boolean;
	submittedAt: string;
}
