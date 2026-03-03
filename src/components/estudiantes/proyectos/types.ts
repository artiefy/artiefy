export interface ProjectSocialAuthor {
  id?: string;
  name: string;
  email?: string;
}

export interface ProjectSocialCategory {
  id?: number;
  name: string;
}

export interface ProjectSocialItem {
  id: number;
  title: string;
  description: string;
  stage: 'Idea' | 'MVP' | 'En progreso' | 'Lanzado';
  tags: string[];
  category: ProjectSocialCategory;
  author: ProjectSocialAuthor;
  isPublic: boolean;
  needsCollaborators: boolean;
  createdAt: string;
  coverImageUrl?: string;
  coverImageKey?: string | null;
  coverVideoKey?: string | null;
  likes: number;
  comments: number;
  saves: number;
  courseId?: number | null;
  ownerId?: string;
  isOwner?: boolean;
  isCollaborator?: boolean;
  categoryId?: number;
  typeProject?: string | null;
  planteamiento?: string | null;
  justificacion?: string | null;
  objetivoGeneral?: string | null;
  requirements?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  progressPercentage?: number;
}

export interface ProjectSocialCollaborator {
  userId: string;
  name: string;
  imageUrl?: string;
}
