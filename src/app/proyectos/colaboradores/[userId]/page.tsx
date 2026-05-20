import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { getCollaboratorPublicDetails } from '~/components/estudiantes/proyectos/projectSocialData';

interface ColaboradorDetallePageProps {
  params: Promise<{ userId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ColaboradorDetallePage({
  params,
}: ColaboradorDetallePageProps) {
  const { userId } = await params;
  const details = await getCollaboratorPublicDetails(userId);

  if (!details) notFound();

  return (
    <>
      <Header />
      <main
        className="
          min-h-screen bg-background px-4 pt-10 pb-20
          sm:px-6
        "
      >
        <div className="mx-auto max-w-5xl">
          <Link
            href="/proyectos"
            className={`
              inline-flex items-center gap-2 rounded-lg border border-border/50
              bg-card/60 px-3 py-2 text-sm text-muted-foreground
              transition-colors
              hover:text-foreground
            `}
          >
            <svg
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Volver a proyectos
          </Link>

          <section className="mt-6 rounded-2xl border border-border/50 bg-card/60 p-5">
            <div className="flex items-center gap-3">
              {details.collaborator.imageUrl ? (
                <Image
                  src={details.collaborator.imageUrl}
                  alt={details.collaborator.name}
                  width={56}
                  height={56}
                  className="size-14 rounded-full ring-2 ring-primary/30"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="
                    flex size-14 shrink-0 items-center justify-center
                    rounded-full bg-primary/15 text-lg font-semibold
                    text-primary ring-2 ring-primary/30
                  "
                >
                  {details.collaborator.name.trim().charAt(0).toUpperCase() ||
                    'U'}
                </span>
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {details.collaborator.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Proyectos públicos: {details.projects.length}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 space-y-4">
            {details.projects.length > 0 ? (
              details.projects.map((project) => (
                <article
                  key={project.id}
                  className={`
                    rounded-2xl border border-border bg-card/60 p-4
                    transition-colors
                    hover:border-primary/30
                  `}
                >
                  <div className="flex gap-4">
                    <div
                      className="
                        size-20 shrink-0 overflow-hidden rounded-xl
                        sm:size-24
                      "
                    >
                      {project.coverImageUrl ? (
                        <Image
                          src={project.coverImageUrl}
                          alt={project.title}
                          width={240}
                          height={240}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div
                          className="
                            flex size-full items-center justify-center
                            bg-[#1A2333] text-xs text-muted-foreground
                          "
                        >
                          Sin portada
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-foreground">
                            {project.title}
                          </h2>
                          <p
                            className="
                              line-clamp-2 text-sm text-muted-foreground
                            "
                          >
                            {project.description}
                          </p>
                        </div>
                        <span
                          className={`
                            rounded-md border border-primary/30 bg-primary/15
                            px-2 py-0.5 text-[10px] font-medium text-primary
                          `}
                        >
                          {project.stage}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="chip text-[10px]">
                          {project.category.name}
                        </span>
                        <Link
                          href={`/proyectos/${project.id}`}
                          className={`
                            inline-flex items-center gap-1 rounded-md
                            bg-[#1A2333] px-2.5 py-1 text-xs text-foreground
                            transition-colors
                            hover:bg-[#1A2333]/80
                          `}
                        >
                          Ver detalle
                          <svg
                            className="size-3"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M15 3h6v6" />
                            <path d="M10 14 21 3" />
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div
                className="
                  rounded-2xl border border-border/50 bg-card/60 p-8 text-center
                  text-sm text-muted-foreground
                "
              >
                Este colaborador todavía no tiene proyectos públicos.
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
