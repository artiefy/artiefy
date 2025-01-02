//src\components\layout\CourseListTeacher.tsx
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
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
  description: string;
  coverImageKey: string;
  categoryid: {
    id: number;
    name: string;
    description: string;
  };
  instructor: string;
  rating?: number;
  creatorId: string;
}

interface CourseListTeacherProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

export default function CourseListTeacher({
  courses,
  onEdit,
  onDelete,
}: CourseListTeacherProps) {
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/courses?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar el curso");
      onDelete(id);
    } catch (error) {
      console.error("Error:", error);
    }
  };

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
                {course.categoryid.name}
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
            <Button
              onClick={() => onEdit(course)}
              className="mr-4 border-orange-500 bg-orange-500 text-white hover:border-orange-500/90 hover:bg-orange-500/90"
            >
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Eliminar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará
                    permanentemente el curso{" "}
                    <span className="font-bold">{course.title}</span> y todos
                    los datos asociados a este.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(course.id.toString())}
                    className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
