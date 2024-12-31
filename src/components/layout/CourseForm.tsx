"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { FiUploadCloud } from "react-icons/fi";
import { MdClose } from "react-icons/md";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Progress } from "~/components/ui/progress";

interface CourseFormProps {
  onSubmitAction: (
    title: string,
    description: string,
    file: File | null,
    category: string,
    instructor: string,
    rating: number,
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
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function CourseForm({
  onSubmitAction,
  uploading,
  editingCourseId,
  isOpen,
  onCloseAction,
}: CourseFormProps) {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [instructor, setInstructor] = useState(user?.fullName ?? "");
  const [rating, setRating] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      setFile(files[0]);
      setFileName(files[0].name);
      setFileSize(files[0].size);
    } else {
      setFile(null);
      setFileName(null);
      setFileSize(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      setFile(files[0]);
      setFileName(files[0].name);
      setFileSize(files[0].size);
    } else {
      setFile(null);
      setFileName(null);
      setFileSize(null);
    }
  };

  const handleSubmit = async () => {
    setIsEditing(true);
    await onSubmitAction(
      title,
      description,
      file,
      category,
      instructor,
      rating,
    );
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
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-h-screen max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCourseId ? "Editar Curso" : "Crear Curso"}
          </DialogTitle>
          <DialogDescription>
            {editingCourseId
              ? "Edita los detalles del curso"
              : "Llena los detalles para crear un nuevo curso"}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-background p-6 text-black shadow-md">
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
          <div
            className={`rounded-lg border-2 border-dashed p-8 ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"} transition-all duration-300 ease-in-out`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <FiUploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="mt-4 text-xl font-medium text-gray-700">
                Arrastra y suelta tu imagen aquí
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                o haz clic para seleccionar un archivo desde tu computadora
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Supports: JPG, PNG, GIF (Max size: 5MB)
              </p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="mt-4 inline-flex cursor-pointer items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Seleccionar Archivo
              </label>
            </div>
          </div>
          {fileName && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-medium text-gray-700">
                Vista previa de la imagen
              </h3>
              <div className="group relative overflow-hidden rounded-lg bg-gray-100">
                {file && (
                  <Image
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    width={500}
                    height={200}
                    className="h-48 w-full object-cover"
                  />
                )}
                <button
                  onClick={() => {
                    setFile(null);
                    setFileName(null);
                    setFileSize(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                >
                  <MdClose className="h-5 w-5" />
                </button>
                <div className="p-2 flex justify-between">
                  <p className="truncate text-sm text-gray-500">{fileName}</p>
                  <p className="text-sm text-gray-500">{((fileSize ?? 0) / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            </div>
          )}
          {uploading && <Progress value={progress} className="mb-4 w-full" />}
        </div>
        <DialogFooter>
          <button
            onClick={handleSubmit}
            className="hover:bg-primary-dark w-full rounded bg-primary p-2 text-background"
            disabled={uploading}
          >
            {uploading
              ? "Subiendo..."
              : editingCourseId
                ? isEditing
                  ? "Editando..."
                  : "Editar"
                : "Guardar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
