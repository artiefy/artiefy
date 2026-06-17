import { Suspense } from 'react';

import { type Metadata, type ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { CourseDetailsSkeleton } from '~/components/estudiantes/layout/coursedetail/CourseDetailsSkeleton';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { GuidedProjectDetails } from '~/components/estudiantes/proyectos/GuidedProjectDetails';
import { getGuidedProjectById } from '~/server/actions/estudiantes/guided-projects/getGuidedProjectById';

interface PageParams {
  id: string;
}

export async function generateMetadata(
  { params }: { params: { id: string } },
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const robotsNoIndex: Metadata['robots'] = { index: false, follow: false };

  try {
    const { id } = await Promise.resolve(params);
    const projectId = Number(id);

    if (isNaN(projectId)) {
      return {
        title: 'Proyecto no encontrado',
        description: 'ID de proyecto inválido',
        robots: robotsNoIndex,
      };
    }

    const { userId } = await auth();
    const project = await getGuidedProjectById(projectId, userId);

    if (!project) {
      return {
        title: 'Proyecto no encontrado',
        description: 'El proyecto solicitado no pudo ser encontrado.',
        robots: robotsNoIndex,
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';
    const metadataBase = new URL(baseUrl);

    let coverImageUrl =
      'https://placehold.co/1200x630/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT';

    if (project.coverImageKey) {
      coverImageUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`;
    }

    return {
      metadataBase,
      title: `${project.title} | Artiefy`,
      description: project.description ?? 'No hay descripción disponible.',
      robots: robotsNoIndex,
      openGraph: {
        type: 'website',
        locale: 'es_ES',
        url: new URL(
          `/estudiantes/proyectos-guiados/${projectId}`,
          baseUrl
        ).toString(),
        siteName: 'Artiefy',
        title: `${project.title} | Artiefy`,
        description: project.description ?? 'No hay descripción disponible.',
        images: [
          {
            url: coverImageUrl,
            width: 1200,
            height: 630,
            alt: `Portada del proyecto: ${project.title}`,
            type: project.coverImageKey?.endsWith('.png')
              ? 'image/png'
              : 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${project.title} | Artiefy`,
        description: project.description ?? 'No hay descripción disponible.',
        images: [coverImageUrl],
        creator: '@artiefy',
        site: '@artiefy',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'Error al cargar el proyecto',
      robots: robotsNoIndex,
    };
  }
}

export default async function Page({ params }: { params: PageParams }) {
  const { id } = await Promise.resolve(params);

  return (
    <div className="pt-0">
      <Header />
      <Suspense fallback={<CourseDetailsSkeleton />}>
        <ProjectContent id={id} />
      </Suspense>
      <Footer />
    </div>
  );
}

async function ProjectContent({ id }: { id: string }) {
  try {
    const projectId = Number(id);
    if (isNaN(projectId)) {
      notFound();
    }

    const { userId } = await auth();
    const project = await getGuidedProjectById(projectId, userId);

    if (!project) {
      notFound();
    }

    return (
      <section>
        <GuidedProjectDetails
          project={project}
          initialIsEnrolled={project.enrolled ?? false}
        />
      </section>
    );
  } catch (error) {
    console.error('Error in ProjectContent:', error);
    throw error;
  }
}
