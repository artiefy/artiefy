import Image from "next/image";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { type Course } from "~/models/courseModels"; 
import { StarIcon } from "@heroicons/react/24/solid";

interface CourseListProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (courseId: number) => void;
}

export default function CourseListTeacher({ courses, onEdit, onDelete }: CourseListProps) {
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
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </AspectRatio>
          </CardHeader>
          <CardContent className="p-4">
            <CardTitle className="mb-2 text-xl">{course.title}</CardTitle>
            <Badge variant="outline" className="border-primary bg-background text-primary hover:bg-black/70">
              {course.category}
            </Badge>
            <p className="line-clamp-2 text-sm text-gray-600">
              {course.description}
            </p>
            <p className="text-sm text-gray-600">
              Instructor: {course.instructor}
            </p>
            <div className="flex items-center">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <span className="ml-1 text-sm text-gray-600">{course.rating}</span>
            </div>
          </CardContent>
          <CardFooter >
            <Button onClick={() => onEdit(course)} className="border-primary bg-orange-500 text-primary hover:bg-orange-500/70 mr-4">
              Editar
            </Button>
            <Button onClick={() => onDelete(course.id)} variant="destructive">
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}