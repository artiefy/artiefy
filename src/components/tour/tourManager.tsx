'use client';
import { useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import 'intro.js/introjs.css';
import '~/styles/introjs-custom.css';

// Pasos estáticos y dinámicos separados
const steps = {
  intro: [
    { intro: '¡Bienvenido a la plataforma Artiefy!' },
    { intro: 'Te guiaremos paso a paso. ¡Vamos allá!' },
    {
      element: '.div-header-inicio',
      intro: 'Este es el inicio, donde verás las novedades principales.',
    },
    {
      element: '.div-header-cursos',
      intro: 'Aquí encontrarás todos los cursos disponibles.',
    },
    {
      element: '.div-header-proyectos',
      intro: 'En esta sección verás proyectos interesantes de la comunidad.',
    },
    {
      element: '.div-header-espacios',
      intro: 'Espacios para interactuar y debatir con otros estudiantes.',
    },
    {
      element: '.div-header-planes',
      intro: 'Consulta los diferentes planes de la plataforma.',
    },
    {
      element: '.test',
      intro:
        'Desde aquí accedes a tu perfil y configuración. El simbolo de campaña podrás ver tus notificaciones y mensajes.',
    },
  ],
  estudiantesEstaticos: [
    {
      element: '.div-main',
      intro:
        'Aquí puedes ver los últimos cursos añadidos a nuestra plataforma. ¡Mantente al día con las nuevas oportunidades de aprendizaje! 📌',
    },
    {
      element: '.div-courses',
      intro:
        'Explora nuestra variedad de cursos disponibles. Filtra, busca y encuentra el contenido que más se ajuste a tus intereses y objetivos. 🔍',
    },
    {
      element: '.div-programs',
      intro:
        'En esta sección encontrarás nuestras categorías de cursos organizadas por áreas temáticas. ¡Elige la que más te llame la atención! 📚',
    },
    {
      element: '.div-filters',
      intro:
        '¿Buscas algo específico? Utiliza los filtros para encontrar cursos por categoría, modalidad o nivel de dificultad. ¡Haz tu búsqueda más eficiente! 🛠️',
    },
  ],
  estudiantesDinamicos: [
    {
      element: '.div-all',
      intro:
        'Aquí puedes encontrar todos los cursos disponibles en Artiefy, en Ver Curso puedes desplegar una información más detallada sobre el curso de interes ✍️',
    },
    {
      element: '.div-pagination',
      intro:
        'Navega por las páginas de resultados para explorar más cursos. ¡No te pierdas ninguna oportunidad! 📖',
    },
  ],
};

function waitForElements(
  selectors: string[],
  callback: () => void,
  maxAttempts = 100,
  interval = 300
) {
  let attempts = 0;
  const check = () => {
    console.log(
      `Verificando elementos - Intento ${attempts + 1}/${maxAttempts}`
    );

    // Verificar cada selector individualmente
    const elementStatus = selectors.map((sel) => {
      const element = document.querySelector(sel) as HTMLElement | null;
      const rect = element?.getBoundingClientRect();
      return {
        selector: sel,
        exists: !!element,
        visible: element?.offsetParent !== null,
        inViewport: rect ? rect.width > 0 && rect.height > 0 : false,
        element: element,
      };
    });

    console.log('Estado detallado de elementos:', elementStatus);

    // Considerar elemento válido si existe y es visible
    const validElements = elementStatus.filter(
      (item) => item.exists && item.visible
    );
    const missingElements = elementStatus.filter(
      (item) => !item.exists || !item.visible
    );

    if (validElements.length === selectors.length) {
      console.log('✅ Todos los elementos encontrados y válidos');
      setTimeout(callback, 300);
    } else if (attempts < maxAttempts) {
      attempts++;
      console.log(
        `❌ Elementos faltantes (${missingElements.length}):`,
        missingElements.map((item) => item.selector)
      );
      setTimeout(check, interval);
    } else {
      console.warn('⚠️ Timeout alcanzado. Iniciando con elementos disponibles');
      console.log('Elementos válidos encontrados:', validElements.length);

      if (validElements.length > 0) {
        // Crear steps solo con elementos disponibles
        (window as any).availableElements = validElements.map(
          (item) => item.selector
        );
        callback();
      } else {
        console.error('❌ No se encontraron elementos válidos para el tour');
      }
    }
  };

  // Esperar a que el DOM esté completamente cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', check);
  } else {
    check();
  }
}

