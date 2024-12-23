"use client";

import { useState } from "react";
import FileUpload from "./FileUpload";

type CourseFormProps = {
  onSubmit: (
    title: string,
    description: string,
    file: File | null,
    category: string,
    instructor: string,
    rating: number
  ) => void;
};

export default function CourseForm({ onSubmit }: CourseFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [instructor, setInstructor] = useState("");
  const [rating, setRating] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = () => {
    onSubmit(title, description, file, category, instructor, rating);
  };

  return (
    <div className="bg-background p-6 rounded-lg shadow-md text-black">
      <h2 className="text-2xl font-bold mb-4">Crear Curso</h2>
      <input
        type="text"
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-4 w-full rounded border border-primary p-2"
      />
      <textarea
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="mb-4 w-full rounded border border-primary p-2"
      />
      <input
        type="text"
        placeholder="Categoría"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="mb-4 w-full rounded border border-primary p-2"
      />
      <input
        type="text"
        placeholder="Instructor"
        value={instructor}
        onChange={(e) => setInstructor(e.target.value)}
        className="mb-4 w-full rounded border border-primary p-2"
      />
      <input
        type="number"
        placeholder="Calificación"
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="mb-4 w-full rounded border border-primary p-2"
      />
      <FileUpload setFileAction={setFile} />
      <button
        onClick={handleSubmit}
        className="w-full bg-primary text-background hover:bg-primary-dark p-2 rounded"
      >
        Guardar
      </button>
    </div>
  );
}
