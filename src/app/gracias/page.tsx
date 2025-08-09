'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';

import '~/styles/confetti.css';

export default function GraciasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);

  // Solo permitir acceso si viene de PayU (from=payu)
  useEffect(() => {
    if (searchParams.get('from') === 'payu') {
      setShowModal(true);
    } else {
      router.replace('/'); // Redirigir si no viene de PayU
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const type = searchParams.get('type');
  const courseId = searchParams.get('courseId');

  const handleContinue = () => {
    if (type === 'curso' && courseId) {
      router.replace(`/estudiantes/cursos/${courseId}`);
    } else {
      router.replace('/estudiantes');
    }
  };

  if (!showModal) return null;

  return (
    <>
      {/* Meta Pixel Code SOLO para conversiones */}
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '967037655459857');
          fbq('track', 'Purchase');
        `}
      </Script>
      <noscript>
        {/*  eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=967037655459857&ev=Purchase&noscript=1"
          alt=""
        />
      </noscript>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center">
        {/* Imagen de fondo usando Next/Image */}
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
        {/* Confetti wrapper igual que en CertificationStudent */}
        <div className="confetti z-[10]">
          {Array.from({ length: 13 }, (_, i) => (
            <div key={i} className="confetti-piece" />
          ))}
        </div>
        <div className="relative z-[20] flex w-full max-w-md flex-col items-center rounded-2xl bg-white/95 p-10 shadow-2xl backdrop-blur-md">
          {/* Logo centrado arriba */}
          <Image
            src="/artiefy-logo2.png"
            alt="Artiefy Logo"
            width={130}
            height={130}
            className="mb-6 drop-shadow-lg"
            style={{ objectFit: 'contain' }}
            priority
          />
          <h2 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-[#0A2540] drop-shadow-sm">
            ¡Muchas gracias por tu compra!
          </h2>
          <p className="mb-2 text-center text-xl font-semibold tracking-wide text-[#00A5C0]">
            Bienvenido a{' '}
            <span className="font-bold text-[#0A2540]">Artiefy</span>
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
            className="mt-2 rounded-lg bg-gradient-to-r from-[#00A5C0] to-[#0A2540] px-8 py-3 text-lg font-bold text-white shadow-md transition-all duration-200 hover:from-[#0A2540] hover:to-[#00A5C0] active:scale-95"
          >
            Continuar
          </button>
        </div>
      </div>
    </>
  );
}
