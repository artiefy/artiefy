import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import FileUpload from "./FileUpload";

interface CourseFormProps {
  onSubmit: (title: string, description: string, file: File | null, category: string, instructor: string, rating: number) => Promise<void>;
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
}

export default function CourseForm({
  onSubmit,
  uploading,
  editingCourseId,
  title,
  setTitle,
  description,
  setDescription,
  category,
  setCategory,
  instructor,
  setInstructor,
  rating,
  setRating,
}: CourseFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (uploading) {
      const timer = setTimeout(() => setUploadProgress(100), 500);
      return () => clearTimeout(timer);
    }
  }, [uploading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(title, description, file, category, instructor, rating);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-background p-6 rounded-lg shadow-md">
      <input
        type="text"
        placeholder="Titulo Del Curso"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="mb-4 w-full rounded border border-primary p-2"
      />
      <textarea
        placeholder="Descripcion"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        className="mb-4 w-full rounded border border-primary p-2"
      />
      <input
        type="text"
        placeholder="Categoria"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        required
        className="mb-4 w-full rounded border border-primary p-2"
      />
      <input
        type="text"
        placeholder="Profesor"
        value={instructor}
        onChange={(e) => setInstructor(e.target.value)}
        required
        className="mb-4 w-full rounded border border-primary p-2"
      />
      <input
        type="number"
        placeholder="Rating"
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        required
        className="mb-4 w-full rounded border border-primary p-2"
      />
      <FileUpload setFileAction={setFile} setUploadProgressAction={setUploadProgress} />
      {uploading && <Progress value={uploadProgress} className="w-[33%] text-primary mb-4" />}
      <Button type="submit" disabled={uploading} className="w-full bg-primary text-background hover:bg-primary-dark">
        {editingCourseId ? "Editar Curso" : "Subir Curso"}
      </Button>
    </form>
  );
}