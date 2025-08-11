"use client";
import { useEffect } from "react";

import { usePathname, useRouter } from "next/navigation";

import "intro.js/introjs.css";
import "~/styles/introjs-custom.css";

// Pasos estáticos y dinámicos separados
const steps = {
  intro: [
    { intro: "Bienvenido a Artiefy la plataforma educativa del futuro" },
    {
      intro:
        "Te daremos un tour completo para que puedas usar Artiefy sin limites",
    },
    {
      element: ".join-button",
      intro:
        "Este es el inicio de Artiefy el botón de comienza ya sera tu puerta al conocimiento",
    },
    {
      element: ".div-header-inicio",
      intro: "Este es el inicio, donde verás las novedades principales.",
    },
    {
      element: ".div-header-cursos",
      intro:
        "En cursos encontraras todo el contenido para desarrollar tus ideas y proyectos, desde cursos hasta programas completos.",
    },
    {
      element: ".div-header-proyectos",
      intro:
        "En proyectos Artie IA te ayudara a desarrollar tus ideas y proyectos, y podras compartirlo con la comunidad",
    },
    {
      element: ".div-header-espacios",
      intro:
        "Aquí encontrarás los espacios donde podrás desarrollar tus ideas.",
    },
    {
      element: ".div-header-planes",
      intro: "Aqui tendras nuestros planes de pago y sus beneficios.",
    },
    {
      element: ".perfil-header",
      intro:
        "En el perfil, encontraras las configuraciones de artiefy, tus cursos y certificados.",
    },
    {
      element: ".campana-header",
      intro:
        "Aquí encontrarás las notificaciones y mensajes para que nunca te pierdas nada importante",
    },
  ],
  estudiantesEstaticos: [
    {
      element: "main",
      intro:
        "Bienvenido a tu dashboard de estudiante. Aquí encontrarás todo lo que necesitas para tu aprendizaje.",
    },
    {
      element: ".header-search-container",
      intro:
        "En la barra de busqueda superior puedes acceder a un curso en especifico con nuestro chatBot Artie.",
    },
    {
      element: ".couses-section",
      intro:
        "Esta es tu área principal donde puedes explorar cursos, programas y contenido educativo.",
    },
    {
      element: 'footer, .footer, [class*="footer"]',
      intro:
        "En la parte inferior encontrarás información adicional y enlaces útiles.",
    },
  ],
  estudiantesDinamicos: [
    {
      element: "body",
      intro:
        "Has completado el tour inicial. Ahora puedes explorar libremente todo el contenido disponible. ¡Disfruta aprendiendo!",
    },
  ],
};

// Función para buscar elementos con múltiples selectores
function findElementWithFallbacks(selectors: string): HTMLElement | null {
  const selectorList = selectors.split(", ");
  for (const selector of selectorList) {
    const element = document.querySelector(
      selector.trim(),
    ) as HTMLElement | null;
    if (element) {
      console.log(`✅ Elemento encontrado con selector: ${selector.trim()}`);
      return element;
    }
  }
  console.log(`❌ No se encontró ningún elemento para: ${selectors}`);
  return null;
}

