//src\components\layout\CourseListTeacher.tsx
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { CourseModel } from "~/app/dashboard/educadores/(inicio)/cursos/page";
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

interface CourseListTeacherProps {
  courses: CourseModel[];
  onEdit: (course: CourseModel) => void;
  onDelete: (id: string) => void;
}

export default function CourseListTeacher({ courses }: CourseListTeacherProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card key={course.id} className="animate-fade-up overflow-hidden">
          <CardHeader>
            <AspectRatio ratio={16 / 9}>
              <Image
                src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                alt={course.title}
                className="rounded-lg object-cover"
                priority
                fill
                sizes="(max-width: 820px), (max-width: 1200px)"
              />
            </AspectRatio>
          </CardHeader>
          <CardContent className="p-3">
            <CardTitle className="mb-2 rounded-lg bg-primary bg-opacity-50 text-lg text-background">
              <span className="ml-2 font-bold">{course.title}</span>
            </CardTitle>
            <div className="mb-2 flex items-center">
              <p className="text-sm font-bold text-gray-600">Categoría: </p>
              <Badge
                variant="outline"
                className="ml-1 border-primary bg-background text-primary hover:bg-black/70"
              >
                {course.categoryid.name}
              </Badge>
            </div>
            <p className="mb-2 line-clamp-2 text-sm text-gray-600">
              {course.description}
            </p>
            <p className="text-sm font-bold italic text-gray-600">
              Educador:{" "}
              <span className="font-bold italic">{course.instructor}</span>
            </p>
            <p className="text-sm font-bold italic text-gray-600">
              Modalidad:{" "}
              <span className="font-bold italic">
                {course.modalidadesid?.name}
              </span>
            </p>
          </CardContent>
          <CardFooter className="flex items-center justify-between px-3">
            <Button
              onClick={() =>
                router.push(`/dashboard/educadores/cursos/${course.id}`)
              }
              className="mx-auto rounded-lg border-orange-500 bg-orange-500 text-white hover:border-orange-500/90 hover:bg-orange-500/90"
            >
              Ver Curso
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
