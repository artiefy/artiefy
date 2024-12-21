//src\app\dashboard\profesores\page.tsx
"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import CourseForm from "~/components/layout/CourseForm";
import CourseListTeacher from "~/components/layout/CourseListTeacher";
import { type Course as CourseModel } from "~/models/courseModels";

interface ClerkUser {
  id: string;
  emailAddresses: { emailAddress: string }[];
  fullName: string;
}

export default function Page() {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [instructor, setInstructor] = useState(""); // Nuevo estado
  const [rating, setRating] = useState(0); // Nuevo estado
  const [courses, setCourses] = useState<CourseModel[]>([]);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        console.error("Failed to fetch courses:", response.statusText);
      }
    };
    fetchData().catch((error) => console.error("Error fetching data:", error));
  }, [user]);

  const handleSubmit = async (
    title: string,
    description: string,
    file: File | null,
    category: string,
    instructor: string, // Nuevo parámetro
    rating: number // Nuevo parámetro
  ) => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setUploading(true);

    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + "/api/upload",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      },
    );

    if (response.ok) {
      const jsonResponse = (await response.json()) as {
        url: string;
        fields: Record<string, string>;
      };
      const { url, fields } = jsonResponse;

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);

      const uploadResponse = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (uploadResponse.ok) {
        const coverImageKey = fields.key;
        const creatorId = user?.id;
        if (!creatorId) {
          console.error("User ID is missing");
          alert("User ID is missing");
          setUploading(false);
          return;
        }
        if (editingCourseId) {
          await fetch("/api/courses", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: editingCourseId,
              title,
              description,
              coverImageKey,
              category,
              instructor,
              rating,
            }),
          });
          setEditingCourseId(null);
        } else {
          await fetch("/api/courses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title,
              description,
              creatorId,
              coverImageKey,
              category,
              instructor,
              rating,
            }),
          });
        }
        alert("Upload successful!");
        await fetchData();
      } else {
        console.error("S3 Upload Error:", uploadResponse);
        alert("Upload failed.");
      }
    } else {
      alert("Failed to get pre-signed URL.");
    }

    setUploading(false);
  };

  const handleEdit = (course: CourseModel) => {
    setTitle(course.title);
    setDescription(course.description ?? "");
    setCategory(course.category);
    setInstructor(course.instructor); // Establece el instructor
    setRating(course.rating ?? 0); // Establece el rating
    setEditingCourseId(course.id);
  };

  const handleDelete = async (courseId: number) => {
    await fetch("/api/courses", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: courseId }),
    });
    await fetchData();
  };

  return (
    <div className="px-16">
      <main className="container mx-auto px-16">
        <header className="flex justify-between items-center mt-4 px-7">
          <h1 className="text-3xl font-bold">Subir Cursos</h1>
          <UserButton showName/>
        </header>
        <div className="mb-6 bg-background p-6 rounded-lg shadow-md">
          <CourseForm
            onSubmit={(title, description, file, category, instructor, rating) => handleSubmit(title, description, file, category, instructor, rating)}
            uploading={uploading}
            editingCourseId={editingCourseId}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            category={category}
            setCategory={setCategory}
            instructor={instructor}
            setInstructor={setInstructor}
            rating={rating}
            setRating={setRating}
          />
        </div>
        <h2 className="mb-4 text-2xl font-bold">Lista De Curos Creados</h2>
        <CourseListTeacher
          courses={courses}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}