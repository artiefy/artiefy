'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import '~/styles/introjs-custom.css';

// Pasos estáticos y dinámicos separados
const steps = {
  intro: [
    { intro: '¡Bienvenido a la plataforma Artiefy!' },
    { intro: 'Te guiaremos paso a paso. ¡Vamos allá!' },
    {
      element: '.div-header-inicio',
      intro: 'Este es el inicio, donde verás las novedades principales.'
    },
    {
      element: '.div-header-cursos',
      intro: 'Aquí encontrarás todos los cursos disponibles.'
    },
    {
      element: '.div-header-proyectos',
      intro: 'En esta sección verás proyectos interesantes de la comunidad.'
    },
    {
      element: '.div-header-espacios',
      intro: 'Espacios para interactuar y debatir con otros estudiantes.'
    },
    {
      element: '.div-header-planes',
      intro: 'Consulta los diferentes planes de la plataforma.'
    },
    {
      element: '.test',
      intro: 'Desde aquí accedes a tu perfil y configuración. El simbolo de campaña podrás ver tus notificaciones y mensajes.'
    }
  ],
  estudiantesEstaticos: [
    {
      element: '.div-main',
      intro: 'Aquí puedes ver los últimos cursos añadidos a nuestra plataforma. ¡Mantente al día con las nuevas oportunidades de aprendizaje! 📌'
    },
    {
      element: '.div-courses',
      intro: 'Explora nuestra variedad de cursos disponibles. Filtra, busca y encuentra el contenido que más se ajuste a tus intereses y objetivos. 🔍'
    },
    {
      element: '.div-programs',
      intro: 'En esta sección encontrarás nuestras categorías de cursos organizadas por áreas temáticas. ¡Elige la que más te llame la atención! 📚'
    },
    {
      element: '.div-filters',
      intro: '¿Buscas algo específico? Utiliza los filtros para encontrar cursos por categoría, modalidad o nivel de dificultad. ¡Haz tu búsqueda más eficiente! 🛠️'
    }
  ],
  estudiantesDinamicos: [
    {
      element: '.div-all',
      intro: 'Aquí puedes encontrar todos los cursos disponibles en Artiefy, en Ver Curso puedes desplegar una información más detallada sobre el curso de interes ✍️'
    },
    {
      element: '.div-pagination',
      intro: 'Navega por las páginas de resultados para explorar más cursos. ¡No te pierdas ninguna oportunidad! 📖'
    }
  ]
};

function waitForElements(selectors: string[], callback: () => void, maxAttempts = 30, interval = 250) {
  let attempts = 0;
  const check = () => {
    const allExist = selectors.every(sel => document.querySelector(sel));
    if (allExist) {
      callback();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(check, interval);
    }
  };
  check();
}

const TourManager = () => {
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/estudiantes' && localStorage.getItem('startEstudiantesTourDinamico') === '1') {
      localStorage.removeItem('startEstudiantesTourDinamico');
      waitForElements(
        steps.estudiantesDinamicos.map(s => s.element).filter(Boolean) as string[],
        () => {
          introJs().setOptions({ steps: steps.estudiantesDinamicos }).start();
        }
      );
    }
  }, [pathname]);


  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/estudiantes' && localStorage.getItem('startEstudiantesTour') === '1') {
      localStorage.removeItem('startEstudiantesTour');
      waitForElements(
        steps.estudiantesEstaticos.map(s => s.element).filter(Boolean) as string[],
        () => {
          introJs().setOptions({ steps: steps.estudiantesEstaticos }).oncomplete(() => {
            // Marca que debe lanzarse el tour dinámico
            localStorage.setItem('startEstudiantesTourDinamico', '1');

          }).start();
        }
      );
    }
  }, [pathname]);

  useEffect(() => {
    const handleStartTour = () => {
      if (pathname !== '/') {
        router.push('/');
        waitForElements(
          steps.intro.map(s => s.element).filter(Boolean) as string[],
          () => {
            const intro = introJs();
            intro.setOptions({ steps: steps.intro }).oncomplete(() => {
              localStorage.setItem('startEstudiantesTour', '1');
              router.push('/estudiantes');
            });
            intro.start();
          }
        );

      } else {
        waitForElements(
          steps.intro.map(s => s.element).filter(Boolean) as string[],
          () => {
            const intro = introJs();
            intro.setOptions({ steps: steps.intro }).oncomplete(() => {
              localStorage.setItem('startEstudiantesTour', '1');
              router.push('/estudiantes');
            });
            intro.start();
          }
        );

      }
    };
    window.addEventListener('start-tour', handleStartTour);
    return () => window.removeEventListener('start-tour', handleStartTour);
  }, [router, pathname]);

  // Lanzar tour de pasos dinámicos si está pendiente y estamos en /estudiantes
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    function tryStartDynamicTour() {
      if (
        typeof window !== 'undefined' &&
        window.location.pathname === '/estudiantes' &&
        localStorage.getItem('startEstudiantesTourDinamico') === '1'
      ) {
        const allExist = steps.estudiantesDinamicos
          .map(s => s.element)
          .filter(Boolean)
          .every(sel => document.querySelector(sel));
        if (allExist) {
          localStorage.removeItem('startEstudiantesTourDinamico');
          introJs().setOptions({ steps: steps.estudiantesDinamicos }).start();
          if (intervalId) clearInterval(intervalId);
        }
      }
    }
    if (pathname === '/estudiantes') {
      intervalId = setInterval(tryStartDynamicTour, 400);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pathname]);

  return null;
};

export default TourManager;