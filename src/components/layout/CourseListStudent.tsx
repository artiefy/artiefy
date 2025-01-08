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
  id: number;
  title: string;
  coverImageKey: string | null;
  category: {
    name: string;
  };
  description: string;
  instructor: string;
  rating?: number;
  modalidad: {
    name: string;
  };
  createdAt: string;
}

interface CourseListStudentProps {
  courses: Course[];
}

export default function CourseListStudent({ courses }: CourseListStudentProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card
          key={course.id}
          className="flex flex-col justify-between overflow-hidden zoom-in"
        >
          <div>
            <CardHeader>
              <AspectRatio ratio={16 / 9}>
                <Image
                  src={
                    course.coverImageKey
                      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd()
                      : "https://placehold.co/800x450/00BDD8/FFFFFF/png"
                  }
                  alt={course.title || "Imagen del curso"}
                  className="rounded-lg object-cover opacity-0 transition-opacity duration-[2s]"
                  fill
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AD//Z"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onLoadingComplete={(image) => {
                    image.classList.remove("opacity-0");
                  }}
                />
              </AspectRatio>
            </CardHeader>
            <CardContent>
              <CardTitle className="mb-2 rounded-lg text-lg text-background">
                <div className="font-bold">{course.title}</div>
              </CardTitle>
              <div className="mb-2 flex items-center">
                <Badge
                  variant="outline"
                  className="border-primary bg-background text-primary hover:bg-black/70"
                >
                  {course.category.name}
                </Badge>
              </div>
              <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                {course.description}
              </p>
            </CardContent>
          </div>
          <CardFooter className="-mt-6 flex flex-col items-start justify-between">
            <div className="mb-2 flex w-full justify-between">
              <p className="text-sm font-bold italic text-gray-600">
                Educador:{" "}
                <span className="font-bold italic">{course.instructor}</span>
              </p>
              <p className="text-sm font-bold text-red-500">
                {course.modalidad.name}
              </p>
            </div>
            <div className="flex w-full items-center justify-between">
              <Link href={`/estudiantes/cursos/${course.id}`} legacyBehavior>
                <a className="flex items-center">
                  <Button className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-primary hover:bg-black/70 active:scale-95">
                    <p className="ml-2">Ver Curso</p>
                    <ArrowRightIcon className="animate-bounce-right mr-2 h-5 w-5" />
                    <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                      <div className="relative h-full w-10 bg-white/30"></div>
                    </div>
                  </Button>
                </a>
              </Link>
              <div className="flex items-center">
                <StarIcon className="h-5 w-5 text-yellow-500" />
                <span className="ml-1 text-sm font-bold text-yellow-500">
                  {(course.rating ?? 0).toFixed(1)}
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

