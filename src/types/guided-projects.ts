import { type Category, type Modalidad, type Nivel, type User } from './index';

export interface GuidedProject {
  id: number;
  title: string;
  description: string | null;
  coverImageKey: string | null;
  coverVideoKey: string | null;
  categoryId: number;
  instructor: string;
  instructorName?: string | null;
  creatorId: string;
  rating: number | null;
  modalidadId: number;
  nivelId: number;
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
