'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { useAuth, useUser } from '@clerk/nextjs';
import { FaArrowRight } from 'react-icons/fa';

import AnuncioCarrusel from '~/app/dashboard/super-admin/anuncios/AnuncioCarrusel';
import SmoothGradient from '~/components/estudiantes/layout/Gradient';
import { Header } from '~/components/estudiantes/layout/Header';
import HeroCanvas from '~/components/estudiantes/layout/HeroCanvas';
import StudentChatbot from '~/components/estudiantes/layout/studentdashboard/StudentChatbot';
import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';
import { TourComponent } from '~/components/estudiantes/layout/TourComponent';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';

export default function HomePage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [showAnuncio, setShowAnuncio] = useState(false);
  const [chatbotKey] = useState<number>(0);
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  const [lastSearchQuery] = useState<string>('');
  void showAnuncio;
  const { isSignedIn: _isSignedIn } = useAuth();
  const [anuncios, setAnuncios] = useState<
    {
      titulo: string;
      descripcion: string;
      coverImageKey: string;
    }[]
  >([]);
  const [_mounted, setMounted] = useState(false);

  const handleSearchComplete = useCallback(() => {
    setShowChatbot(false);
  }, []);

  const dashboardRoute =
    user?.publicMetadata?.role === 'super-admin'
      ? '/dashboard/super-admin'
      : user?.publicMetadata?.role === 'admin'
        ? '/dashboard/admin'
        : user?.publicMetadata?.role === 'educador'
          ? '/dashboard/educadores'
          : '/estudiantes';

  useEffect(() => {
    const fetchAnuncioActivo = async (userId: string) => {
      try {
        const res = await fetch('/api/super-admin/anuncios/view-anuncio', {
          headers: { 'x-user-id': userId },
        });
        if (!res.ok) throw new Error('Error al obtener el anuncio activo');

        const data = (await res.json()) as {
          titulo: string;
          descripcion: string;
          coverImageKey: string;
          tipo_destinatario?: string;
        }[];
        if (Array.isArray(data) && data.length > 0) {
          setAnuncios(
            data.map((anuncio) => ({
              titulo: anuncio.titulo,
              descripcion: anuncio.descripcion,
              coverImageKey: anuncio.coverImageKey,
            }))
          );
          setShowAnuncio(true);
        }
      } catch (error) {
        console.error('Error al obtener el anuncio activo:', error);
      }
    };

    if (user?.id) {
      void fetchAnuncioActivo(user.id);
    }
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listener para cerrar completamente el chatbot desde dentro (evento global)
  useEffect(() => {
    const handleCloseChatbot = () => {
      setShowChatbot(false);
    };
    window.addEventListener('close-chatbot', handleCloseChatbot);
    return () => {
      window.removeEventListener('close-chatbot', handleCloseChatbot);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      {anuncios.length > 0 && <AnuncioCarrusel anuncios={anuncios} />}

      <SmoothGradient />
      <HeroCanvas />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="mt-[-10vh] flex grow items-center justify-center">
          <section className="container mx-auto px-4 pt-18 pb-12 text-center sm:pt-12">
            <h1 className="mb-5 text-5xl leading-snug font-bold text-white">
              Únete a nosotros y transforma tus ideas en
              <br /> realidades con el {''}
              <span className="text-primary">poder del conocimiento</span>
            </h1>
            <p className="mb-5 text-xl leading-snug">
              Bienvenido a Artiefy, tu plataforma digital educativa dedicada a
              impulsar <br />
              tus conocimientos con ciencia y tecnología.
            </p>
            <div>
              <Button
                asChild
                className="border-primary bg-primary text-background hover:border-primary hover:text-primary join-button relative skew-x-[-20deg] rounded-none border py-8 text-2xl font-semibold italic hover:bg-transparent active:scale-95"
                style={{
                  boxShadow: '6px 6px 0 black',
                  transition: '0.5s',
                  width: '250px',
                }}
                onClick={() => setLoading(true)}
              >
                <Link href={dashboardRoute}>
                  <div className="flex w-full items-center justify-center">
                    {loading ? (
                      <Icons.spinner
                        style={{ width: '35px', height: '35px' }}
                      />
                    ) : (
                      <>
                        <span className="inline-block skew-x-[15deg]">
                          COMIENZA YA
                        </span>
                        <FaArrowRight className="animate-bounce-right ml-2 inline-block skew-x-[15deg] transition-transform duration-500" />
                      </>
                    )}
                  </div>
                </Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
      <div className="fixed right-35 bottom-10 z-10 translate-x-1/2 sm:right-32 sm:bottom-20 sm:translate-x-0">
        {/* Triangulo tipo burbuja */}
        <span className="absolute bottom-[63px] left-1/2 inline h-0 w-0 translate-x-[75px] rotate-[360deg] transform border-t-[8px] border-r-[6px] border-l-[6px] border-t-blue-500 border-r-transparent border-l-transparent sm:bottom-[63px] sm:translate-x-[250px]" />
      </div>

      <TourComponent />

      <StudentChatbot
        isAlwaysVisible={true}
        showChat={showChatbot}
        key={chatbotKey}
        className="animation-delay-400 animate-zoom-in"
        initialSearchQuery={lastSearchQuery}
        onSearchComplete={handleSearchComplete}
      />
      <TicketSupportChatbot />
    </div>
  );
}
