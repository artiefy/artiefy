'use client';

import { useState } from 'react';
import { ArrowRightIcon, StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
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
    const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>(
        {}
    );

    const handleImageLoad = (courseId: number) => {
        setLoadedImages((prev) => ({ ...prev, [courseId]: true }));
    };

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
                <Card
                    key={course.id}
                    className={`flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-in-out zoom-in hover:scale-105`}
                >
                    <div>
                        <CardHeader>
                            <AspectRatio ratio={16 / 9}>
                                <Image
                                    src={
                                        course.coverImageKey
                                            ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd()
                                            : 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
                                    }
                                    alt={course.title || 'Imagen del curso'}
                                    className={`rounded-lg object-cover transition-opacity duration-500 ${
                                        loadedImages[course.id]
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                    }`}
                                    fill
                                    placeholder="blur"
                                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciPjxzdG9wIHN0b3AtY29sb3I9IiNlZWUiIG9mZnNldD0iMjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iI2Y1ZjVmNSIgb2Zmc2V0PSI1MCUiLz48c3RvcCBzdG9wLWNvbG9yPSIjZWVlIiBvZmZzZXQ9IjcwJSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZWVlIi8+PHJlY3QgaWQ9InIiIHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2cpIi8+PGFuaW1hdGUgeGxpbms6aHJlZj0iI3IiIGF0dHJpYnV0ZU5hbWU9IngiIGZyb209Ii02MDAiIHRvPSI2MDAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9zdmc+"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    onLoad={(_event) =>
                                        handleImageLoad(course.id)
                                    }
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
                                Educador:{' '}
                                <span className="font-bold italic">
                                    {course.instructor}
                                </span>
                            </p>
                            <p className="text-sm font-bold text-red-500">
                                {course.modalidad.name}
                            </p>
                        </div>
                        <div className="flex w-full items-center justify-between">
                            <Link
                                href={`/estudiantes/cursos/${course.id}`}
                                legacyBehavior
                            >
                                <a className="flex items-center">
                                    <Button className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-primary hover:bg-black/70 active:scale-95">
                                        <p className="ml-2">Ver Curso</p>
                                        <ArrowRightIcon className="animate-bounce-right mr-2 size-5" />
                                        <div className="absolute inset-0 flex size-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                                            <div className="relative h-full w-10 bg-white/30"></div>
                                        </div>
                                    </Button>
                                </a>
                            </Link>
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
