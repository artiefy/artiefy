//src\components\layout\CourseListStudent.tsx

import Image from "next/image";
import Link from "next/link";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button"; // Importar el componente Button
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { type Course } from "~/models/courseModels"; 
import { StarIcon, ArrowRightIcon } from "@heroicons/react/24/solid"; // Importar el icono de estrella y flecha

interface CourseListProps {
  courses: Course[];
}

export default function CourseListStudent({ courses }: CourseListProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden">
          <CardHeader className="p-0">
            <AspectRatio ratio={16 / 9}>
              <Image
                src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                alt={course.title}
                fill
                style={{ objectFit: "cover" }}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </AspectRatio>
          </CardHeader>
          <CardContent className="p-4">
            <CardTitle className="mb-2 text-xl text-background">{course.title}</CardTitle>
            <div className="flex items-center mb-2">
              <Badge variant="outline" className="border-primary bg-background text-primary hover:bg-black/70">
                {course.category}
              </Badge>
              <span className="ml-2 text-sm text-gray-600 font-bold">Categoría</span>
            </div>
            <p className="line-clamp-2 text-sm text-gray-600 mb-2">
              {course.description}
            </p>
            <p className="text-sm font-bold italic  text-gray-600">
              Instructor: <span className="font-bold italic underline">{course.instructor}</span>
            </p>
          </CardContent>
          <CardFooter className="px-4 flex justify-between items-center">
            <Link href={`/dashboard/estudiantes/cursos/${course.id}`} legacyBehavior>
              <a className="flex items-center">
                <Button className="flex items-center  bg-background text-primary hover:bg-black/70 p-2">
                  <p className="ml-2">Ver Curso</p>
                  <ArrowRightIcon className="h-5 w-5 mr-2 animate-bounce-right" />
                </Button>
              </a>
            </Link>
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <span className="ml-1 text-sm text-yellow-500 font-bold">{(course.rating ?? 0).toFixed(1)}</span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}