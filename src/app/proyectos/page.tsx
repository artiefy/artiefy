import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getProjectSocialCollections } from '~/components/estudiantes/proyectos/projectSocialData';
import { ProjectsSocialView } from '~/components/estudiantes/proyectos/ProjectsSocialView';

export const dynamic = 'force-dynamic';

interface ProyectosPageProps {
  searchParams?:
    | { [key: string]: string | string[] | undefined }
    | Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProyectosPage({
  searchParams,
}: ProyectosPageProps) {
  const params =
    searchParams instanceof Promise ? await searchParams : searchParams;
  const hasLegacyQuery = Boolean(params && Object.keys(params).length > 0);
  if (hasLegacyQuery) {
    const query = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length > 0) {
        query.set(key, value);
      }
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry.length > 0) query.append(key, entry);
        });
      }
    });
    const suffix = query.toString();
    redirect(`/estudiantes${suffix ? `?${suffix}` : ''}`);
  }

  const { userId } = await auth();
  const { exploreItems, myItems, collaborationItems, collaboratorItems } =
    await getProjectSocialCollections(userId);

  return (
    <>
      <Header />
      <ProjectsSocialView
        exploreItems={exploreItems}
        myItems={myItems}
        collaborationItems={collaborationItems}
        collaboratorItems={collaboratorItems}
      />
      <Footer />
    </>
  );
}
