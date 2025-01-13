//src\components\layout\CourseListTeacher.tsx
import Image from 'next/image';
import { AspectRatio } from '~/components/estudiantes/ui/aspect-ratio';
import { Badge } from '~/components/estudiantes/ui/badge';
import { Button } from '~/components/estudiantes/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '~/components/estudiantes/ui/card';

interface Course {
    id: string;
    coverImageKey: string;
    title: string;
    category: string;
    description: string;
    instructor: string;
    rating?: number;
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
                        <CardTitle className="mb-2 rounded-lg bg-primary/50 text-lg text-background">
                            <span className="ml-2 font-bold">
                                {course.title}
                            </span>
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
                            Instructor:{' '}
                            <span className="font-bold italic underline">
                                {course.instructor}
                            </span>
                        </p>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between px-3">
                        <Button
                            onClick={() => onEdit(course)}
                            className="mr-4 bg-orange-500 text-white hover:bg-orange-500/90"
                        >
                            Editar
                        </Button>
                        <Button
                            onClick={() => onDelete(course.id)}
                            variant="destructive"
                        >
                            Delete
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
