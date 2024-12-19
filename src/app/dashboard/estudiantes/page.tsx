import { auth } from '@clerk/nextjs/server'
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { db } from "~/server/db"
import { courses } from "~/server/db/schema"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { AspectRatio } from "~/components/ui/aspect-ratio"

async function getCourses() {
  return await db.select().from(courses)
}

export default async function StudentDashboardPage() {
  const { userId }: { userId: string | null } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  const allCourses = await getCourses()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Cursos Disponibles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allCourses.map((course) => (
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
              <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/dashboard/cursos/${course.id}`}>Ver Detalles</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}