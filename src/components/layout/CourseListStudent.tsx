"use client";

import { ArrowRightIcon, StarIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

interface Course {
  id: string;
  coverImageKey: string;
  title: string;
  category: string;
  description: string;
  instructor: string;
  rating?: number;
}

interface CourseListStudentProps {
  courses: Course[];
}


export default function CourseListStudent({ courses }: CourseListStudentProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden">
          <CardHeader>
            <AspectRatio ratio={16 / 9}>
              <Image
                src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                alt={course.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </AspectRatio>
          </CardHeader>
          <CardContent className="p-3">
            <CardTitle className="mb-2 rounded-lg bg-primary bg-opacity-50 text-lg text-background">
              <span className="ml-2 font-bold">{course.title}</span>
            </CardTitle>
            <div className="mb-2 flex items-center">
              <Badge
                variant="outline"
                className="border-primary bg-background text-primary hover:bg-black/70"
              >
                {course.category}
              </Badge>
              <span className="ml-2 text-sm font-bold text-gray-600">
                Categoría
              </span>
            </div>
            <p className="mb-2 line-clamp-2 text-sm text-gray-600">
              {course.description}
            </p>
            <p className="text-sm font-bold italic text-gray-600">
              Instructor:{" "}
              <span className="font-bold italic underline">
                {course.instructor}
              </span>
            </p>
          </CardContent>
          <CardFooter className="flex items-center justify-between px-3">
            <Link
              href={`/estudiantes/cursos/${course.id}`}
              legacyBehavior
            >
              <a className="flex items-center">
                <Button className="flex items-center bg-background p-2 text-primary hover:bg-black/70 active:scale-95">
                  <p className="ml-2">Ver Curso</p>
                  <ArrowRightIcon className="animate-bounce-right mr-2 h-5 w-5" />
                </Button>
              </a>
            </Link>
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <span className="ml-1 text-sm font-bold text-yellow-500">
                {(course.rating ?? 0).toFixed(1)}
              </span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
