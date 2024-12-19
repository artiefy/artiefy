import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import FileUpload from "./FileUpload";

interface CourseFormProps {
  onSubmit: (title: string, description: string, file: File | null) => void;
  uploading: boolean;
  editingCourseId: number | null;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
}

export default function CourseForm({
  onSubmit,
  uploading,
  editingCourseId,
  title,
  setTitle,
  description,
  setDescription,
}: CourseFormProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(title, description, file);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Course Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="mb-4 w-full rounded border border-gray-300 p-2"
      />
      <textarea
        placeholder="Course Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        className="mb-4 w-full rounded border border-gray-300 p-2"
      />
      <FileUpload setFile={setFile} />
      {uploading && <Progress value={0} className="mb-4" />}
      <Button type="submit" disabled={uploading} className="w-full">
        {editingCourseId ? "Update Course" : "Create Course"}
      </Button>
    </form>
  );
}