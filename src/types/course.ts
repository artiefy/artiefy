export interface Course {
    id: number;
    title: string;
    coverImageKey: string | null;
    category: {
      id: number;
      name: string;
    };
    description: string | null;
    instructor: string;
    rating: number | null;
    createdAt: string;
    updatedAt: string;
    totalStudents: number;
    modalidad: {
      name: string;
    };
    lessons: {
      id: number;
      title: string;
      duration: number;
      description: string | null;
    }[];
  }
  
  