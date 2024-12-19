"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import {
  createCourse,
  createUser,
  deleteCourse,
  getAllCourses,
  getUserById,
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
  const [file, setFile] = useState<File | null>(null);
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
      const existingUser = await getUserById(Number(id));
      if (!existingUser) {
        await createUser(Number(id), email, fullName);
      }
    } else {
      console.error("User ID, email, or full name is missing");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
          await createCourse(title, description, Number(creatorId), coverImageKey ?? "");
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
            <input
              id="file"
              type="file"
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  if (files[0]) {
                    setFile(files[0]);
                  }
                }
              }}
              accept="image/png, image/jpeg, video/mp4"
              className="mb-4 w-full rounded border border-gray-300 p-2"
            />
            {uploading && <Progress value={0} className="mb-4" />}
            <Button type="submit" disabled={uploading} className="w-full">
              {editingCourseId ? "Update Course" : "Create Course"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <h2 className="mb-4 text-2xl font-bold">Courses List</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <AspectRatio ratio={16 / 9}>
                <Image
                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </AspectRatio>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="mb-2 text-xl">{course.title}</CardTitle>
              <p className="line-clamp-2 text-sm text-gray-600">
                {course.description}
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleEdit(course)} className="mr-2">
                Edit
              </Button>
              <Button
                onClick={() => handleDelete(course.id)}
                variant="destructive"
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}