function waitForElements(
  selectors: string[],
  callback: () => void,
  maxAttempts = 100,
  interval = 300,
) {
  let attempts = 0;
  const check = () => {
    console.log(
      `🔍 Verificando elementos - Intento ${attempts + 1}/${maxAttempts}`,
    );

    // Verificar cada selector individualmente con más detalle
    const elementStatus = selectors.map((sel) => {
      // Buscar con múltiples selectores si están separados por comas
      const element = sel.includes(",")
        ? findElementWithFallbacks(sel)
        : (document.querySelector(sel) as HTMLElement | null);

      const rect = element?.getBoundingClientRect();
      const computedStyle = element ? window.getComputedStyle(element) : null;

      return {
        selector: sel,
        exists: !!element,
        visible: element?.offsetParent !== null,
        inViewport: rect ? rect.width > 0 && rect.height > 0 : false,
        display: computedStyle?.display,
        visibility: computedStyle?.visibility,
        opacity: computedStyle?.opacity,
        element: element,
      };
    });

    console.log("📊 Estado detallado de elementos:", elementStatus);

    // Mostrar elementos que existen pero no son visibles
    const existingButHidden = elementStatus.filter(
      (item) => item.exists && !item.visible,
    );
    if (existingButHidden.length > 0) {
      console.log("👁️ Elementos existentes pero ocultos:", existingButHidden);
    }

    // Mostrar elementos completamente ausentes
    const missingElements = elementStatus.filter((item) => !item.exists);
    if (missingElements.length > 0) {
      console.log(
        "❌ Elementos completamente ausentes:",
        missingElements.map((item) => item.selector),
      );
    }

    // Considerar elemento válido si existe (independientemente de la visibilidad para el tour de inicio)
    const validElements = elementStatus.filter((item) => item.exists);

    // Si encontramos al menos el 50% de los elementos o después de muchos intentos, continuar
    const minRequiredElements = Math.max(1, Math.floor(selectors.length * 0.5));

    if (
      validElements.length >= minRequiredElements ||
      attempts >= maxAttempts - 10
    ) {
      console.log(
        `✅ Suficientes elementos encontrados: ${validElements.length}/${selectors.length}`,
      );
      // Almacenar elementos disponibles para filtrar steps
      (window as Window & { availableElements?: string[] }).availableElements =
        validElements.map((item) => item.selector);
      setTimeout(callback, 300);
    } else if (attempts < maxAttempts) {
      attempts++;
      console.log(
        `⏳ Elementos encontrados: ${validElements.length}/${selectors.length} (mínimo requerido: ${minRequiredElements})`,
      );
      setTimeout(check, interval);
    } else {
      console.warn("⚠️ Timeout alcanzado. Iniciando con elementos disponibles");

      if (validElements.length > 0) {
        (
          window as Window & { availableElements?: string[] }
        ).availableElements = validElements.map((item) => item.selector);
        callback();
      } else {
        console.error("❌ No se encontraron elementos válidos para el tour");
        // Iniciar tour básico sin elementos específicos
        callback();
      }
    }
  };

  // Esperar a que el DOM esté completamente cargado
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", check);
  } else {
    setTimeout(check, 500); // Dar más tiempo inicial
  }
}

