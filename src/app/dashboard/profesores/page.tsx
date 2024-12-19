"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import CourseForm from "~/components/layout/CourseForm";
import CourseList from "~/components/layout/CourseList";
import {
  createCourse,
  createUser,
  deleteCourse,
  getAllCourses,
  getUserById,
  deleteUserById,
  updateCourse,
} from "~/models/courseModels";

interface Course {
  id: number;
  title: string;
  description: string | null;
  coverImageKey: string | null;
}

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const savedCourses = localStorage.getItem("courses");
      if (savedCourses) {
        setCourses(JSON.parse(savedCourses) as Course[]);
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

  const handleSubmit = async (title: string, description: string, file: File | null) => {
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
      const jsonResponse = await response.json() as { url: string; fields: Record<string, string> };
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
          );
          setEditingCourseId(null);
        } else {
          await createCourse(title, description, creatorId, coverImageKey ?? "");
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

  const handleEdit = (course: Course) => {
    setTitle(course.title);
    setDescription(course.description ?? "");
    setEditingCourseId(course.id);
  };

  const handleDelete = async (courseId: number) => {
    await deleteCourse(courseId);
    fetchCourses().catch((error) => console.error("Error fetching courses:", error));
  };

  return (
    <main className="container mx-auto py-10">
      <h1 className="mb-6 text-3xl font-bold">Manage Courses</h1>
      <UserButton />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {editingCourseId ? "Update Course" : "Create Course"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm
            onSubmit={handleSubmit}
            uploading={uploading}
            editingCourseId={editingCourseId}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
          />
        </CardContent>
      </Card>
      <h2 className="mb-4 text-2xl font-bold">Courses List</h2>
      <CourseList courses={courses} onEdit={handleEdit} onDelete={handleDelete} />
    </main>
  );
}