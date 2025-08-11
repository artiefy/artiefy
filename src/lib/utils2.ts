export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export interface MateriaGrade {
  id: number;
  title: string;
  grade: number;
  courseTitle?: string;
}

export interface GradesApiResponse {
  materias: MateriaGrade[];
  error?: string;
}
