"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import CourseForm from "~/components/layout/CourseForm";
import CourseListTeacher from "~/components/layout/CourseListTeacher";
import { type CourseModel } from "~/types";

export default function Page() {
  const { user } = useUser();
  const [courses, setCourses] = useState<CourseModel[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseModel | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchCourses = async () => {
    const response = await fetch("/api/courses");
    if (response.ok) {
      const data = await response.json();
      setCourses(data);
    } else {
      console.error("Failed to fetch courses:", response.statusText);
    }
  };

  useEffect(() => {
    fetchCourses().catch((error) => console.error("Error fetching courses:", error));
  }, []);

  const handleCreateOrEditCourse = async (
    title: string,
    description: string,
    file: File | null,
    category: string,
    instructor: string,
    rating: number
  ) => {
    if (!user) return;

    let coverImageKey = "";
    if (file) {
      setUploading(true);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });

      const { url, fields } = await uploadResponse.json();

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) =>
        formData.append(key, value)
      );
      formData.append("file", file);

      await fetch(url, { method: "POST", body: formData });
      coverImageKey = fields.key;
      setUploading(false);
    }

    if (editingCourse) {
      await fetch("/api/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCourse.id,
          title,
          description,
          coverImageKey,
          category,
          instructor,
          rating,
          userId: user.id,
        }),
      });
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === editingCourse.id
            ? { ...course, title, description, category, instructor, rating }
            : course
        )
      );
      setEditingCourse(null);
    } else {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          instructor,
          rating,
          userId: user.id,
          coverImageKey,
        }),
      });
      setCourses((prevCourses) => [
        ...prevCourses,
        { id: Date.now(), title, description, category, instructor, rating },
      ]);
    }

    fetchCourses();
  };

  const handleEditCourse = (course: CourseModel) => {
    setEditingCourse(course);
  };

  const handleDeleteCourse = async (id: number) => {
    if (!user) return;
    await fetch("/api/courses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId: user.id }),
    });
    fetchCourses();
  };

  return (
    <div className="px-16">
      <main className="container mx-auto px-16">
        <header className="flex justify-between items-center mt-4 px-7">
          <h1 className="text-3xl font-bold">Subir Cursos</h1>
          <UserButton showName />
        </header>
        <div className="mb-6 bg-background p-6 rounded-lg shadow-md">
          <CourseForm
            onSubmit={handleCreateOrEditCourse}
            uploading={uploading}
            editingCourseId={editingCourse?.id ?? null}
            title={editingCourse?.title ?? ""}
            setTitle={(title) => setEditingCourse((prev) => prev ? { ...prev, title } : null)}
            description={editingCourse?.description ?? ""}
            setDescription={(description) => setEditingCourse((prev) => prev ? { ...prev, description } : null)}
            category={editingCourse?.category ?? ""}
            setCategory={(category) => setEditingCourse((prev) => prev ? { ...prev, category } : null)}
            instructor={editingCourse?.instructor ?? ""}
            setInstructor={(instructor) => setEditingCourse((prev) => prev ? { ...prev, instructor } : null)}
            rating={editingCourse?.rating ?? 0}
            setRating={(rating) => setEditingCourse((prev) => prev ? { ...prev, rating } : null)}
            coverImageKey={editingCourse?.coverImageKey ?? null}
            setCoverImageKey={(coverImageKey) => setEditingCourse((prev) => prev ? { ...prev, coverImageKey } : null)}
          />
        </div>
        <h2 className="mb-4 text-2xl font-bold">Lista De Cursos Creados</h2>
        <CourseListTeacher
          courses={courses}
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
        />
      </main>
    </div>
  );
}