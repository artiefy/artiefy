export interface Project {
  id: number;
  name: string;
  description?: string; // Descripción general generada por IA
  planteamiento: string; // Problema a resolver
  justificacion?: string;
  objetivo_general?: string;
  objetivos_especificos?: {
    id: number;
    description: string;
    actividades?: {
      id?: number;
      descripcion: string;
      meses: number[];
      startDate?: string;
      endDate?: string;
      deliverableKey?: string | null;
      deliverableUrl?: string | null;
      deliverableName?: string | null;
      deliverableDescription?: string | null;
      deliverableSubmittedAt?: string | null;
    }[];
  }[];
  activities?: {
    id: number;
    descripcion: string;
    meses: number[];
    startDate?: string;
    endDate?: string;
    deliverableKey?: string | null;
    deliverableUrl?: string | null;
    deliverableName?: string | null;
    deliverableDescription?: string | null;
    deliverableSubmittedAt?: string | null;
  }[];
  requirements?: string; // Requisitos (JSON string)
  type_project: string;
  categoryId: number;
  categoryName?: string;
  progressPercentage?: number;
  coverImageKey?: string | null;
  fecha_inicio?: string;
  fecha_fin?: string;
  duration_unit?: string; // 'dias', 'semanas', 'meses'
  multimedia?: string; // Multimedia (JSON string array de objetos con name, url, type, key)
  createdAt: string;
  updatedAt: string;
}
