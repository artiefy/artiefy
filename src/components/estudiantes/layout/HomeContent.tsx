'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { FaArrowRight } from 'react-icons/fa';

import AnuncioCarrusel from '~/app/dashboard/super-admin/anuncios/AnuncioCarrusel';
import SmoothGradient from '~/components/estudiantes/layout/Gradient';
import { Header } from '~/components/estudiantes/layout/Header';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';

export function HomeContent() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [showAnuncio, setShowAnuncio] = useState(false);
  void showAnuncio;
  const [anuncios, setAnuncios] = useState<{
    titulo: string;
    descripcion: string;
    coverImageKey: string;
  }[]>([]);

  const dashboardRoute =
    user?.publicMetadata?.role === 'super-admin'
      ? '/dashboard/super-admin'
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

  return (
    <div className="relative flex min-h-screen flex-col">
      {anuncios.length > 0 && <AnuncioCarrusel anuncios={anuncios} />}

      <SmoothGradient />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="mt-[-10vh] flex grow items-center justify-center">
          <section className="container mx-auto px-4 py-12 text-center">
            <h1 className="mb-5 text-5xl font-bold leading-snug text-white">
              Únete a nosotros y transforma tus ideas en
              <br /> realidades con el {''} 
              <span className="text-primary">poder del conocimiento</span>
            </h1>
            <p className="mb-5 text-xl leading-snug">
              Bienvenido a Artiefy, tu plataforma digital educativa dedicada a impulsar <br /> 
              tus conocimientos con ciencia y tecnología.
            </p>
            <div>
              <Button
                asChild
                className="relative skew-x-[-20deg] rounded-none border border-primary bg-primary py-8 text-2xl font-semibold text-background italic hover:border-primary hover:bg-transparent hover:text-primary active:scale-95"
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
                        className="animate-spin"
                        style={{ width: '35px', height: '35px' }}
                      />
                    ) : (
                      <>
                        <span className="inline-block skew-x-[15deg]">
                          COMIENZA YA
                        </span>
                        <FaArrowRight className="ml-2 inline-block skew-x-[15deg] animate-bounce-right transition-transform duration-500" />
                      </>
                    )}
                  </div>
                </Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
