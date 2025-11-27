import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { PiCertificate } from 'react-icons/pi';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { Button } from '~/components/estudiantes/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/estudiantes/ui/card';
import { db } from '~/server/db';

import '~/styles/certificadobutton.css'; // Importa el nuevo CSS

export default async function CertificatesListPage() {
  // Obtener usuario actual
  const { userId } = await auth();

  // Redirigir si no hay usuario logueado
  if (!userId) {
    redirect('/sign-in');
  }

  // Obtener todos los certificados del usuario
  const userCertificates = await db.query.certificates.findMany({
    where: (cert) => eq(cert.userId, userId),
    with: {
      course: true,
      programa: true,
    },
    orderBy: (cert) => cert.createdAt,
  });

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Elimina el botón bonito de "Mis Certificados" aquí */}

        <div className="mb-8 flex items-center gap-3">
          <PiCertificate className="text-primary h-8 w-8" />
          <h1 className="text-primary text-3xl font-bold">Mis Certificados</h1>
        </div>

        {userCertificates.length === 0 ? (
          <div className="rounded-lg border border-gray-200 p-8 text-center">
            <div className="mb-4 flex justify-center">
              <PiCertificate className="h-40 w-40 text-gray-300" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">
              No tienes certificados aún
            </h3>
            <p className="mb-6 text-gray-500">
              Completa tus cursos con calificación mínima de 3.0 para obtener
              certificados
            </p>
            <Button asChild>
              <Link href="/estudiantes">Explorar Cursos</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Certificados de Cursos */}
            {userCertificates.filter((c) => c.courseId).length > 0 && (
              <div className="mb-6">
                <h2 className="text-primary mb-2 text-xl font-bold">
                  Certificados de Cursos
                </h2>
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {userCertificates
                    .filter((c) => c.courseId)
                    .map((certificate) => (
                      <Card
                        key={certificate.id}
                        className="poster-certificado mx-auto flex min-h-[420px] max-w-xs flex-col items-center overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-blue-900 via-[#01142B] to-cyan-900 p-0 shadow-xl"
                      >
                        <CardHeader className="flex w-full flex-col items-center rounded-t-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
                          <PiCertificate className="mb-2 h-12 w-12 text-white" />
                          <CardTitle className="line-clamp-3 text-center text-lg font-bold">
                            {certificate.course?.title ?? 'Certificado'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex w-full flex-1 flex-col items-center justify-between p-6">
                          <div className="mb-4 w-full text-base text-white">
                            <div className="mb-2 flex justify-between">
                              <span className="font-medium text-white">
                                Resultado obtenido:
                              </span>
                              <span className="font-bold text-white">
                                {certificate.grade.toFixed(1)}
                              </span>
                            </div>
                            <div className="mb-2 flex justify-between">
                              <span className="font-medium text-white">
                                Fecha emisión:
                              </span>
                              <span className="text-white">
                                {new Date(
                                  certificate.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 flex w-full justify-center">
                            <Link
                              href={`/estudiantes/certificados/${certificate.courseId}`}
                              className="flex w-full justify-center"
                            >
                              <button className="certificado-modal-button w-full">
                                <span className="relative z-10">
                                  Ver Certificado
                                </span>
                              </button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
            {/* Certificados de Programas */}
            {userCertificates.filter((c) => c.programaId).length > 0 && (
              <div className="mb-6">
                <h2 className="text-primary mb-2 text-xl font-bold">
                  Certificados de Programas
                </h2>
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {userCertificates
                    .filter((c) => c.programaId)
                    .map((certificate) => (
                      <Card
                        key={certificate.id}
                        className="poster-certificado mx-auto flex min-h-[420px] max-w-xs flex-col items-center overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-blue-900 via-[#01142B] to-cyan-900 p-0 shadow-xl"
                      >
                        <CardHeader className="flex w-full flex-col items-center rounded-t-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
                          <PiCertificate className="mb-2 h-12 w-12 text-white" />
                          <CardTitle className="line-clamp-3 text-center text-lg font-bold">
                            {certificate.programa?.title ?? 'Certificado'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex w-full flex-1 flex-col items-center justify-between p-6">
                          <div className="mb-4 w-full text-base text-white">
                            <div className="mb-2 flex justify-between">
                              <span className="font-medium text-white">
                                Resultado obtenido:
                              </span>
                              <span className="font-bold text-white">
                                {certificate.grade.toFixed(1)}
                              </span>
                            </div>
                            <div className="mb-2 flex justify-between">
                              <span className="font-medium text-white">
                                Fecha emisión:
                              </span>
                              <span className="text-white">
                                {new Date(
                                  certificate.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 flex w-full justify-center">
                            <Link
                              href={`/estudiantes/certificados/programa/${certificate.programaId}`}
                              className="flex w-full justify-center"
                            >
                              <button className="certificado-modal-button w-full">
                                <span className="relative z-10">
                                  Ver Certificado
                                </span>
                              </button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
