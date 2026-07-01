'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

type TutorialStep = {
  id: string;
  title: string;
  description: string;
  targetId?: string;
  routePattern?: RegExp;
  showCourseSelector?: boolean;
  waitForAction?: boolean;
  autoContinue?: boolean;
  fallbackRoute?: string;
};

const tourSteps = (): TutorialStep[] => [
  {
    id: 'start',
    title: 'Bienvenido a Super Admin',
    description:
      'Esta guía te llevará paso a paso hasta la calificación de una actividad.',
    fallbackRoute: '/dashboard/super-admin/cursos',
  },
  {
    id: 'course-list',
    title: 'Selecciona un curso',
    description:
      'Busca un curso y haz clic en Ver Curso para abrir los detalles.',
    targetId: 'tutorial-course-list',
    routePattern: /^\/dashboard\/super-admin\/cursos(?:\/)?$/,
    fallbackRoute: '/dashboard/super-admin/cursos',
    showCourseSelector: true,
    waitForAction: true,
  },
  {
    id: 'course-detail',
    title: 'Abre la pestaña Estudiantes',
    description:
      'En el detalle del curso, haz clic en Estudiantes para ver las notas.',
    targetId: 'tutorial-estudiantes-tab',
    routePattern: /^\/dashboard\/super-admin\/cursos\/[^/]+(?:\/)?$/,
    waitForAction: true,
  },
  {
    id: 'grade-note',
    title: 'Califica una nota',
    description:
      'Haz clic en el primer campo de nota para editar una calificación.',
    targetId: 'tutorial-first-grade-input',
    routePattern: /^\/dashboard\/super-admin\/cursos\/[^/]+(?:\/)?$/,
    waitForAction: true,
  },
  {
    id: 'activity-page',
    title: 'Ingresa a la actividad',
    description:
      'Aquí verás la actividad seleccionada y la opción para calificar respuestas.',
    targetId: 'tutorial-actividad-detalle',
    routePattern:
      /^\/dashboard\/super-admin\/cursos\/[^/]+\/[^/]+\/actividades\/[^/]+$/,
    autoContinue: true,
  },
  {
    id: 'grade-action',
    title: 'Abre el modal de calificación',
    description:
      'Haz clic en Calificar para revisar la respuesta del estudiante.',
    targetId: 'tutorial-open-grade-modal',
    routePattern:
      /^\/dashboard\/super-admin\/cursos\/[^/]+\/[^/]+\/actividades\/[^/]+$/,
    waitForAction: true,
  },
  {
    id: 'enter-grade',
    title: 'Escribe la nota',
    description:
      'Introduce una calificación y, si quieres, deja un comentario de retroalimentación.',
    targetId: 'tutorial-grade-input',
    routePattern:
      /^\/dashboard\/super-admin\/cursos\/[^/]+\/[^/]+\/actividades\/[^/]+$/,
    waitForAction: true,
  },
  {
    id: 'save-grade',
    title: 'Guarda la calificación',
    description: 'Haz clic en Guardar para finalizar la evaluación.',
    targetId: 'tutorial-grade-save',
    routePattern:
      /^\/dashboard\/super-admin\/cursos\/[^/]+\/[^/]+\/actividades\/[^/]+$/,
    waitForAction: true,
  },
];

type CourseData = {
  id: number;
  title: string;
  description?: string | null;
  coverImageKey: string | null;
  categoryid: number;
  instructor: string;
};

