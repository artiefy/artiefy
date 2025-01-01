import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourseById } from "~/models/courseModels";
import CourseDetails from "./CourseDetails";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  try {
    const course = await getCourseById(Number(id));
    if (!course) {
      return {
        title: "Curso no encontrado",
        description: "El curso solicitado no pudo ser encontrado.",
      };
    }

    const coverImageUrl = course.coverImageKey
      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/placeholder-course-image.jpg`; // Asegúrate de tener una imagen de placeholder

    return {
      title: `${course.title} | Artiefy`,
      description: course.description ?? "No hay descripción disponible.",
      openGraph: {
        title: `${course.title} | Artiefy`,
        description: course.description ?? "No hay descripción disponible.",
        images: [
          {
            url: coverImageUrl,
            width: 1200,
            height: 630,
            alt: `Portada del curso: ${course.title}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${course.title} | Artiefy`,
        description: course.description ?? "No hay descripción disponible.",
        images: [coverImageUrl],
      },
    };
  } catch (error) {
    console.error("Error fetching course metadata:", error);
    return {
      title: "Error",
      description: "Hubo un error al cargar la información del curso.",
    };
  }
}

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const course = await getCourseById(Number(id));
    if (!course) {
      notFound();
    }

    return (
      <>
        <CourseDetails
          course={{
            ...course,
            totalStudents: course.totalStudents ?? 0,
            lessons: course.lessons ?? [],
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              name: course.title,
              description:
                course.description ?? "No hay descripción disponible.",
              provider: {
                "@type": "Organization",
                name: "Artiefy",
                sameAs: process.env.NEXT_PUBLIC_BASE_URL,
              },
              instructor: {
                "@type": "Person",
                name: course.instructor,
              },
              dateCreated: new Date(course.createdAt).toISOString(),
              dateModified: new Date(course.updatedAt).toISOString(),
              aggregateRating: course.rating
                ? {
                    "@type": "AggregateRating",
                    ratingValue: course.rating,
                    ratingCount: course.totalStudents,
                  }
                : undefined,
              image: course.coverImageKey
                ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
                : `${process.env.NEXT_PUBLIC_BASE_URL}/placeholder-course-image.jpg`,
            }),
          }}
        />
      </>
    );
  } catch (error) {
    console.error("Error fetching course:", error);
    notFound();
  }
}
