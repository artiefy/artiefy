'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { PDFDownloadLink } from '@react-pdf/renderer';

import { formatDate } from '~/lib/utils2';

import { CertificationStudentPDF } from './CertificationStudentPDF';

import type { Course } from '~/types';

import '~/styles/confetti.css';

interface StudentCertificationProps {
  course: Course;
  userId: string | null;
  studentName?: string | null; // <-- Nuevo prop opcional
}

export function CertificationStudent({
  course,
  userId,
  studentName,
}: StudentCertificationProps) {
  const { user } = useUser();

  if (!user || !userId) return null;

  const today = new Date();

  // Get current URL for certificate verification
  const certificateUrl =
    typeof window !== 'undefined' ? window.location.href : '';

  // Usa el nombre original si está disponible, si no, usa el del usuario logueado
  const displayName =
    studentName ??
    (user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user.firstName ?? user.lastName ?? user.username ?? ''));

  return (
    <div className="mx-auto max-w-5xl">
      {/* Confetti wrapper with correct positioning */}
      <div
        className="certificate-print-area relative"
        style={{ minHeight: 0, minWidth: 0 }}
      >
        {/* ...existing code... */}
        <div className="confetti">
          {Array.from({ length: 13 }, (_, i) => (
            <div key={i} className="confetti-piece" />
          ))}
        </div>
        {/* Certificate Content */}
        <div
          className="
            mb-8 text-center
            print:hidden
          "
        >
          <h1 className="mb-2 text-4xl font-bold text-primary">
            Constancia de Participación
          </h1>
          <p className="text-lg text-gray-400">
            Por su dedicación y compromiso en el aprendizaje
          </p>
        </div>
        <div
          className="
            certificate relative mb-8 overflow-hidden rounded-lg border-8
            border-amber-200 bg-white p-8 shadow-2xl
          "
          style={{ minHeight: 0, minWidth: 0 }}
        >
          {/* ...existing code... */}
          <div className="relative z-10">
            {/* Logo Artiefy en esquina superior izquierda */}
            <div className="absolute left-8 -mt-3">
              <Image
                src="/artiefy-logo2.png"
                alt="Artiefy Logo"
                width={120}
                height={60}
                className="object-contain"
              />
            </div>

            <div className="mt-4 text-center">
              <div className="mx-auto max-w-4xl space-y-8">
                <div className="space-y-4">
                  <p className="text-xl text-gray-600">
                    Por medio de la presente se hace constar que
                  </p>
                  <p className="text-3xl font-bold text-background">
                    {displayName}
                  </p>
                  <p className="text-xl text-gray-600">
                    ha participado y completado exitosamente el curso
                  </p>
                  <p className="text-3xl font-bold text-background">
                    {course?.title || 'Curso no encontrado'}
                  </p>
                  <p className="mt-4 text-lg text-gray-600">
                    desarrollando habilidades y conocimientos en el área,
                    demostrando compromiso y excelencia académica durante todo
                    el proceso de aprendizaje.
                  </p>
                </div>

                {/* Grid layout for completion details and signatures */}
                <div className="mt-12 grid grid-cols-3 gap-8">
                  {/* Left signature */}
                  <div className="text-center">
                    <Image
                      src="/firma-rector.png"
                      alt="Firma Rector"
                      width={180}
                      height={60}
                      className="mx-auto mb-4"
                    />
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-background">
                        Luis Antonio Ruíz Cicery
                      </p>
                      <p className="text-sm text-gray-600">
                        Rector Politécnico Nacional
                      </p>
                      <p className="text-sm text-gray-600">
                        de Artes y Oficios
                      </p>
                      <p className="text-sm text-gray-600">PONAO</p>
                    </div>
                  </div>

                  {/* Center completion details */}
                  <div className="space-y-2">
                    <p className="text-lg text-background">
                      realizado a través de Artiefy, la educación del futuro
                    </p>
                    <p className="text-lg text-background">
                      Finalizado el {formatDate(today)}
                    </p>
                    <p className="text-sm text-gray-600">
                      CC. {course.id.toString().padStart(6, '0')}
                    </p>
                    <div className="mt-4 pt-2">
                      <p className="text-sm text-gray-600">Verificado en:</p>
                      <Link
                        href={certificateUrl}
                        className="
                          inline-block max-w-full truncate text-sm text-blue-500
                          hover:underline
                        "
                      >
                        {certificateUrl}
                      </Link>
                    </div>
                  </div>

                  {/* Right signature */}
                  <div className="text-center">
                    <Image
                      src="/firma-director.png"
                      alt="Firma Director"
                      width={180}
                      height={60}
                      className="mx-auto mb-4"
                    />
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-background">
                        Juan José Ruíz Artunduaga
                      </p>
                      <p className="text-sm text-gray-600">
                        Director de Tecnologías
                      </p>
                      <p className="text-sm text-gray-600">del Ciadet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Background */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="
                absolute inset-0 bg-gradient-to-r from-primary via-amber-500
                to-primary
              "
            />
          </div>
        </div>
        {/* Download Button */}
        <div className="flex flex-col items-center gap-2 text-center print:hidden">
          <div className="relative mx-auto mb-4 size-12">
            <Image
              src="/file-download-svgrepo-com.svg"
              alt="Download Icon"
              fill
              className="text-primary"
            />
          </div>
          {/* Eliminar el botón de imprimir */}
          {/* 
          <Button
            className="bg-primary text-background hover:bg-primary/90 mb-2"
            onClick={handlePrint}
          >
            <FaDownload className="mr-2" />
            Imprimir Certificado
          </Button>
          */}
          <PDFDownloadLink
            document={
              <CertificationStudentPDF
                userName={displayName}
                course={course}
                date={formatDate(today)}
                certificateUrl={certificateUrl}
              />
            }
            fileName={`certificado-${course?.title || 'curso'}.pdf`}
            className="
              rounded bg-primary px-4 py-2 font-semibold text-background
              hover:bg-primary/90
            "
          >
            {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar PDF')}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
}
