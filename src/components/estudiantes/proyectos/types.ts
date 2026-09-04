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

export interface CommunityFeedPostAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface CommunityFeedPostProject {
  id: number;
  name: string;
  needsCollaborators: boolean;
}

export type CommunityPostKind = 'none' | 'update' | 'milestone' | 'request';

export interface CommunityFeedPost {
  id: number;
  content: string;
  kind: CommunityPostKind;
  imageKey: string | null;
  imageUrl?: string;
  linkUrl: string | null;
  createdAt: string;
  author: CommunityFeedPostAuthor;
  project: CommunityFeedPostProject | null;
  // Comentarios vivos (sin contar los eliminados) de la publicación. Llega
  // con el propio feed, en la misma consulta, para que la tarjeta pueda
  // pintar el contador sin una petición por publicación.
  commentCount: number;
}

/**
 * Un comentario de una publicación de la comunidad, ya en forma de árbol.
 * La anidación no tiene límite: `replies` puede contener nodos que a su vez
 * tienen respuestas, tantos niveles como haya. El servidor es el único que
 * arma este árbol (y el único que corta ciclos), así que el cliente solo
 * recorre `replies`.
 */
export interface CommunityPostComment {
  id: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  // `true` cuando el comentario fue borrado pero conserva respuestas: el
  // texto y el autor originales no salen del servidor.
  isDeleted: boolean;
  author: CommunityFeedPostAuthor | null;
  replies: CommunityPostComment[];
}
