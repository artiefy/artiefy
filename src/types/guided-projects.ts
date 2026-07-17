import { type Category, type Modalidad, type Nivel, type User } from './index';

export interface GuidedProjectInstructor {
  id: string;
  name: string | null;
  profesion: string | null;
  descripcion: string | null;
  profileImageKey: string | null;
}

export interface GuidedProject {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  coverImageKey: string | null;
  coverVideoKey: string | null;
  categoryId: number;
  instructor: string;
  instructors?: GuidedProjectInstructor[];
  instructorName?: string | null;
  instructorProfesion?: string | null;
  instructorDescripcion?: string | null;
  instructorProfileImageKey?: string | null;
  creatorId: string;
  rating: number | null;
  modalidadId: number;
  nivelId: number;
  nivelName?: string | null;
  courseTypeId: number | null;
  typeCourseId: number | null;
  certificationTypeId: number | null;
  individualPrice: number | null;
  requiresProgram: boolean | null;
  isActive: boolean | null;
  isTop: boolean | null;
  isFeatured: boolean | null;
  visibility: boolean | null;
  metaPixelId: string | null;
  // Rich content fields (Lovable layout)
  problemStatement: string | null;
  howItWorks: string | null;
  whatYouWillBuild: string | null;
  prerequisites: string | null;
  techStack: string | null;
  deliverablesDescription: string | null;
  studentsCount: number | null;
  contentHours: number | null;
  slug: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  category?: Category;
  creator?: User;
  modalidad?: Modalidad;
  nivel?: Nivel;
  typeCourse?: { id: number; type: string };
  objectives?: GuidedObjective[];

  // Progress
  porcentajecompletado?: number;
  enrolled?: boolean;
}

export interface GuidedObjective {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  orderIndex: number;
  coverImageKey: string | null;
  coverVideoKey: string | null;
  resourceKey: string | null;
  resourceNames: string | null;
  guidedProjectId: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  guidedProject?: GuidedProject;
  activities?: GuidedObjectiveActivity[];

  // User Progress fields
  userProgress?: number;
  isCompleted?: boolean;
  isLocked?: boolean;
  isNew?: boolean;
  lastPositionSeconds?: number;
}

export interface GuidedObjectiveActivity {
  id: number;
  name: string;
  description: string | null;
  typeId: number;
  objectiveId: number;
  parametroId: number | null;
  porcentaje: number | null;
  startDate: Date | null;
  endDate: Date | null;
  weekNumber: number | null;
  fechaMaximaEntrega: Date | null;
  revisada: boolean | null;
  lastUpdated: Date;
  instructionVideoKey: string | null;
  instructionText: string | null;

  // Relations
  objective?: GuidedObjective;

  // User Progress fields
  userProgress?: number;
  isCompleted?: boolean;
  attemptCount?: number;
  finalGrade?: number | null;
  lastAttemptAt?: Date | null;
}

export interface UserObjectiveProgress {
  userId: string;
  objectiveId: number;
  progress: number;
  lastPositionSeconds: number;
  isCompleted: boolean;
  isLocked: boolean | null;
  isNew: boolean;
  lastUpdated: Date;
}

export interface UserGuidedActivityProgress {
  userId: string;
  activityId: number;
  progress: number;
  isCompleted: boolean;
  revisada: boolean | null;
  attemptCount: number | null;
  finalGrade: number | null;
  lastAttemptAt: Date | null;
  lastUpdated: Date;
}

export interface GuidedEnrollment {
  id: number;
  userId: string;
  guidedProjectId: number;
  enrolledAt: Date;
  completed: boolean | null;
  isPermanent: boolean;
}
