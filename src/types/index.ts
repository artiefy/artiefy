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

// Keep the full Course interface for other uses
export interface Course extends BaseCourse {
	totalStudents: number;
	lessons: Lesson[];
	nivel?: Nivel;
	enrollments?: Enrollment[] | { length: number };
	creator?: User;
	isNew?: boolean;
	requerimientos?: string[];
	materias?: CourseMateria[];
}

// Add new interface for course materias
export interface CourseMateria {
	id: number;
	title: string;
	description: string | null;
	programaId: number;
	courseid: number | null; // Changed from number to number | null to match DB schema
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
	activities?: Activity[];
	isLocked: boolean | null;
	resourceNames: string[];
	isNew: boolean; // Agregar propiedad isNew
}

export interface LessonWithProgress extends Lesson {
	porcentajecompletado: number;
	isCompleted: boolean;
	isLocked: boolean;
	courseTitle: string;
	resourceNames: string[];
	courseId: number;
	createdAt: Date;
	content?: {
		questions?: Question[];
	};
	isNew: boolean;
}

export interface UserLessonsProgress {
	userId: string;
	lessonId: number;
	progress: number;
	isCompleted: boolean;
	isLocked: boolean | null;
	isNew: boolean;
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

// Changed from Dificultad to Nivel
export interface Nivel {
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
	createdAt?: Date; // Make createdAt optional
	attemptLimit: number;
	currentAttempts: number;
	finalGrade?: number;
	lastAttemptAt?: Date;
	pesoPregunta?: number;
}

export interface Question {
	id: string;
	text: string;
	type: 'VOF' | 'OM' | 'COMPLETAR';
	correctOptionId?: string;
	options?: Option[];
	correctAnswer?: string;
	answer?: string;
	pesoPregunta: number; // Add weight for question
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
	pesoPregunta: number;
}

export interface ActivityResults {
	score: number;
	answers: Record<string, SavedAnswer>;
	passed: boolean;
	submittedAt: string;
	attemptCount?: number; // Add attempt counter
	finalGrade: number;
	parameterId?: number;
	revisada?: boolean;
	courseId?: number;
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
	description: string | null;
	programaId: number;
	courseid: number | null;
	curso: Course; // Make curso required instead of optional
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

// Add new interface for grades
export interface GradeReport {
	materiaId: number;
	materiaName: string;
	grade: number;
	activities: {
		activityId: number;
		name: string;
		grade: number;
		weight: number;
	}[];
	parameters: ParameterGrade[];
}

export interface MateriaGrade {
	id: number;
	materiaId: number;
	userId: string;
	grade: number;
	updatedAt: Date;
	materia?: Materia;
	user?: User;
}

export interface ParameterGrade {
	id: number;
	parameterId: number;
	userId: string;
	grade: number;
	updatedAt: Date;
	parameterName: string;
	weight: number;
	parameter?: Parameter;
	user?: User;
}

export interface Parameter {
	id: number;
	name: string;
	description: string;
	porcentaje: number;
	courseId: number;
	course?: Course;
}
