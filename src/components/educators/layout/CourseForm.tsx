"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "~/components/educators/ui/button";

interface CourseFormProps {
  courseId?: string;
  modalidadesid?: string;
}

interface CourseData {
  title: string;
  description: string;
  categoryId: number;
  modalidadesid: number;
  instructor: string;
}

export function CourseForm({ courseId, modalidadesid }: CourseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState<CourseData>({
    title: "",
    description: "",
    categoryId: 1,
    modalidadesid: modalidadesid ? parseInt(modalidadesid) : 1,
    instructor: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = courseId ? `/api/courses/${courseId}` : "/api/courses";
      const method = courseId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) throw new Error("Error al guardar el curso");
      router.push("/dashboard/profesores/cursos");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Título del curso</label>
        <input
          type="text"
          value={courseData.title}
          onChange={(e) =>
            setCourseData({ ...courseData, title: e.target.value })
          }
          className="w-full rounded-md border p-2"
          placeholder="Introduce el título del curso"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Descripción</label>
        <textarea
          value={courseData.description}
          onChange={(e) =>
            setCourseData({ ...courseData, description: e.target.value })
          }
          className="w-full rounded-md border p-2"
          placeholder="Describe el contenido del curso"
          required
          rows={4}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/profesores/cursos")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : courseId ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
