//src\app\dashboard\estudiantes\cursos\[id]\page.tsx

"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "~/components/layout/Header";
import { getCourseById } from "~/models/courseModels";

export default function CoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState<{ title: string; description: string | null } | null>(null);

  useEffect(() => {
    if (id) {
      const fetchCourse = async () => {
        const courseData = await getCourseById(Number(id));
        setCourse(courseData);
      };

      fetchCourse().catch((error) =>
        console.error("Error fetching course:", error),
      );
    }
  }, [id]);

  return (
    <div className="px-12">
      <main className="container mx-auto pl-12 pr-12 md:px-16">
        <Header />
        <div className="flex flex-col space-y-12">
          <h1 className="text-3xl text-primary">{course?.title}</h1>
          <p className="text-lg text-gray-600">{course?.description}</p>
          {/* Add more course details here */}
        </div>
      </main>
    </div>
  );
}
