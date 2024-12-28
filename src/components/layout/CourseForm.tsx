"use client";

import { useState, type ChangeEvent, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Progress } from "~/components/ui/progress";

interface CourseFormProps {
  onSubmitAction: (
    title: string,
    description: string,
    file: File | null,
    category: string,
    instructor: string,
    rating: number
  ) => Promise<void>;
  uploading: boolean;
  editingCourseId: string | null;
  title: string;
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  category: string;
  setCategory: (category: string) => void;
  instructor: string;
  setInstructor: (instructor: string) => void;
  rating: number;
  setRating: (rating: number) => void;
  coverImageKey: string;
  setCoverImageKey: (coverImageKey: string) => void;
}

export default function CourseForm({ onSubmitAction, uploading, editingCourseId }: CourseFormProps) {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [instructor, setInstructor] = useState(user?.fullName ?? "");
  const [rating, setRating] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      setFile(files[0]);
      setFileName(files[0].name);
    } else {
      setFile(null);
      setFileName(null);
    }
  };

  const handleSubmit = async () => {
    setIsEditing(true);
    await onSubmitAction(title, description, file, category, instructor, rating);
  };

  useEffect(() => {
    if (uploading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 50); // Ajusta el intervalo según sea necesario

      return () => clearInterval(interval);
    }
  }, [uploading]);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 500); 

      return () => clearTimeout(timeout);
    }
  }, [progress]);

  useEffect(() => {
    if (!uploading && isEditing) {
      setIsEditing(false);
    }
  }, [uploading, isEditing]);

  useEffect(() => {
    if (user) {
      if (user.fullName) {
        setInstructor(user.fullName);
      }
    }
  }, [user]);

  return (
    <div className="bg-background p-6 rounded-lg shadow-md text-black">
      <h2 className="text-2xl font-bold mb-4 text-primary">{editingCourseId ? "Editar Curso" : "Crear Curso"}</h2>
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
      <div className="mb-4 w-full">
        <style jsx>{`
          input[type="file"]::file-selector-button {
            background-color: #007bff;
            color: white;
            border: 2px;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          }

          input[type="file"]::file-selector-button:hover {
            background-color: #0056b3;
          }

          input[type="file"] {
            font-size: 14px; /* Cambia el estilo del texto al lado del botón */
            color: hsl(var(--primary));
            font-family: montserrat;
          }
        `}</style>
        <input
          id="file"
          type="file"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, video/mp4"
          className="w-full rounded border border-primary p-2"
        />
        {fileName && (
          <p className="mt-3 text-sm text-primary">
            Archivo seleccionado: {fileName}
          </p>
        )}
      </div>
      {uploading && <Progress value={progress} className="w-full mb-4" />}
      <button
        onClick={handleSubmit}
        className="w-full bg-primary text-background hover:bg-primary-dark p-2 rounded"
        disabled={uploading}
      >
        {uploading ? "Subiendo..." : editingCourseId ? (isEditing ? "Editando..." : "Editar") : "Guardar"}
      </button>
    </div>
  );
}