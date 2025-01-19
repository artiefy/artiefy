import { ArrowRightIcon, StarIcon } from "@heroicons/react/24/solid"
import Image from "next/image"
import Link from "next/link"
import { AspectRatio } from "~/components/estudiantes/ui/aspect-ratio"
import { Badge } from "~/components/estudiantes/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/estudiantes/ui/card"
import { getImagePlaceholder } from "~/lib/plaiceholder"
import type { Course } from "~/types"
import PaginationContainer from "~/components/estudiantes/layout/PaginationContainer"

interface CourseListStudentProps {
  courses: Course[]
  currentPage: number
  totalPages: number
  totalCourses: number
  category?: string
  searchTerm?: string
}

export default async function CourseListStudent({
  courses,
  currentPage,
  totalPages,
  totalCourses,
  category,
  searchTerm,
}: CourseListStudentProps) {
  if (!courses || courses.length === 0) {
    return <div>No hay cursos disponibles</div>
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {
          await Promise.all(
            courses.map(async (course) => {
              const imageUrl = course.coverImageKey
                ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`.trimEnd()
                : "https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT"
              const blurDataURL = await getImagePlaceholder(imageUrl)

              return (
                <Card
                  key={course.id}
                  className="flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-in-out zoom-in hover:scale-105"
                >
                  <div>
                    <CardHeader>
                      <AspectRatio ratio={16 / 9}>
                        <div className="relative size-full">
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={course.title || "Imagen del curso"}
                            className="rounded-lg object-cover transition-opacity duration-500"
                            fill
                            placeholder="blur"
                            blurDataURL={blurDataURL ?? undefined}
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
                      <p className="mb-2 line-clamp-2 text-sm text-gray-600">{course.description}</p>
                    </CardContent>
                  </div>
                  <CardFooter className="-mt-6 flex flex-col items-start justify-between">
                    <div className="mb-2 flex w-full justify-between">
                      <p className="text-sm font-bold italic text-gray-600">
                        Educador: <span className="font-bold italic">{course.instructor}</span>
                      </p>
                      <p className="text-sm font-bold text-red-500">{course.modalidad?.name}</p>
                    </div>
                    <div className="flex w-full items-center justify-between">
                      <Link
                        href={`/estudiantes/cursos/${course.id}`}
                        className="group/button relative inline-flex items-center justify-center overflow-hidden rounded-md border border-white/20 bg-background p-2 text-primary hover:bg-black/70 active:scale-95"
                      >
                        <p className="ml-2">Ver Curso</p>
                        <ArrowRightIcon className="animate-bounce-right mr-2 size-5" />
                        <div className="absolute inset-0 flex size-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                          <div className="relative h-full w-10 bg-white/30"></div>
                        </div>
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
              )
            }),
          )
        }
      </div>
      <PaginationContainer
        totalPages={totalPages}
        currentPage={currentPage}
        totalCourses={totalCourses}
        route="/estudiantes"
        category={category}
        searchTerm={searchTerm}
      />
    </>
  )
}