export default function GuidedTutorialButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [stepState, setStepState] = useState<'idle' | 'waiting' | 'missing'>(
    'idle'
  );
  const [helperMessage, setHelperMessage] = useState('');

  const steps = useMemo(() => tourSteps(), []);
  const step = steps[currentStep];

  const STORAGE_KEY = 'artiefy-super-admin-grading-tour';

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) =>
        course.title.toLowerCase().includes(courseSearch.toLowerCase())
      ),
    [courses, courseSearch]
  );

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as {
        isOpen?: boolean;
        currentStep?: number;
      };
      if (parsed?.isOpen) {
        setIsOpen(true);
      }
      if (
        typeof parsed?.currentStep === 'number' &&
        parsed.currentStep >= 0 &&
        parsed.currentStep < steps.length
      ) {
        setCurrentStep(parsed.currentStep);
      }
    } catch {
      // ignore invalid storage value
    }
  }, [steps.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ isOpen, currentStep })
    );
  }, [isOpen, currentStep]);

  const loadCourses = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/courses');
      if (!response.ok) throw new Error('Error cargando cursos');
      const data = (await response.json()) as
        | { data: CourseData[] }
        | CourseData[];
      setCourses(Array.isArray(data) ? data : data.data);
    } catch (error) {
      console.error('Error cargando cursos para tutorial:', error);
      setCourses([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen && step?.showCourseSelector) {
      void loadCourses();
      setShowCourseSelector(true);
    }
  }, [isOpen, step?.showCourseSelector, loadCourses]);

  const routeMatchesStep = useMemo(() => {
    return step?.routePattern ? step.routePattern.test(pathname) : true;
  }, [pathname, step?.routePattern]);

  useEffect(() => {
    if (!isOpen || !step) return;

    const matchingIndex = steps.findIndex((s) =>
      s.routePattern ? s.routePattern.test(pathname) : false
    );
    if (matchingIndex >= 0 && matchingIndex !== currentStep) {
      setCurrentStep(matchingIndex);
      setStepState('idle');
      setHelperMessage(
        steps[matchingIndex].waitForAction
          ? 'Haz clic en el elemento resaltado para continuar.'
          : ''
      );
    }
  }, [currentStep, isOpen, pathname, step, steps]);

  const [currentTarget, setCurrentTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || !step?.targetId) {
      setCurrentTarget(null);
      return;
    }

    const target = document.querySelector<HTMLElement>(
      `[data-tour-id="${step.targetId}"]`
    );
    setCurrentTarget(target);
  }, [isOpen, step?.targetId, pathname]);

  const scrollTargetIntoView = useCallback((target: HTMLElement) => {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
  }, []);

  const waitForElement = useCallback(
    async (dataTourId: string, timeout = 2800) => {
      if (typeof window === 'undefined') return null;
      const deadline = Date.now() + timeout;

      return new Promise<HTMLElement | null>((resolve) => {
        const intervalId = window.setInterval(() => {
          const found = document.querySelector<HTMLElement>(
            `[data-tour-id="${dataTourId}"]`
          );
          if (found) {
            window.clearInterval(intervalId);
            resolve(found);
            return;
          }
          if (Date.now() > deadline) {
            window.clearInterval(intervalId);
            resolve(null);
          }
        }, 150);
      });
    },
    []
  );

  const waitForRoute = useCallback(
    async (pattern: RegExp | undefined, timeout = 3000) => {
      if (!pattern) return true;
      const deadline = Date.now() + timeout;
      // quick positive check
      if (pattern.test(pathname)) return true;
      return new Promise<boolean>((resolve) => {
        const interval = window.setInterval(() => {
          if (pattern.test(window.location.pathname)) {
            window.clearInterval(interval);
            resolve(true);
            return;
          }
          if (Date.now() > deadline) {
            window.clearInterval(interval);
            resolve(false);
          }
        }, 120);
      });
    },
    [pathname]
  );

  const goToStepSafely = useCallback(
    async (nextStepIndex: number) => {
      const nextStep = steps[nextStepIndex];
      if (!nextStep) return;

      setStepState('waiting');
      setHelperMessage(
        nextStep.routePattern && !nextStep.routePattern.test(pathname)
          ? 'Te estamos llevando al lugar correcto…'
          : 'Buscando el siguiente paso…'
      );

      if (nextStep.routePattern && !nextStep.routePattern.test(pathname)) {
        if (nextStep.fallbackRoute) {
          void router.push(nextStep.fallbackRoute);
        }
        // wait until the route actually matches (Next navigation may be async)
        await waitForRoute(nextStep.routePattern, 8000);
      }

      setCurrentStep(nextStepIndex);

      if (nextStep.targetId) {
        // After potential navigation, if the step targets the first grade input,
        // ensure the Estudiantes tab is opened in the current page before searching.
        if (nextStep.targetId === 'tutorial-first-grade-input') {
          // try multiple times in case the tab button renders slightly later
          let estudiantesTab: HTMLElement | null = null;
          for (let i = 0; i < 6; i++) {
            estudiantesTab = document.querySelector<HTMLElement>(
              `[data-tour-id="tutorial-estudiantes-tab"]`
            );
            if (estudiantesTab) break;
            // small delay and retry

            await new Promise((r) => setTimeout(r, 200));
          }

          if (estudiantesTab) {
            try {
              estudiantesTab.click();
            } catch {
              // ignore click errors
            }
            // give the UI a bit more time to render the students table
            await new Promise((r) => setTimeout(r, 400));
          }
        }

        const target = await waitForElement(nextStep.targetId, 6000);
        if (target) {
          scrollTargetIntoView(target);
          setStepState('idle');
          setHelperMessage('');
          return;
        }

        setStepState('missing');
        setHelperMessage(
          'No encontramos este elemento todavía. Revisa que estés en la página correcta o usa el botón Ir a cursos.'
        );
        return;
      }

      setCurrentStep(nextStepIndex);
      setStepState('idle');
      setHelperMessage('');
    },
    [
      pathname,
      router,
      scrollTargetIntoView,
      steps,
      waitForElement,
      waitForRoute,
    ]
  );

  const goToPreviousStep = useCallback(() => {
    setStepState('idle');
    setHelperMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToNextStep = useCallback(async () => {
    if (!step) return;

    if (step.showCourseSelector && !selectedCourseId) {
      setStepState('missing');
      setHelperMessage('Selecciona un curso antes de continuar.');
      return;
    }

    if (step.waitForAction && !step.showCourseSelector) {
      setStepState('missing');
      setHelperMessage('Haz clic en el elemento resaltado para continuar.');
      return;
    }

    await goToStepSafely(Math.min(currentStep + 1, steps.length - 1));
  }, [currentStep, goToStepSafely, selectedCourseId, step, steps.length]);

  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.targetId && routeMatchesStep && !currentTarget) {
      setStepState('waiting');
      setHelperMessage('Buscando el siguiente paso…');

      let cancelled = false;
      // If we are waiting for the first-grade input, try opening the Estudiantes tab first
      if (step.targetId === 'tutorial-first-grade-input') {
        const estudiantesTab = document.querySelector<HTMLElement>(
          `[data-tour-id="tutorial-estudiantes-tab"]`
        );
        if (estudiantesTab) {
          try {
            estudiantesTab.click();
          } catch {
            // ignore
          }
        }
      }

      void waitForElement(step.targetId, 6000).then((target) => {
        if (cancelled) return;
        if (target) {
          scrollTargetIntoView(target);
          setStepState('idle');
          setHelperMessage(
            step.waitForAction ? 'Haz clic aquí para continuar.' : ''
          );
          return;
        }

        setStepState('missing');
        setHelperMessage(
          'No encontramos este elemento todavía. Revisa que estés en la página correcta o usa el botón Ir a cursos.'
        );
      });

      return () => {
        cancelled = true;
      };
    }

    if (step.waitForAction && currentTarget) {
      setStepState('idle');
      setHelperMessage('Haz clic aquí para continuar.');
    }
  }, [
    currentStep,
    currentTarget,
    routeMatchesStep,
    isOpen,
    scrollTargetIntoView,
    step,
    waitForElement,
  ]);

  useEffect(() => {
    if (!currentTarget) {
      setHighlightRect(null);
      return;
    }

    scrollTargetIntoView(currentTarget);
    setHighlightRect(currentTarget.getBoundingClientRect());
    // Keep the highlight rect updated while the target may move (scroll, resize, dynamic content)
    let cancelled = false;
    const updateRect = () => {
      if (cancelled) return;
      try {
        const rect = currentTarget.getBoundingClientRect();
        setHighlightRect(rect);
      } catch {
        // ignore
      }
    };

    const onScroll = () => updateRect();
    const onResize = () => updateRect();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // interval to catch layout changes that aren't scroll/resize (e.g., async content)
    const intervalId = window.setInterval(updateRect, 300);
    currentTarget.classList.add(
      'outline-none',
      'ring-4',
      'ring-cyan-400',
      'ring-offset-4',
      'ring-offset-slate-950'
    );

    // attach click handler to advance when this step expects user action
    let onTargetClick: ((ev: Event) => void) | null = null;
    if (step?.waitForAction) {
      onTargetClick = (ev: Event) => {
        // don't stop native handlers — allow the UI to update first
        console.debug('Tutorial: target clicked for step', step?.id);
        // wait a bit for the element's native click to update UI, then advance
        setTimeout(() => {
          void goToStepSafely(Math.min(currentStep + 1, steps.length - 1));
        }, 200);
      };
      try {
        currentTarget.addEventListener('click', onTargetClick);
      } catch {
        // ignore
      }
    }

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.clearInterval(intervalId);

      if (onTargetClick) {
        try {
          currentTarget.removeEventListener('click', onTargetClick);
        } catch {}
      }

      currentTarget.classList.remove(
        'outline-none',
        'ring-4',
        'ring-cyan-400',
        'ring-offset-4',
        'ring-offset-slate-950',
        'animate-pulse'
      );
    };
  }, [
    currentTarget,
    scrollTargetIntoView,
    step,
    currentStep,
    steps,
    goToStepSafely,
  ]);

  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.autoContinue && routeMatchesStep && currentTarget) {
      void window.requestAnimationFrame(() => {
        setTimeout(() => {
          setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
          setStepState('idle');
          setHelperMessage('');
        }, 400);
      });
    }
  }, [currentTarget, routeMatchesStep, isOpen, step, steps.length]);

  const handleGoToCourses = () => {
    setShowCourseSelector(true);
    void router.push('/dashboard/super-admin/cursos');
  };

  const handleSelectCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
    setShowCourseSelector(false);
    void router.push(`/dashboard/super-admin/cursos/${courseId}`);
  };

  const isNextDisabled =
    currentStep === steps.length - 1 ||
    Boolean(step?.waitForAction) ||
    Boolean(step?.autoContinue) ||
    (step?.showCourseSelector && !selectedCourseId);

  if (!isReady) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 z-50 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/40 transition hover:-translate-y-0.5 hover:bg-primary/90"
      >
        Enseñar a calificar
      </button>

      {isOpen && (
        <div className="pointer-events-none fixed inset-0 z-50 bg-transparent text-white">
          <div className="absolute inset-0 bg-transparent" />

          {highlightRect && (
            <>
              <div
                className="pointer-events-none absolute rounded-3xl bg-cyan-500/20 shadow-[0_0_0_32px_rgba(56,189,248,0.45)] ring-8 ring-cyan-400/95 ring-offset-4 ring-offset-slate-950/95"
                style={{
                  top: highlightRect.top - 8,
                  left: highlightRect.left - 8,
                  width: highlightRect.width + 16,
                  height: highlightRect.height + 16,
                  zIndex: 55,
                }}
              />
              {step?.waitForAction && (
                <div
                  className="pointer-events-none absolute z-[56] flex items-center gap-3 rounded-full bg-cyan-500/95 px-4 py-2 text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-500/40"
                  style={{
                    // prefer above the target, otherwise place below
                    top:
                      highlightRect.top - 56 > 12
                        ? highlightRect.top - 56
                        : highlightRect.top + highlightRect.height + 18,
                    // center horizontally relative to the target
                    left: Math.min(
                      Math.max(
                        highlightRect.left + highlightRect.width / 2 - 110,
                        16
                      ),
                      window.innerWidth - 232
                    ),
                    width: 220,
                  }}
                >
                  <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-cyan-500">
                    !
                  </span>
                  Haz clic aquí
                </div>
              )}
            </>
          )}
          <div
            className="pointer-events-auto fixed inset-x-4 top-4 z-60 mx-auto w-[min(360px,calc(100vw-32px))] rounded-3xl border border-cyan-500/90 bg-slate-950 p-4 shadow-2xl shadow-black/90"
            style={{
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
            }}
          >
            <div className="relative">
              {highlightRect ? (
                <div className="absolute top-3 left-4 size-4 rotate-45 rounded-sm bg-cyan-400/90" />
              ) : null}

              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.45em] text-cyan-300 uppercase">
                    Guía de calificación
                  </p>
                  <h2 className="mt-2 text-lg leading-tight font-semibold text-white">
                    {step?.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white transition hover:bg-white/10"
                >
                  Cerrar
                </button>
              </div>

              <p className="text-sm leading-6 text-slate-200">
                {step?.description}
              </p>

              {helperMessage ? (
                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">{helperMessage}</div>
                    {stepState === 'missing' && step?.waitForAction ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            console.warn(
                              'Tutorial: usuario forzó continuar en paso',
                              step?.id
                            );
                            void goToNextStep();
                          }}
                          className="rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-amber-400"
                        >
                          Forzar continuar
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/5"
                        >
                          Cerrar guía
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] tracking-[0.28em] text-slate-400 uppercase">
                <span>Paso {currentStep + 1}</span>
                <span className="h-px flex-1 bg-white/10" />
                <span>{steps.length} pasos</span>
              </div>

              {!routeMatchesStep && (
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-amber-100">
                  <p className="font-semibold">Ruta necesaria</p>
                  <p className="mt-2 text-sm leading-6">
                    Necesitas estar en la página correcta para continuar. Pulsa{' '}
                    <strong>Ir a cursos</strong> y selecciona un curso.
                  </p>
                </div>
              )}

              {step?.showCourseSelector && showCourseSelector && (
                <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/95 p-3 shadow-xl shadow-black/20">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Seleccionar curso
                      </p>
                      <p className="text-xs text-slate-400">
                        Filtra por nombre para abrir el curso correcto.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={loadCourses}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white transition hover:bg-white/10"
                    >
                      Actualizar
                    </button>
                  </div>
                  <input
                    value={courseSearch}
                    onChange={(event) => setCourseSearch(event.target.value)}
                    placeholder="Buscar curso por nombre..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-white transition outline-none focus:border-cyan-400"
                  />
                  <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-0.5">
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((course) => (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => void handleSelectCourse(course.id)}
                          className="group flex w-full flex-col items-start rounded-2xl border border-white/10 bg-slate-950/90 p-3 text-left transition hover:border-cyan-400 hover:bg-cyan-500/10"
                        >
                          <span className="line-clamp-1 text-sm font-semibold text-white">
                            {course.title}
                          </span>
                          {course.description ? (
                            <span className="mt-1 line-clamp-2 text-xs text-slate-400">
                              {course.description}
                            </span>
                          ) : null}
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/90 p-4 text-center text-sm text-slate-400">
                        No se encontraron cursos con ese nombre.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={isNextDisabled}
                  className="rounded-full bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
                <button
                  type="button"
                  onClick={handleGoToCourses}
                  className="rounded-full border border-cyan-500 bg-transparent px-3 py-2 text-xs text-cyan-200 transition hover:bg-cyan-500/15"
                >
                  Ir a cursos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
