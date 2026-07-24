'use client';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';

import { useUser } from '@clerk/nextjs';

import { verifyPayuResponse } from '~/server/actions/estudiantes/confirmation/verifyPayuResponse';
import { getCourseTypeById } from '~/server/queries/courseTypes';

import '~/styles/confetti.css';

export default function AgradecimientoPlanPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState<string | null>(null);
  const planId = params.id;

  // Ref en lugar de dependencia directa: así el efecto de verificación no
  // se re-dispara cuando user.reload() cambia la referencia del objeto user.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

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

    // Solo mostrar la bienvenida si la firma de PayU es válida y el pago fue aprobado.
    void verifyPayuResponse({
      merchantId,
      referenceCode,
      txValue: searchParams.get('TX_VALUE') ?? '',
      currency: searchParams.get('currency') ?? '',
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
        // Clerk no refresca publicMetadata en el cliente apenas el backend la
        // actualiza (el JWT de sesión cacheado puede tardar ~60s en renovarse
        // solo). Forzamos el reload para que el Header ya muestre el plan
        // correcto cuando el usuario continúe navegando.
        void userRef.current?.reload();
        // Consultar el pixel dinámico
        void getCourseTypeById(planId).then((plan) => {
          if (!cancelled) setMetaPixelId(plan?.metaPixelId ?? null);
        });
      })
      .catch(() => {
        if (!cancelled) router.replace('/');
      });

    return () => {
      cancelled = true;
    };
  }, [planId, searchParams, router]);

  const handleContinue = () => {
    router.replace('/estudiantes');
  };

  if (!showModal) return null;

  return (
    <>
      {/* Pixel de Facebook personalizado para el plan (dinámico) */}
      {metaPixelId && (
        <Script id={`meta-pixel-plan-${planId}`} strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'Purchase', {planId: '${planId}'});
          `}
        </Script>
      )}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${metaPixelId ?? '967037655459857'}&ev=Purchase&noscript=1&planId=${planId}`}
          alt=""
        />
      </noscript>
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
            Bienvenido al plan{' '}
            <span className="font-bold text-[#0A2540]">#{planId}</span>
            <br />
            <span className="text-lg font-medium text-[#1B3A4B]">
              La educación del futuro
            </span>
          </p>
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
