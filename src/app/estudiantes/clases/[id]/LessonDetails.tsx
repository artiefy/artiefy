'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaLock, FaClock, FaRobot } from 'react-icons/fa';
import ChatBot from '~/components/estudiantes/layout/ChatBot';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import VideoPlayer from '~/components/estudiantes/layout/VideoPlayer';
import { Button } from '~/components/estudiantes/ui/button';
import { Progress } from '~/components/estudiantes/ui/progress';
import { useToast } from '~/hooks/use-toast';
import { completeActivityAction } from '~/server/actions/activityActions';
import { updateLessonProgressAction } from '~/server/actions/lessonActions';
import { unlockNextLessonAction } from '~/server/actions/progressActions';

interface Lesson {
  id: number;
  title: string;
  coverVideoKey: string;
  description: string | null;
  resourceKey: string;
  porcentajecompletado: number;
  duration: number;
  isLocked: boolean;
}

interface Activity {
  id: number;
  name: string;
  description: string | null;
  tipo: string;
  completed: boolean;
}

interface Course {
  id: number;
  instructor: string;
}

export default function LessonDetails({
  lesson,
  activity,
  lessons,
  course,
  userId,
}: {
  lesson: Lesson;
  activity: Activity | null;
  lessons: Lesson[];
  course: Course;
  userId: string;
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
    lesson.id
  );
  const [progress, setProgress] = useState(lesson.porcentajecompletado);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [isActivityCompleted, setIsActivityCompleted] = useState(
    activity?.completed ?? false
  );
  const [lessonsState, setLessonsState] = useState<Lesson[]>(lessons);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (selectedLessonId !== null && selectedLessonId !== lesson.id) {
      router.push(`/estudiantes/clases/${selectedLessonId}`);
    }
  }, [selectedLessonId, lesson.id, router]);

  useEffect(() => {
    // Ensure Lesson 1 is always active and unlocked
    setLessonsState((prevLessons) =>
      prevLessons.map((l) =>
        l.id === 1 ? { ...l, isLocked: false, porcentajecompletado: 0 } : l
      )
    );
  }, []);

  const handleVideoEnd = async () => {
    setProgress(100);
    setIsVideoCompleted(true);
    try {
      await updateLessonProgressAction(lesson.id, 100);
      setLessonsState((prevLessons) =>
        prevLessons.map((l) =>
          l.id === lesson.id ? { ...l, porcentajecompletado: 100 } : l
        )
      );
      toast({
        title: 'Progreso actualizado',
        description: 'Has completado el video de la lección.',
        variant: 'default',
      });
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
    if (roundedProgress > progress) {
      setProgress(roundedProgress);
      try {
        await updateLessonProgressAction(lesson.id, roundedProgress);
        setLessonsState((prevLessons) =>
          prevLessons.map((l) =>
            l.id === lesson.id
              ? { ...l, porcentajecompletado: roundedProgress }
              : l
          )
        );
      } catch (error) {
        console.error('Error al actualizar el progreso de la lección:', error);
      }
    }
  };

  const handleActivityCompletion = async () => {
    if (!activity) return;

    try {
      await completeActivityAction(userId, activity.id);
      setIsActivityCompleted(true);
      toast({
        title: 'Actividad completada',
        description: 'Has completado la actividad con éxito.',
        variant: 'default',
      });

      // Desbloquear la siguiente lección
      const result = await unlockNextLessonAction(lesson.id);
      if (result.success && 'nextLessonId' in result) {
        toast({
          title: 'Nueva lección desbloqueada',
          description: '¡Has desbloqueado la siguiente lección!',
          variant: 'default',
        });

        setLessonsState((prevLessons) =>
          prevLessons.map((l) =>
            l.id === result.nextLessonId
              ? { ...l, isLocked: false, porcentajecompletado: 0 }
              : l.id === lesson.id
                ? { ...l, porcentajecompletado: 100 }
                : l
          )
        );

        // Cambiar a la siguiente lección inmediatamente
        if (
          typeof result.nextLessonId === 'number' ||
          typeof result.nextLessonId === 'string'
        ) {
          router.push(`/estudiantes/clases/${result.nextLessonId}`);
          setSelectedLessonId(
            typeof result.nextLessonId === 'number'
              ? result.nextLessonId
              : parseInt(result.nextLessonId)
          );
        }
      }
    } catch (error) {
      console.error('Error al completar la actividad:', error);
      toast({
        title: 'Error',
        description: 'No se pudo completar la actividad.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Header />
      <div className="flex h-screen px-14">
        {/* Left Sidebar */}
        <div className="w-80 bg-background pr-8 shadow-lg">
          <h2 className="mb-4 text-center text-3xl font-bold text-primary">
            Clases
          </h2>
          {lessonsState.map((lessonItem) => (
            <div
              key={lessonItem.id}
              className={`mb-2 cursor-pointer rounded-lg p-4 ${
                lessonItem.id === selectedLessonId
                  ? 'border-l-8 border-blue-500 bg-blue-50'
                  : 'bg-gray-50'
              } ${lessonItem.isLocked && lessonItem.id !== 1 ? 'opacity-50' : ''}`}
              onClick={() =>
                !lessonItem.isLocked && setSelectedLessonId(lessonItem.id)
              }
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-background">
                  {lessonItem.title}
                </h3>
                {lessonItem.porcentajecompletado === 100 ||
                lessonItem.id === 1 ? (
                  <FaCheckCircle className="text-green-500" />
                ) : lessonItem.isLocked ? (
                  <FaLock className="text-gray-400" />
                ) : (
                  <FaClock className="text-gray-400" />
                )}
              </div>
              <p className="mb-2 text-sm text-background">
                {course.instructor}
              </p>
              <div className="relative h-2 rounded bg-gray-200">
                <div
                  className="absolute h-2 rounded bg-blue-500"
                  style={{ width: `${lessonItem.porcentajecompletado}%` }}
                ></div>
              </div>
              <div className="mt-2 flex justify-between text-xs text-background">
                <span>{lessonItem.duration} mins</span>
                <span>{lessonItem.porcentajecompletado}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-background">
          <div className="mx-auto max-w-4xl">
            {/* Video Player */}
            <div className="mb-6 overflow-hidden rounded-lg bg-background">
              <VideoPlayer
                videoKey={lesson.coverVideoKey}
                onVideoEnd={handleVideoEnd}
                onProgressUpdate={handleProgressUpdate}
              />
            </div>

            {/* Class Info */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
              <h1 className="mb-4 text-2xl font-bold text-background">
                {lesson.title}
              </h1>
              <p className="text-background">{lesson.description}</p>
              <p className="mt-4 text-background">
                Resource Key: {lesson.resourceKey}
              </p>
              <p className="mt-4 text-background">
                Progreso De La Clase: {progress}%
              </p>
              <Progress value={progress} className="mt-2 h-2 w-full" />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Activity */}
        <div className="w-72 bg-background pl-8 shadow-lg">
          <h2 className="mb-4 text-center text-3xl font-bold text-primary">
            Actividades
          </h2>
          {activity ? (
            <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-background">
                    {activity.name}
                  </h3>
                  <span className="text-xs uppercase text-background">
                    {activity.tipo}
                  </span>
                </div>
                {isActivityCompleted ? (
                  <FaCheckCircle className="text-green-500" />
                ) : (
                  <FaLock className="text-gray-400" />
                )}
              </div>
              <p className="mt-2 text-sm text-background">
                {activity.description}
              </p>
              <Button
                onClick={async () => {
                  await handleActivityCompletion();
                  const nextLesson = lessonsState.find(
                    (lessonItem) => lessonItem.id === lesson.id + 1
                  );
                  if (nextLesson) {
                    router.push(`/estudiantes/clases/${nextLesson.id}`);
                    setLessonsState((prevLessons) =>
                      prevLessons.map((l) =>
                        l.id === nextLesson.id ? { ...l, isLocked: false } : l
                      )
                    );
                    setSelectedLessonId(nextLesson.id);
                  }
                }}
                disabled={!isVideoCompleted || isActivityCompleted}
                className="mt-4 w-full rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                {isActivityCompleted
                  ? 'Actividad Completada'
                  : isVideoCompleted
                    ? 'Completar Actividad'
                    : 'Ver el video para desbloquear'}
              </Button>
            </div>
          ) : (
            <p className="text-background">
              No hay actividades para esta lección.
            </p>
          )}
        </div>

        {/* Chatbot Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-6 right-6 rounded-full bg-secondary p-4 text-white shadow-lg transition-colors hover:bg-background hover:ring hover:ring-primary"
        >
          <FaRobot className="text-xl" />
        </button>

        <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
      <div className="mt-16">
        <Footer />
      </div>
    </>
  );
}
