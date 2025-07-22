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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {userCertificates.map((certificate) => (
              <Card
                key={certificate.id}
                className="overflow-hidden transition-all duration-300 hover:shadow-lg"
              >
                <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
                  <div className="flex items-center gap-2">
                    <PiCertificate className="h-5 w-5 text-white" />
                    <CardTitle className="line-clamp-2">
                      {certificate.course?.title || 'Curso'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-4 text-sm">
                    <div className="mb-1 flex justify-between">
                      <span className="font-medium">Nota obtenida:</span>
                      <span className="font-bold">
                        {certificate.grade.toFixed(1)}
                      </span>
                    </div>
                    <div className="mb-1 flex justify-between">
                      <span className="font-medium">Fecha emisión:</span>
                      <span>
                        {new Date(certificate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Link
                      href={`/estudiantes/certificados/${certificate.courseId}`}
                      className="flex justify-center"
                    >
                      <button className="button relative mx-auto text-base font-bold">
                        <span className="relative z-10">Ver Certificado</span>
                        <div className="hoverEffect">
                          <div />
                        </div>
                      </button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
