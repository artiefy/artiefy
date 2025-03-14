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

// Create a new type for basic course data
export interface BaseCourse {
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
	nivelid: number;
	category?: Category;
	modalidad?: Modalidad;
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
	Nivelid: number;
	totalStudents: number;
	lessons: Lesson[];
	category?: Category;
	modalidad?: Modalidad;
	Nivel?: Nivel;
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
	isLocked: boolean;
	isCompleted: boolean;
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

export interface Nivel {
	id?: number;
	name: string;
	description?: string;
}

export interface Activity {
	id: number;
	name: string;
	description: string | null;
	typeid: number;
	lessonsId: number;
	isCompleted: boolean | null;
	userProgress: number | null;
	lastUpdated: Date;
	lesson?: Lesson;
	typeActi?: TypeActi;
	userActivitiesProgress?: UserActivitiesProgress[];
	content?: {
		questions: Question[];
	};
	revisada: boolean;
	parametroId: number;
	porcentaje: number;
	fechaMaximaEntrega: Date;
}

export interface Question {
	id: string;
	text: string;
	options: Option[];
	correctOptionId: string;
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

export interface Program {
	id: string;
	title: string;
	description: string | null;
	coverImageKey: string | null;
	createdAt: Date | null; // Allow null
	updatedAt: Date | null; // Allow null
	creatorId: string;
	rating: number | null; // Allow null
	categoryid: number;
	creator?: User;
	category?: Category;
	materias?: MateriaWithCourse[];
	enrollmentPrograms?: EnrollmentProgram[];
}

// Original Materia interface
export interface Materia {
    id: number;
    title: string;
    description: string;
    programaId: number;
    courseId: number;
    courseid: number;
    curso: BaseCourse | undefined;
}

// New interface for Materia with optional course
export interface MateriaWithCourse {
	id: number;
	title: string;
	description: string | null;
	programaId: number;
	courseid: number | null;
	curso?: BaseCourse; // Changed from Course to BaseCourse
}

export interface EnrollmentProgram {
	id: number;
	programaId: number;
	userId: string;
	enrolledAt: Date;
	completed: boolean;
	user?: User;
	programa?: Program;
}

export type UserWithEnrollments = User & { enrollments: Enrollment[] };
export type UserWithCreatedCourses = User & { createdCourses: Course[] };
export type CourseWithEnrollments = Course & { enrollments: Enrollment[] };
export type CategoryWithPreferences = Category & { preferences: Preference[] };
