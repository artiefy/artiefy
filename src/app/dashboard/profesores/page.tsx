"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import CourseForm from "~/components/layout/CourseForm";
import CourseListTeacher from "~/components/layout/CourseListTeacher";
import { createCourse, createUser, deleteCourse, deleteUserById, getAllCourses, getUserById, updateCourse, type Course as CourseModel } from "~/models/courseModels";

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
  const [courses, setCourses] = useState<CourseModel[]>([]);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const savedCourses = localStorage.getItem("courses");
      if (savedCourses) {
        setCourses(JSON.parse(savedCourses) as CourseModel[]);
      } else {
        await fetchCourses();
      }
      if (user) {
        if (user.fullName) {
          await registerUser({
            id: user.id,
            emailAddresses: user.emailAddresses,
            fullName: user.fullName,
          });
        } else {
          console.error("User full name is missing");
        }
      }
    };
    fetchData().catch((error) => console.error("Error fetching data:", error));
  }, [user]);

  const fetchCourses = async () => {
    const allCourses = await getAllCourses();
    setCourses(allCourses);
    localStorage.setItem("courses", JSON.stringify(allCourses));
  };

  const registerUser = async (user: ClerkUser) => {
    const { id, emailAddresses, fullName } = user;
    const email = emailAddresses[0]?.emailAddress;
    if (id && email && fullName) {
      const existingUser = await getUserById(id);
      if (existingUser) {
        if (existingUser.role === "estudiante") {
          await deleteUserById(id);
          await createUser(id, email, fullName, "profesor");
        }
      } else {
        await createUser(id, email, fullName, "profesor");
      }
    } else {
      console.error("User ID, email, or full name is missing");
    }
  };

  const handleSubmit = async (
    title: string,
    description: string,
    file: File | null,
    category: string,
    instructor: string, // Nuevo parámetro
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
          await updateCourse(
            editingCourseId,
            title,
            description,
            coverImageKey ?? "",
            category,
            instructor
          );
          setEditingCourseId(null);
        } else {
          await createCourse(
            title,
            description,
            creatorId,
            coverImageKey ?? "",
            category,
            instructor, // Nuevo campo
          );
        }
        alert("Upload successful!");
        await fetchCourses();
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
    setEditingCourseId(course.id);
  };

  const handleDelete = async (courseId: number) => {
    await deleteCourse(courseId);
    fetchCourses().catch((error) =>
      console.error("Error fetching courses:", error),
    );
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
            onSubmit={(title, description, file, category, instructor) => handleSubmit(title, description, file, category, instructor)}
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