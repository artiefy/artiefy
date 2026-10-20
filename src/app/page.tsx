'use client';

import { Suspense, useEffect, useState } from 'react';

import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';

import Footer from '~/components/estudiantes/layout/Footer';
import { HowItWorksSection } from '~/components/landing/HowItWorksSection';
import { LandingHero } from '~/components/landing/LandingHero';
import {
  savePendingLandingSeed,
  takePendingLandingSeed,
} from '~/components/landing/pendingLandingSeed';
import { generateProjectFromIdea } from '~/lib/projects/generateProjectFromIdea';
import { getPrivilegedDashboardRoute, getUserRole } from '~/utils/roles';

import type { ProjectAiSeed } from '~/components/projects/Modals/ProjectModeChooser';

// Non-critical components: loaded lazily (code-splitting) so they don't block
// the initial hero render. Decorative/floating pieces are client-only (ssr:false).
// The 3D background also needs `window` to probe WebGL support.
const NeuralNetworkBackground = dynamic(
  () => import('~/components/landing/neural-network/NeuralNetworkBackground'),
  { ssr: false }
);
const TicketSupportChatbot = dynamic(
  () => import('~/components/estudiantes/layout/TicketSupportChatbot'),
  { ssr: false }
);
const MiniLoginModal = dynamic(
  () => import('~/components/estudiantes/layout/MiniLoginModal'),
  { ssr: false }
);
const MiniSignUpModal = dynamic(
  () => import('~/components/estudiantes/layout/MiniSignUpModal'),
  { ssr: false }
);
const AnuncioCarrusel = dynamic(
  () => import('~/app/dashboard/super-admin/anuncios/AnuncioCarrusel')
);
const TourComponent = dynamic(() =>
  import('~/components/estudiantes/layout/TourComponent').then(
    (m) => m.TourComponent
  )
);

// Reads the OAuth query params in its own Suspense boundary: calling
// useSearchParams() at page level makes the whole statically prerendered page
// render on the client only, so crawlers got an empty shell without the hero.
function OAuthParamsHandler({
  onError,
  onShowSignUp,
}: {
  onError: (error: string) => void;
  onShowSignUp: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    const shouldShowSignup = searchParams.get('show_signup');

    if (error) {
      onError(decodeURIComponent(error));
      router.replace('/', { scroll: false });
    }

    if (shouldShowSignup === 'true') {
      onShowSignUp();
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router, onError, onShowSignUp]);

  return null;
}

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [showAnuncio, setShowAnuncio] = useState(false);
  const [, setShowChatbot] = useState<boolean>(false);
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

  // Estados para los modales de autenticación
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  // The landing composer's text lives here so a cancelled sign-in can put the
  // visitor's idea back in the box.
  const [idea, setIdea] = useState('');
  const userRole = getUserRole(user?.publicMetadata?.role);

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

  useEffect(() => {
    if (!isLoaded) return;
    if (!_isSignedIn) return;

    const privilegedDashboardRoute = getPrivilegedDashboardRoute(userRole);

    if (!privilegedDashboardRoute) return;

    router.replace(privilegedDashboardRoute);
  }, [_isSignedIn, isLoaded, router, userRole]);

  // An idea sent before signing in is built as soon as the session exists,
  // whether the visitor signed in here or came back from the OAuth redirect.
  useEffect(() => {
    if (!isLoaded || !_isSignedIn) return;
    const seed = takePendingLandingSeed();
    if (seed) void generateProjectFromIdea({ seed });
  }, [isLoaded, _isSignedIn]);

  const handleIdeaSubmit = (seed: ProjectAiSeed) => {
    if (isLoaded && !_isSignedIn) {
      savePendingLandingSeed(seed);
      setShowLoginModal(true);
      return;
    }
    void generateProjectFromIdea({ seed });
  };

  // The sign-in modals also call `onClose` after a successful sign-in; only a
  // visitor who is still signed out gets the idea back instead of a project.
  const restorePendingIdea = () => {
    if (_isSignedIn) return;
    const seed = takePendingLandingSeed();
    if (seed) setIdea(seed.idea);
  };

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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Suspense fallback={null}>
        <OAuthParamsHandler
          onError={(error) => {
            setOauthError(error);
            setShowLoginModal(true);
          }}
          onShowSignUp={() => {
            setShowLoginModal(false);
            setShowSignUpModal(true);
          }}
        />
      </Suspense>
      {anuncios.length > 0 && <AnuncioCarrusel anuncios={anuncios} />}

      <NeuralNetworkBackground />
      <main className="relative z-10 flex grow flex-col">
        <LandingHero
          idea={idea}
          onIdeaChange={setIdea}
          onSubmit={handleIdeaSubmit}
        />
        <HowItWorksSection />
      </main>
      {/* Above the fixed 3D background, like the rest of the page. */}
      <div className="relative z-10">
        <Footer />
      </div>
      <div
        className="
          fixed right-35 bottom-10 z-10 translate-x-1/2
          sm:right-32 sm:bottom-20 sm:translate-x-0
        "
      >
        {/* Triangulo tipo burbuja */}
        <span
          className="
            absolute bottom-[63px] left-1/2 inline size-0 translate-x-[75px]
            rotate-[360deg] transform border-t-[8px] border-r-[6px]
            border-l-[6px] border-t-blue-500 border-r-transparent
            border-l-transparent
            sm:bottom-[63px] sm:translate-x-[250px]
          "
        />
      </div>

      <TourComponent />

      <TicketSupportChatbot />

      {/* Modales de autenticación */}
      <MiniLoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setOauthError(null);
          restorePendingIdea();
        }}
        onLoginSuccess={() => {
          setShowLoginModal(false);
          setOauthError(null);
        }}
        redirectUrl="/"
        onSwitchToSignUp={() => {
          setShowLoginModal(false);
          setShowSignUpModal(true);
        }}
        initialError={oauthError || undefined}
      />
      <MiniSignUpModal
        isOpen={showSignUpModal}
        onClose={() => {
          setShowSignUpModal(false);
          restorePendingIdea();
        }}
        onSignUpSuccess={() => {
          setShowSignUpModal(false);
        }}
        redirectUrl="/"
        onSwitchToLogin={() => {
          setShowSignUpModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}
