'use client';
import { use, useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';

import { useAuth } from '@clerk/nextjs';

import { verifyPayuResponse } from '~/server/actions/estudiantes/confirmation/verifyPayuResponse';

import '~/styles/confetti.css';

interface PixelResponse {
  metaPixelId: string | null;
  title?: string;
}

export default function AgradecimientoProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState<string | null>(null);
  const { id: projectId } = use(params);
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [buyerEmail, setBuyerEmail] = useState<string>('');
  // Valor realmente cobrado por PayU: sin esto el evento Purchase llega a Meta
  // con valor 0 y el ROAS de la campaña queda inutilizable.
  const [purchaseValue, setPurchaseValue] = useState<number>(0);
  const [purchaseCurrency, setPurchaseCurrency] = useState<string>('COP');

  useEffect(() => {
    if (!searchParams) return;

    const isFromPayu = searchParams.get('from') === 'payu';
    const signature = searchParams.get('signature');
    const merchantId = searchParams.get('merchantId');
    const referenceCode = searchParams.get('referenceCode');

    // Bloqueo rápido para URLs escritas a mano (sin params firmados de PayU).
    if (!isFromPayu || !signature || !merchantId || !referenceCode) {
      router.replace('/');
      return;
    }

    let cancelled = false;

    const txValue = searchParams.get('TX_VALUE') ?? '';
    const currency = searchParams.get('currency') ?? '';

    // Solo mostrar la bienvenida si la firma de PayU es válida y el pago fue aprobado.
    void verifyPayuResponse({
      merchantId,
      referenceCode,
      txValue,
      currency,
      transactionState: searchParams.get('transactionState') ?? '',
      signature,
    })
      .then((result) => {
        if (cancelled) return;
        if (!result.valid || !result.approved) {
          router.replace('/');
          return;
        }
        setShowModal(true);

        const parsedValue = Number.parseFloat(txValue);
        if (Number.isFinite(parsedValue) && parsedValue > 0) {
          setPurchaseValue(parsedValue);
        }
        if (currency) {
          setPurchaseCurrency(currency);
        }

        // Obtener email del pagador si viene en los parámetros
        const email = searchParams.get('email');
        if (email) {
          setBuyerEmail(email);
        }
        // Consultar el pixel dinámico desde la API
        fetch(`/api/guided-projects/${projectId}/pixel`)
          .then((res) => res.json())
          .then((data: PixelResponse) => {
            if (cancelled) return;
            setMetaPixelId(data.metaPixelId);
            setProjectTitle(data.title ?? '');
          })
          .catch(() => {
            if (!cancelled) setMetaPixelId(null);
          });
      })
      .catch(() => {
        if (!cancelled) router.replace('/');
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, searchParams, router]);

  // Disparar el evento cuando tengamos el pixel ID
  useEffect(() => {
    if (!metaPixelId) return;

    console.log('🔥 Inicializando Facebook Pixel:', metaPixelId);

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

    // Crear función fbq si no existe (stub oficial de Meta: encola los eventos
    // hasta que fbevents.js termina de cargar y procesa la cola).
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

    const initPixel = () => {
      if (!win.fbq) return;
      console.log('✅ fbq disponible, disparando eventos...');
      win.fbq('init', metaPixelId);
      win.fbq('track', 'PageView');
      win.fbq('track', 'Purchase', {
        content_ids: [projectId],
        content_type: 'product',
        value: purchaseValue,
        currency: purchaseCurrency,
      });
      console.log('✅ Eventos enviados a pixel:', metaPixelId);
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
        console.error('❌ fbq no se cargó después de', maxAttempts, 'intentos');
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [metaPixelId, projectId, purchaseValue, purchaseCurrency]);

  const handleContinue = () => {
    const projectUrl = `/estudiantes/proyectos-guiados/${projectId}`;

    if (!isSignedIn) {
      // Si no está logueado, redirigir a login con el email del comprador
      const loginUrl = new URL(
        `/sign-in`,
        typeof window !== 'undefined' ? window.location.origin : ''
      );
      if (buyerEmail) {
        loginUrl.searchParams.set('email', buyerEmail);
        loginUrl.searchParams.set('redirect_url', projectUrl);
      }
      router.replace(loginUrl.toString());
    } else {
      router.replace(projectUrl);
    }
  };

  if (!showModal) return null;

  return (
    <>
      {/* Pixel de Facebook personalizado para el proyecto guiado (dinámico) */}
      {metaPixelId && (
        <Script
          id="fb-pixel-base"
          strategy="afterInteractive"
          src="https://connect.facebook.net/en_US/fbevents.js"
        />
      )}
      {metaPixelId && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=Purchase&noscript=1&guidedProjectId=${projectId}`}
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
            Bienvenido al proyecto guiado{' '}
            <span className="font-bold text-[#0A2540]">#{projectId}</span>
          </p>
          {projectTitle && (
            <p className="mb-2 text-center text-lg font-bold text-[#1B3A4B]">
              {projectTitle}
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