// Función para iniciar el tour dinámico fuera del componente
const startDynamicTour = () => {
  console.log("Intentando iniciar tour dinámico");
  waitForElements(
    steps.estudiantesDinamicos
      .map((s) => s.element)
      .filter((el): el is string => Boolean(el)),
    async () => {
      console.log("Elementos dinámicos encontrados, iniciando tour");
      const introJs = (await import("intro.js")).default;
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
    500,
  );
};

const TourManager = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Tour estático en /estudiantes
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      pathname === "/estudiantes" &&
      localStorage.getItem("startEstudiantesTour") === "1"
    ) {
      localStorage.removeItem("startEstudiantesTour");

      console.log("🎯 Iniciando tour estático en /estudiantes");

      // Esperar más tiempo y verificar que la página esté completamente cargada
      setTimeout(() => {
        console.log("📍 Buscando elementos estáticos...");

        const requiredSelectors = steps.estudiantesEstaticos
          .map((s) => s.element)
          .filter((el): el is string => Boolean(el));

        console.log("🔍 Selectores requeridos:", requiredSelectors);

        waitForElements(
          requiredSelectors,
          async () => {
            console.log("✨ Iniciando tour estático");

            // Filtrar steps con elementos disponibles o usar elementos disponibles del window
            const availableElements =
              (window as Window & { availableElements?: string[] })
                .availableElements ?? [];

            const availableSteps = steps.estudiantesEstaticos.filter((step) => {
              if (!step.element) return true;

              // Si tenemos lista de elementos disponibles, verificar
              if (availableElements.length > 0) {
                return availableElements.some((selector) => {
                  // Para selectores múltiples, verificar si alguno coincide
                  if (step.element!.includes(",")) {
                    return step
                      .element!.split(", ")
                      .some(
                        (sel) =>
                          selector.trim() === sel.trim() ||
                          document.querySelector(sel.trim()),
                      );
                  }
                  return selector === step.element;
                });
              }

              // De lo contrario, verificar manualmente
              const element = step.element!.includes(",")
                ? findElementWithFallbacks(step.element!)
                : (document.querySelector(step.element!) as HTMLElement | null);

              const isAvailable = !!element;

              if (!isAvailable) {
                console.log(`❌ Elemento no encontrado: ${step.element}`);
              }
              return isAvailable;
            });

            console.log(
              `📊 Steps disponibles: ${availableSteps.length}/${steps.estudiantesEstaticos.length}`,
            );

            // Si no hay steps disponibles, crear un tour básico
            if (availableSteps.length === 0) {
              console.log("🔄 Creando tour básico sin elementos específicos");
              const basicSteps = [
                {
                  intro:
                    "Bienvenido a tu dashboard de estudiante en Artiefy. Desde aquí podrás acceder a todos los cursos y recursos disponibles. 🎓",
                },
                {
                  intro:
                    "Explora las diferentes secciones para encontrar el contenido que más se ajuste a tus intereses de aprendizaje. 📚",
                },
              ];

              const introJs = (await import("intro.js")).default;
              void introJs()
                .setOptions({
                  steps: basicSteps,
                  showProgress: true,
                  showBullets: false,
                  exitOnOverlayClick: false,
                  exitOnEsc: true,
                })
                .oncomplete(() => {
                  console.log("✅ Tour básico completado");
                })
                .start();
              return;
            }

            const introJs = (await import("intro.js")).default;
            void introJs()
              .setOptions({
                steps: availableSteps,
                showProgress: true,
                showBullets: false,
                exitOnOverlayClick: false,
                exitOnEsc: true,
                highlightClass: "intro-highlight",
                tooltipClass: "intro-tooltip",
                scrollToElement: true,
                scrollPadding: 30,
              })
              .oncomplete(() => {
                console.log("✅ Tour estático completado");
                setTimeout(() => {
                  startDynamicTour();
                }, 1000);
              })
              .onbeforechange((targetElement: HTMLElement | null) => {
                console.log("🎯 Cambiando a elemento:", targetElement);
                if (targetElement && "scrollIntoView" in targetElement) {
                  targetElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
                return true;
              })
              .start();
          },
          50, // Menos intentos para ser más rápido
          500,
        );
      }, 3000); // Menos tiempo de espera inicial
    }
  }, [pathname]);

  // Tour dinámico en /estudiantes (para casos directos)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      pathname === "/estudiantes" &&
      localStorage.getItem("startEstudiantesTourDinamico") === "1"
    ) {
      localStorage.removeItem("startEstudiantesTourDinamico");
      setTimeout(() => {
        startDynamicTour();
      }, 1500);
    }
  }, [pathname]);

  useEffect(() => {
    const handleStartTour = () => {
      if (pathname !== "/") {
        void router.push("/");
        setTimeout(() => {
          waitForElements(
            steps.intro
              .map((s) => s.element)
              .filter((el): el is string => Boolean(el)),
            async () => {
              console.log("🚀 Iniciando tour de introducción");

              // Filtrar steps disponibles para el tour de inicio
              const availableElements =
                (window as Window & { availableElements?: string[] })
                  .availableElements ?? [];

              const availableSteps = steps.intro.filter((step) => {
                if (!step.element) return true;

                if (availableElements.length > 0) {
                  return availableElements.includes(step.element);
                }

                const element = document.querySelector(
                  step.element,
                ) as HTMLElement | null;
                return !!element;
              });

              console.log(
                `📊 Steps de intro disponibles: ${availableSteps.length}/${steps.intro.length}`,
              );

              const introJs = (await import("intro.js")).default;
              const intro = introJs();
              void intro
                .setOptions({
                  steps: availableSteps,
                  showProgress: true,
                  showBullets: false,
                  exitOnOverlayClick: false,
                  exitOnEsc: true,
                })
                .oncomplete(() => {
                  localStorage.setItem("startEstudiantesTour", "1");
                  void router.push("/estudiantes");
                })
                .start();
            },
            120, // Más intentos para la página de inicio
            400,
          );
        }, 2000); // Más tiempo después de la navegación
      } else {
        waitForElements(
          steps.intro
            .map((s) => s.element)
            .filter((el): el is string => Boolean(el)),
          async () => {
            console.log("🚀 Iniciando tour de introducción (ya en inicio)");

            const availableElements =
              (window as Window & { availableElements?: string[] })
                .availableElements ?? [];

            const availableSteps = steps.intro.filter((step) => {
              if (!step.element) return true;

              if (availableElements.length > 0) {
                return availableElements.includes(step.element);
              }

              const element = document.querySelector(
                step.element,
              ) as HTMLElement | null;
              return !!element;
            });

            const introJs = (await import("intro.js")).default;
            const intro = introJs();
            void intro
              .setOptions({
                steps: availableSteps,
                showProgress: true,
                showBullets: false,
                exitOnOverlayClick: false,
                exitOnEsc: true,
              })
              .oncomplete(() => {
                localStorage.setItem("startEstudiantesTour", "1");
                void router.push("/estudiantes");
              })
              .start();
          },
          120,
          400,
        );
      }
    };

    window.addEventListener("start-tour", handleStartTour);
    return () => window.removeEventListener("start-tour", handleStartTour);
  }, [router, pathname]);

  return null;
};

export default TourManager;
