'use client';
import { use, useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';

import { useAuth } from '@clerk/nextjs';

import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';

import '~/styles/confetti.css';

export default function AgradecimientoCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState<string | null>(null);
  const { id: courseId } = use(params);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [buyerEmail, setBuyerEmail] = useState<string>('');

  useEffect(() => {
    if (courseId) {
      getCourseById(courseId)
        .then((course) => {
          setCourseTitle(course?.title ?? '');
        })
        .catch(() => setCourseTitle(''));
    }
  }, [courseId]);

  useEffect(() => {
    if (searchParams && searchParams.get('from') === 'payu') {
      setShowModal(true);
      // Obtener email del pagador si viene en los parámetros
      const email = searchParams.get('email');
      if (email) {
        setBuyerEmail(email);
      }
      // Consultar el pixel dinámico desde la API
      console.log('📡 Consultando pixel para curso:', courseId);
      fetch(`/api/courses/${courseId}/pixel`)
        .then((res) => res.json())
        .then((data: { metaPixelId: string | null }) => {
          console.log('✅ Pixel ID recibido:', data.metaPixelId);
          setMetaPixelId(data.metaPixelId);
        })
        .catch((err) => {
          console.error('❌ Error fetching pixel:', err);
          setMetaPixelId(null);
        });
    } else {
      router.replace('/'); // Redirigir si no viene de PayU
    }
  }, [courseId, searchParams, router]);

  // Disparar el evento cuando tengamos el pixel ID
  useEffect(() => {
    if (metaPixelId) {
      console.log('🔥 Inicializando Facebook Pixel:', metaPixelId);

      // Inicializar fbq manualmente
      interface FbqFunction {
        (...args: unknown[]): void;
        callMethod?: (...args: unknown[]) => void;
        queue?: unknown[];
        push?: FbqFunction;
        loaded?: boolean;
        version?: string;
      }

      interface WindowWithFbq extends Window {
        fbq?: FbqFunction;
        _fbq?: FbqFunction;
      }

      const win = window as WindowWithFbq;

      // Crear función fbq si no existe
      if (!win.fbq) {
        const n: FbqFunction = function (...args: unknown[]) {
          if (n.callMethod) {
            n.callMethod(...args);
          } else if (n.queue) {
            n.queue.push(args);
          }
        };
        win._fbq ??= n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        win.fbq = n;
      }

      // Esperar a que el script esté cargado antes de disparar
      const initPixel = () => {
        if (win.fbq) {
          console.log('✅ fbq disponible, disparando eventos...');
          win.fbq('init', metaPixelId);
          win.fbq('track', 'PageView');
          win.fbq('track', 'Purchase', {
            content_ids: [courseId],
            content_type: 'product',
            value: 0,
            currency: 'COP',
          });
          console.log('✅ Eventos enviados a pixel:', metaPixelId);
        }
      };

      // Intentar múltiples veces por si el script aún está cargando
      let attempts = 0;
      const maxAttempts = 10;
      const interval = setInterval(() => {
        attempts++;
        if (win.fbq && typeof win.fbq === 'function') {
          initPixel();
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          console.error(
            '❌ fbq no se cargó después de',
            maxAttempts,
            'intentos'
          );
          clearInterval(interval);
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [metaPixelId, courseId]);

  const handleContinue = () => {
    if (!isSignedIn) {
      // Si no está logueado, redirigir a login con el email del comprador
      const loginUrl = new URL(
        `/sign-in`,
        typeof window !== 'undefined' ? window.location.origin : ''
      );
      if (buyerEmail) {
        loginUrl.searchParams.set('email', buyerEmail);
        loginUrl.searchParams.set(
          'redirect_url',
          `/estudiantes/cursos/${courseId}`
        );
      }
      router.replace(loginUrl.toString());
    } else {
      // Si está logueado, ir directamente al curso
      router.replace(`/estudiantes/cursos/${courseId}`);
    }
  };

  if (!showModal) return null;

  return (
    <>
      {/* Pixel de Facebook personalizado para el curso (dinámico) */}
      {metaPixelId && (
        <>
          {/* Cargar el script base de Facebook Pixel primero */}
          <Script
            id="fb-pixel-base"
            strategy="afterInteractive"
            src="https://connect.facebook.net/en_US/fbevents.js"
          />
        </>
      )}
      {metaPixelId && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=Purchase&noscript=1&courseId=${courseId}`}
            alt=""
          />
        </noscript>
      )}
      <div className="fixed inset-0 z-[2000] flex items-center justify-center">
        <Image
          alt="Fondo de agradecimiento"
          src="/login-fondo.webp"
          fill
          quality={100}
          sizes="100vw"
          style={{
            objectFit: 'cover',
            zIndex: 0,
          }}
          priority
        />
        <div className="confetti z-[10]">
          {Array.from({ length: 13 }, (_, i) => (
            <div key={i} className="confetti-piece" />
          ))}
        </div>
        <div
          className="
            relative z-[20] flex w-full max-w-md flex-col items-center
            rounded-2xl bg-white/95 p-10 shadow-2xl backdrop-blur-md
          "
        >
          <Image
            src="/artiefy-logo2.png"
            alt="Artiefy Logo"
            width={130}
            height={130}
            className="mb-6 drop-shadow-lg"
            style={{ objectFit: 'contain' }}
            priority
          />
          <h2
            className="
              mb-4 text-center text-3xl font-extrabold tracking-tight
              text-[#0A2540] drop-shadow-sm
            "
          >
            ¡Muchas gracias por tu compra!
          </h2>
          <p
            className="
              mb-2 text-center text-xl font-semibold tracking-wide
              text-[#00A5C0]
            "
          >
            Bienvenido al curso{' '}
            <span className="font-bold text-[#0A2540]">#{courseId}</span>
          </p>
          {courseTitle && (
            <p className="mb-2 text-center text-lg font-bold text-[#1B3A4B]">
              {courseTitle}
            </p>
          )}
          <p className="mt-2 mb-8 text-center text-lg font-medium text-[#0A2540]">
            Tu pago fue procesado correctamente.
          </p>
          <button
            onClick={handleContinue}
            className="
              mt-2 rounded-lg bg-gradient-to-r from-[#00A5C0] to-[#0A2540] px-8
              py-3 text-lg font-bold text-white shadow-md transition-all
              duration-200
              hover:from-[#0A2540] hover:to-[#00A5C0]
              active:scale-95
            "
          >
            Continuar
          </button>
        </div>
      </div>
    </>
  );
}
