"use client"
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import { FaRobot } from 'react-icons/fa';
import ChatBot from '~/components/estudiantes/layout/ChatBot';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { useToast } from '~/hooks/use-toast';
import { unlockNextLesson } from '~/server/actions/lessons/unlockNextLesson';
import { completeActivity } from '~/server/actions/progress/completeActivity';
import { updateLessonProgress } from '~/server/actions/progress/updateLessonProgress';
import {
  type Activity,
  type UserLessonsProgress,
  type Lesson,
  type Course,
  type LessonWithProgress,
} from '~/types';
import LessonNavigation from './LessonNavigation';
import LessonCards from './LessonCards';
import LessonPlayer from './LessonPlayer';
import LessonActivities from './LessonActivities';

export default function LessonDetails({
  lesson,
  activities,
  course,
  lessons,
  userLessonsProgress,
}: {
  lesson: LessonWithProgress;
  activities: Activity[];
  lessons: Lesson[];
  course: Course;
  userLessonsProgress: UserLessonsProgress[];
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(lesson.id);
  const [progress, setProgress] = useState(lesson.porcentajecompletado);
  const [isVideoCompleted, setIsVideoCompleted] = useState(lesson.porcentajecompletado === 100);
  const [isActivityCompleted, setIsActivityCompleted] = useState(false);
  const [isCompletingActivity, setIsCompletingActivity] = useState(false);
  const [lessonsState, setLessonsState] = useState<LessonWithProgress[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const initializeLessonsState = () => {
      const lessonsWithProgress = lessons
        .map((lessonItem) => {
          const progress = userLessonsProgress.find((progress) => progress.lessonId === lessonItem.id);
          return {
            ...lessonItem,
            isLocked: progress ? (progress.isLocked ?? true) : true,
          };
        })
        .sort((a, b) => a.order - b.order);
      setLessonsState(lessonsWithProgress);
    };

    initializeLessonsState();
  }, [lessons, userLessonsProgress]);

  useEffect(() => {
    if (selectedLessonId !== null && selectedLessonId !== lesson.id) {
      NProgress.start();
      setProgress(0);
      setIsVideoCompleted(false);
      setIsActivityCompleted(false);
      router.push(`/estudiantes/clases/${selectedLessonId}`);
    }
  }, [selectedLessonId, lesson.id, router]);

  useEffect(() => {
    NProgress.done();
  }, [searchParams]);

  useEffect(() => {
    setLessonsState((prevLessons) =>
      prevLessons.map((l) =>
        l.order === 1
          ? {
              ...l,
              isLocked: false,
              porcentajecompletado: l.porcentajecompletado,
              isCompleted: l.porcentajecompletado === 100,
            }
          : l
      )
    );
  }, []);

  useEffect(() => {
    setProgress(lesson.porcentajecompletado);
    setIsVideoCompleted(lesson.porcentajecompletado === 100);
  }, [lesson]);

  useEffect(() => {
    if (lesson.isLocked && lesson.order !== 1) {
      toast({
        title: 'Lección bloqueada',
        description: 'Esta lección está bloqueada. Completa las lecciones anteriores para desbloquearla.',
        variant: 'destructive',
      });

      const timeoutId = setTimeout(() => {
        router.push('/estudiantes');
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [lesson.isLocked, lesson.order, router, toast]);

  const handleVideoEnd = async () => {
    setProgress(100);
    setIsVideoCompleted(true);
    try {
      await updateLessonProgress(lesson.id, 100);
      setLessonsState((prevLessons) =>
        prevLessons.map((l) =>
          l.id === lesson.id
            ? {
                ...l,
                porcentajecompletado: 100,
                isCompleted: !activities.some(activity => !activity.isCompleted),
                isLocked: false,
              }
            : l
        )
      );
      toast({
        title: 'Video Completado',
        description: activities.length
          ? 'Ahora completa las actividades para desbloquear la siguiente clase'
          : 'Has completado la clase',
        variant: 'default',
      });

      if (!activities.length) {
        const result = await unlockNextLesson(lesson.id);
        if (result.success && 'nextLessonId' in result) {
          toast({
            title: 'Clase Completada',
            description: '¡Avanzando a la siguiente clase!',
            variant: 'default',
          });

          setTimeout(() => {
            setProgress(0);
            setSelectedLessonId(result.nextLessonId ?? null);
            router.push(`/estudiantes/clases/${result.nextLessonId}`);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error al actualizar el progreso de la lección:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el progreso de la lección.',
        variant: 'destructive',
      });
    }
  };

  const handleProgressUpdate = async (videoProgress: number) => {
    const roundedProgress = Math.round(videoProgress);
    if (roundedProgress > progress && roundedProgress < 100) {
      setProgress(roundedProgress);
      try {
        await updateLessonProgress(lesson.id, roundedProgress);
        setLessonsState((prevLessons) =>
          prevLessons.map((l) =>
            l.id === lesson.id ? { ...l, porcentajecompletado: roundedProgress } : l
          )
        );
      } catch (error) {
        console.error('Error al actualizar el progreso de la lección:', error);
      }
    }
  };

  const handleActivityCompletion = async (activityId: number) => {
    const activity = activities.find(activity => activity.id === activityId);
    if (!activity || !isVideoCompleted) return;

    setIsCompletingActivity(true);

    try {
      await completeActivity(activityId);
      setIsActivityCompleted(true);
      setLessonsState((prevLessons) =>
        prevLessons.map((l) =>
          l.id === lesson.id ? { ...l, isCompleted: true } : l
        )
      );

      const result = await unlockNextLesson(lesson.id);
      if (result.success && 'nextLessonId' in result) {
        toast({
          title: 'Clase Completada',
          description: '¡Avanzando a la siguiente clase!',
          variant: 'default',
        });

        setTimeout(() => {
          setProgress(0);
          setSelectedLessonId(result.nextLessonId ?? null);
          router.push(`/estudiantes/clases/${result.nextLessonId}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error al completar la actividad:', error);
      toast({
        title: 'Error',
        description: 'No se pudo completar la actividad.',
        variant: 'destructive',
      });
    } finally {
      setIsCompletingActivity(false);
    }
  };

  useEffect(() => {
    setLessonsState((prevLessons) =>
      prevLessons.map((l) => ({
        ...l,
        isLocked:
          l.order === 1
            ? false
            : l.id === lesson.id
            ? false
            : l.porcentajecompletado > 0
            ? false
            : l.isCompleted
            ? false
            : l.isLocked,
      }))
    );
  }, [lesson.id]);

  const handleNavigation = (direction: 'prev' | 'next') => {
    const sortedLessons = [...lessonsState].sort((a, b) => a.order - b.order);
    const currentIndex = sortedLessons.findIndex((l) => l.id === selectedLessonId);

    if (direction === 'prev') {
      for (let i = currentIndex - 1; i >= 0; i--) {
        const prevLesson = sortedLessons[i];
        if (prevLesson && !prevLesson.isLocked) {
          setProgress(0);
          setSelectedLessonId(prevLesson.id);
          router.push(`/estudiantes/clases/${prevLesson.id}`);
          break;
        }
      }
    } else if (direction === 'next') {
      for (let i = currentIndex + 1; i < sortedLessons.length; i++) {
        const nextLesson = sortedLessons[i];
        if (nextLesson && !nextLesson.isLocked) {
          setProgress(0);
          setSelectedLessonId(nextLesson.id);
          router.push(`/estudiantes/clases/${nextLesson.id}`);
          break;
        }
      }
    }
  };

  return (
    <>
      <Header />
      <div className="bg-background flex min-h-screen flex-col">
        <div className="flex flex-1 px-4 py-6">
          <div className="bg-background w-80 p-4 shadow-lg">
            <h2 className="text-primary mb-4 text-2xl font-bold">Cursos</h2>
            <LessonCards
              lessonsState={lessonsState}
              selectedLessonId={selectedLessonId}
              setSelectedLessonId={setSelectedLessonId}
              course={course}
            />
          </div>
          <div className="flex-1 p-6">
            <LessonNavigation
              handleNavigation={handleNavigation}
              lessonsState={lessonsState}
              lessonOrder={lesson.order}
            />
            <LessonPlayer
              lesson={lesson}
              progress={progress}
              handleVideoEnd={handleVideoEnd}
              handleProgressUpdate={handleProgressUpdate}
            />
          </div>
          <LessonActivities
            activities={activities}
            isVideoCompleted={isVideoCompleted}
            isActivityCompleted={isActivityCompleted}
            isCompletingActivity={isCompletingActivity}
            handleActivityCompletion={handleActivityCompletion}
          />
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="fixed bottom-6 right-6 rounded-full bg-blue-500 p-4 text-white shadow-lg transition-colors hover:bg-blue-600"
          >
            <FaRobot className="text-xl" />
          </button>
          <ChatBot />
        </div>
        <Footer />
      </div>
    </>
  );
}
