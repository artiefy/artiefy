import { useAuth } from '@clerk/nextjs';
import { ArrowRightIcon, StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
import { blurDataURL } from '~/lib/blurDataUrl';
import { type Course } from '~/types';

interface CourseListStudentProps {
  courses: Course[];
}

export default function CourseListStudent({ courses }: CourseListStudentProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleViewCourse = (courseId: number) => {
    const courseUrl = `/estudiantes/cursos/${courseId}`;
    if (isSignedIn) {
      router.push(courseUrl);
    } else {
      const signInUrl = new URL('/sign-in', window.location.origin);
      signInUrl.searchParams.set('redirect_url', courseUrl);
      router.push(signInUrl.toString());
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Card
          key={course.id}
          className="flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-in-out zoom-in hover:scale-105"
        >
          <div>
            <CardHeader>
              <AspectRatio ratio={16 / 9}>
                <div className="relative size-full">
                  <Image
                    src={
                      course.coverImageKey
                        ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd()
                        : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
                    }
                    alt={course.title || 'Imagen del curso'}
                    className="rounded-lg object-cover transition-opacity duration-500"
                    fill
                    placeholder="blur"
                    blurDataURL={blurDataURL}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
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
                  {course.category?.name}
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
                Educador:{' '}
                <span className="font-bold italic">{course.instructor}</span>
              </p>
              <p className="text-sm font-bold text-red-500">
                {course.modalidad?.name}
              </p>
            </div>
            <div className="flex w-full items-center justify-between">
              <Button
                className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-primary hover:bg-black/70 active:scale-95"
                onClick={() => handleViewCourse(course.id)}
              >
                <p className="ml-2">Ver Curso</p>
                <ArrowRightIcon className="animate-bounce-right mr-2 size-5" />
                <div className="absolute inset-0 flex size-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                  <div className="relative h-full w-10 bg-white/30"></div>
                </div>
              </Button>
              <div className="flex items-center">
                <StarIcon className="size-5 text-yellow-500" />
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
