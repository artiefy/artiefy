import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import Image from "next/image";

interface Course {
  id: number;
  title: string;
  description: string | null;
  coverImageKey: string | null;
}

interface CourseListProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (courseId: number) => void;
}

export default function CourseList({ courses, onEdit, onDelete }: CourseListProps) {
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
            <p className="line-clamp-2 text-sm text-gray-600">
              {course.description}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => onEdit(course)} className="mr-2">
              Edit
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