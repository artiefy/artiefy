'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaLock, FaClock, FaRobot } from 'react-icons/fa';
import ChatBot from '~/components/estudiantes/layout/ChatBot';
import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import VideoPlayer from '~/components/estudiantes/layout/VideoPlayer';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { Progress } from '~/components/estudiantes/ui/progress';
import { useToast } from '~/hooks/use-toast';
import {
    completeActivity,
    updateLessonProgress,
    unlockNextLesson,
    getLessonsByCourseId,
} from '~/server/actions/studentActions';
import { type Activity } from '~/types';

interface Lesson {
    id: number;
    title: string;
    coverVideoKey: string;
    description: string | null;
    resourceKey: string;
    porcentajecompletado: number;
    duration: number;
    isLocked: boolean;
    isCompleted: boolean;
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
}: {
    lesson: Lesson;
    activity: Activity | null;
    lessons: Lesson[];
    course: Course;
}) {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
        lesson.id
    );
    const [progress, setProgress] = useState(lesson.porcentajecompletado);
    const [isVideoCompleted, setIsVideoCompleted] = useState(
        lesson.porcentajecompletado === 100
    );
    const [isActivityCompleted, setIsActivityCompleted] = useState(
        activity?.isCompleted ?? false
    );
    const [isCompletingActivity, setIsCompletingActivity] = useState(false);
    const [lessonsState, setLessonsState] = useState<Lesson[]>([]);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        // Ordenar las lecciones en orden ascendente por id
        const sortedLessons = [...lessons].sort((a, b) => a.id - b.id);
        setLessonsState(sortedLessons);
    }, [lessons]);

    useEffect(() => {
        if (selectedLessonId !== null && selectedLessonId !== lesson.id) {
            setProgress(0); // Reiniciar la barra de progreso
            router.push(`/estudiantes/clases/${selectedLessonId}`);
        }
    }, [selectedLessonId, lesson.id, router]);

    useEffect(() => {
        // Ensure Lesson 1 is always active and unlocked
        setLessonsState((prevLessons) =>
            prevLessons.map((l) =>
                l.id === 1
                    ? {
                            ...l,
                            isLocked: false,
                            porcentajecompletado: 0,
                            isCompleted: false,
                        }
                    : l
            )
        );
    }, []);

    useEffect(() => {
        // Set initial progress and video completion state based on lesson data
        setProgress(lesson.porcentajecompletado);
        setIsVideoCompleted(lesson.porcentajecompletado === 100);
    }, [lesson]);

    useEffect(() => {
        // Fetch progress from the database for all lessons
        const fetchProgress = async () => {
            try {
                const lessonsData = await getLessonsByCourseId(course.id);
                const sortedLessons = lessonsData.sort((a, b) => a.id - b.id);
                setLessonsState(sortedLessons);
            } catch (error) {
                console.error('Error fetching lesson progress:', error);
            }
        };

        fetchProgress().catch((error) => {
            console.error('Error fetching lesson progress:', error);
        });
    }, [course.id]);

    useEffect(() => {
        // Redirigir si la lección está bloqueada
        if (lesson.isLocked) {
            toast({
                title: 'Lección bloqueada',
                description:
                    'Esta lección está bloqueada. Completa las lecciones anteriores para desbloquearla.',
                variant: 'destructive',
            });

            // Esperar 3 segundos antes de redirigir
            const timeoutId = setTimeout(() => {
                router.push('/estudiantes');
            }, 3000);

            // Limpiar el timeout si el componente se desmonta antes de que se complete el tiempo
            return () => clearTimeout(timeoutId);
        }
    }, [lesson.isLocked, router, toast]);

    const handleVideoEnd = async () => {
        setProgress(100);
        setIsVideoCompleted(true);
        try {
            await updateLessonProgress(lesson.id, 100);
            setLessonsState((prevLessons) =>
                prevLessons.map((l) =>
                    l.id === lesson.id
                        ? { ...l, porcentajecompletado: 100, isCompleted: true }
                        : l
                )
            );
            toast({
                title: 'Clase Completada',
                description: 'Has completado la clase 1.',
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
        if (roundedProgress > progress && roundedProgress < 100) {
            setProgress(roundedProgress);
            try {
                await updateLessonProgress(lesson.id, roundedProgress);
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

        setIsCompletingActivity(true);

        try {
            await completeActivity(activity.id);
            setIsActivityCompleted(true);
            toast({
                title: 'Actividad completada',
                description: 'Has completado la actividad con éxito.',
                variant: 'default',
            });

            // Desbloquear la siguiente lección
            const result = await unlockNextLesson(lesson.id);
            if (result.success && 'nextLessonId' in result) {
                setTimeout(() => {
                    toast({
                        title: 'Nueva clase desbloqueada',
                        description: '¡Has desbloqueado la siguiente clase!',
                        variant: 'default',
                    });
                }, 1000);

                setLessonsState((prevLessons) =>
                    prevLessons.map((l) =>
                        l.id === result.nextLessonId
                            ? { ...l, isLocked: false, porcentajecompletado: 0 }
                            : l.id === lesson.id
                                ? { ...l, porcentajecompletado: 100, isCompleted: true }
                                : l
                    )
                );

                // Redirigir a la siguiente clase
                setProgress(0); // Reiniciar la barra de progreso
                router.push(`/estudiantes/clases/${result.nextLessonId}`);
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
                            } ${lessonItem.isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                            onClick={() => {
                                if (!lessonItem.isLocked) {
                                    setProgress(0); // Reiniciar la barra de progreso
                                    setSelectedLessonId(lessonItem.id);
                                }
                            }}
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
                            <Progress
                                value={lessonItem.porcentajecompletado}
                                className="mt-2 h-2 w-full"
                            />
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
                                isVideoCompleted={isVideoCompleted}
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
                                }}
                                disabled={
                                    !isVideoCompleted ||
                                    isActivityCompleted ||
                                    isCompletingActivity
                                }
                className="mt-4 w-full rounded-lg bg-secondary px-4 py-2 text-white hover:bg-[#0099B3] active:scale-95"
                >
                                {isCompletingActivity ? (
                                    <Icons.spinner className="mr-2 text-background animate-spin"/>
                                ) : isActivityCompleted ? (
                                    'Actividad Completada'
                                ) : isVideoCompleted ? (
                                    'Completar Actividad'
                                ) : (
                                    'Tomar clase para desbloquear'
                                )}
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