// Función para iniciar el tour dinámico fuera del componente
const startDynamicTour = async () => {
  console.log('Intentando iniciar tour dinámico');
  waitForElements(
    steps.estudiantesDinamicos
      .map((s) => s.element)
      .filter((el): el is string => Boolean(el)),
    async () => {
      console.log('Elementos dinámicos encontrados, iniciando tour');
      const introJs = (await import('intro.js')).default;
      void introJs()
        .setOptions({
          steps: steps.estudiantesDinamicos,
          showProgress: true,
          showBullets: false,
          exitOnOverlayClick: false,
          exitOnEsc: true,
        })
        .start();
    },
    60,
    500
  );
};

const TourManager = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Tour estático en /estudiantes
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      pathname === '/estudiantes' &&
      localStorage.getItem('startEstudiantesTour') === '1'
    ) {
      localStorage.removeItem('startEstudiantesTour');

      console.log('🎯 Iniciando tour estático en /estudiantes');

      // Esperar más tiempo y verificar que la página esté completamente cargada
      setTimeout(() => {
        console.log('📍 Buscando elementos estáticos...');

        const requiredSelectors = steps.estudiantesEstaticos
          .map((s) => s.element)
          .filter((el): el is string => Boolean(el));

        console.log('🔍 Selectores requeridos:', requiredSelectors);

        waitForElements(
          requiredSelectors,
          async () => {
            console.log('✨ Iniciando tour estático');

            // Filtrar steps con elementos disponibles
            const availableSteps = steps.estudiantesEstaticos.filter((step) => {
              if (!step.element) return true;
              const element = document.querySelector(
                step.element
              ) as HTMLElement | null;
              const isAvailable = element && element.offsetParent !== null;
              if (!isAvailable) {
                console.log(`❌ Elemento no disponible: ${step.element}`);
              }
              return isAvailable;
            });

            console.log(
              `📊 Steps disponibles: ${availableSteps.length}/${steps.estudiantesEstaticos.length}`
            );

            if (availableSteps.length === 0) {
              console.error('❌ No hay steps disponibles para el tour');
              return;
            }

            const introJs = (await import('intro.js')).default;
            void introJs()
              .setOptions({
                steps: availableSteps,
                showProgress: true,
                showBullets: false,
                exitOnOverlayClick: false,
                exitOnEsc: true,
                highlightClass: 'intro-highlight',
                tooltipClass: 'intro-tooltip',
                scrollToElement: true,
                scrollPadding: 30,
              })
              .oncomplete(() => {
                console.log('✅ Tour estático completado');
                setTimeout(() => {
                  startDynamicTour();
                }, 1000);
              })
              .onbeforechange((targetElement: any) => {
                console.log('🎯 Cambiando a elemento:', targetElement);
                if (targetElement) {
                  targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });
                }
                return true;
              })
              .start();
          },
          100,
          400
        );
      }, 4000);
    }
  }, [pathname]);

  // Tour dinámico en /estudiantes (para casos directos)
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      pathname === '/estudiantes' &&
      localStorage.getItem('startEstudiantesTourDinamico') === '1'
    ) {
      localStorage.removeItem('startEstudiantesTourDinamico');
      setTimeout(() => {
        startDynamicTour();
      }, 1500);
    }
  }, [pathname]);

  useEffect(() => {
    const handleStartTour = () => {
      if (pathname !== '/') {
        void router.push('/');
        setTimeout(() => {
          waitForElements(
            steps.intro
              .map((s) => s.element)
              .filter((el): el is string => Boolean(el)),
            async () => {
              const introJs = (await import('intro.js')).default;
              const intro = introJs();
              void intro
                .setOptions({
                  steps: steps.intro,
                  showProgress: true,
                  showBullets: false,
                  exitOnOverlayClick: false,
                  exitOnEsc: true,
                })
                .oncomplete(() => {
                  localStorage.setItem('startEstudiantesTour', '1');
                  void router.push('/estudiantes');
                })
                .start();
            }
          );
        }, 1000);
      } else {
        waitForElements(
          steps.intro
            .map((s) => s.element)
            .filter((el): el is string => Boolean(el)),
          async () => {
            const introJs = (await import('intro.js')).default;
            const intro = introJs();
            void intro
              .setOptions({
                steps: steps.intro,
                showProgress: true,
                showBullets: false,
                exitOnOverlayClick: false,
                exitOnEsc: true,
              })
              .oncomplete(() => {
                localStorage.setItem('startEstudiantesTour', '1');
                void router.push('/estudiantes');
              })
              .start();
          }
        );
      }
    };
    window.addEventListener('start-tour', handleStartTour);
    return () => window.removeEventListener('start-tour', handleStartTour);
  }, [router, pathname]);

  return null;
};

export default TourManager;
