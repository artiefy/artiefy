'use client';

import { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';

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
      router.replace('/estudiantes/mycourses');
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
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
        <div className="relative flex w-full max-w-md flex-col items-center rounded-lg bg-white p-8 shadow-xl">
          <h2 className="text-background mb-4 text-center text-2xl font-bold">
            ¡Muchas gracias por tu compra!
          </h2>
          <p className="text-background mb-6 text-center">
            Estamos muy contentos de tenerte aquí con nosotros.
            <br />
            Tu pago fue procesado correctamente.
          </p>
          <button
            onClick={handleContinue}
            className="bg-secondary hover:bg-[#00A5C0] text-background mt-2 rounded px-6 py-2 font-semibold active:scale-95"
          >
            Continuar
          </button>
        </div>
      </div>
    </>
  );
}
