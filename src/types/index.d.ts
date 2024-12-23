export interface User {
  id: string;
  role: string;
  name: string | null;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClerkUser {
  id: string;
  emailAddresses: { emailAddress: string }[];
  fullName: string;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  coverImageKey?: string | null;
  creatorId: string;
  category: string;
  instructor: string;
  rating?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseModel = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  instructor: string;
  rating?: number;
  coverImageKey: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
};

export interface Lesson {
  id: number;
  title: string;
  content: string | null;
  order: number;
  courseId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: number;
  userId: string;
  courseId: number;
  enrolledAt: Date;
  completed: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface ErrorResponse {
  error: string;
}

export interface FileUploadProps {
  uploading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setFileAction: (file: File | null) => void;
  setUploadProgressAction: (progress: number) => void;
}

export interface CourseFormProps {
  onSubmit: (
    title: string,
    description: string,
    file: File | null,
    category: string,
    instructor: string,
    rating: number
  ) => void;
  uploading: boolean;
  editingCourseId: number | null;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  category: string;
  setCategory: (category: string) => void;
  instructor: string;
  setInstructor: (instructor: string) => void;
  rating: number;
  setRating: (rating: number) => void;
  coverImageKey: string | null;
  setCoverImageKey: (coverImageKey: string | null) => void;
}

export interface CourseListTeacherProps {
  courses: CourseModel[];
  onEdit: (course: CourseModel) => void;
  onDelete: (courseId: number) => void;
}

export interface CourseListStudentProps {
  courses: Course[];
}

export interface PageProps {
  uploading: boolean;
  editingCourseId: number | null;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  category: string;
  setCategory: (category: string) => void;
  instructor: string;
  setInstructor: (instructor: string) => void;
  rating: number;
  setRating: (rating: number) => void;
  coverImageKey: string | null;
  setCoverImageKey: (coverImageKey: string | null) => void;
}
