import { type Metadata, type ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { type Course, type WithContext } from "schema-dts";
import { getCourseById } from "~/models/courseModelsEducator";
import CourseDetails from "./CourseDetails";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function getValidCoverImageUrl(
  coverImageKey: string | null,
): Promise<string> {
  const coverImageUrl = coverImageKey
    ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${coverImageKey}`
    : `https://via.placeholder.com/600x400`; // URL de Placeholder.com

  try {
    const response = await fetch(coverImageUrl);
    if (response.status === 403) {
      return `https://via.placeholder.com/600x400`; // URL de Placeholder.com
    }
    return coverImageUrl;
  } catch {
    return `https://via.placeholder.com/600x400`; // URL de Placeholder.com
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const id = (await params).id;

  try {
    const course = await getCourseById(Number(id));
    if (!course) {
      return {
        title: "Curso no encontrado",
        description: "El curso solicitado no pudo ser encontrado.",
      };
    }

    const coverImageUrl = await getValidCoverImageUrl(course.coverImageKey);
    const previousImages = (await parent).openGraph?.images ?? [];
    const motivationalMessage = "¡Subscríbete ya en este curso excelente!";
    return {
      title: `${course.title} | Artiefy`,
      description: `${course.description ?? "No hay descripción disponible."} ${motivationalMessage}`,
      openGraph: {
        title: `${course.title} | Artiefy`,
        description: `${course.description ?? "No hay descripción disponible."} ${motivationalMessage}`,
        images: [
          {
            url: coverImageUrl,
            width: 1200,
            height: 630,
            alt: `Portada del curso: ${course.title}`,
          },
          ...previousImages,
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${course.title} | Artiefy`,
        description: `${course.description ?? "No hay descripción disponible."} ${motivationalMessage}`,
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

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const course = await getCourseById(Number(id));
    if (!course) {
      notFound();
    }

    const jsonLd: WithContext<Course> = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: course.title,
      description: course.description ?? "No hay descripción disponible.",
      provider: {
        "@type": "Organization",
        name: "Artiefy",
        sameAs: process.env.NEXT_PUBLIC_BASE_URL,
        member: {
          "@type": "Person",
          name: course.instructor,
        },
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
        : `https://placehold.co/600x400/00BDD8/FFFFFF/png`, // URL de Placeholder.com
    };

    return (
      <section>
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
            __html: JSON.stringify(jsonLd),
          }}
        />
      </section>
    );
  } catch (error) {
    console.error("Error fetching course:", error);
    notFound();
  }
}
