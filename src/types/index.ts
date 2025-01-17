// Interfaces basadas en el esquema proporcionado

export interface User {
  id: string;
  role: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  // Campos opcionales
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
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  rating: number | null;
  modalidadesid: number;
  dificultadid: number;
  totalStudents?: number;
  // Relaciones
  category?: Category;
  modalidad?: Modalidad;
  dificultad?: Dificultad;
  lessons?: Lesson[];
  enrollments?: Enrollment[];
  creator?: User;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  courses?: Course[]; // Añade esta línea
  // Relaciones
  preferences?: Preference[];
}

export interface Preference {
  id: number;
  name: string;
  area_cono: string | null;
  userId: string;
  categoryid: number;
  // Relaciones
  user?: User;
  category?: Category;
}

export interface CourseTaken {
  id: number;
  userId: string;
  courseId: number;
  // Relaciones
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
  order: number;
  courseId: number;
  createdAt: Date;
  updatedAt: Date;
  porcentajecompletado: number;
  resourceKey: string;
  isLocked: boolean;
  userProgress: number;
  isCompleted: boolean;
  lastUpdated: Date;
  // Relaciones
  course?: Course;
  activities?: Activity[];
}

export interface Modalidad {
  id: number;
  name: string;
  description: string | null;
  // Relaciones
  courses?: Course[];
}

export interface Score {
  id: number;
  score: number;
  userId: string;
  categoryid: number;
  // Relaciones
  user?: User;
  category?: Category;
}

export interface Dificultad {
  id: number;
  name: string;
  description: string;
}

export interface Activity {
  id: number;
  name: string;
  description: string | null;
  tipo: string;
  lessonsId: number;
  isCompleted: boolean | null;
  userProgress: number | null;
  lastUpdated: Date;
  // Relaciones
  lesson?: Lesson;
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
  // Relaciones
  user?: User;
}

export interface ProjectTaken {
  id: number;
  userId: string;
  projectId: number;
  // Relaciones
  user?: User;
  project?: Project;
}

// Tipos adicionales para manejar relaciones many-to-many si es necesario

export type UserWithEnrollments = User & { enrollments: Enrollment[] };
export type UserWithCreatedCourses = User & { createdCourses: Course[] };
export type CourseWithEnrollments = Course & { enrollments: Enrollment[] };
export type CategoryWithPreferences = Category & { preferences: Preference[] };
