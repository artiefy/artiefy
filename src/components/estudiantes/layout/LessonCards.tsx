"use client"
import { useRouter } from 'next/navigation';
import { FaCheckCircle, FaLock, FaClock } from 'react-icons/fa';
import { useToast } from '~/hooks/use-toast';
import { type LessonWithProgress, type Course } from '~/types';

interface LessonCardsProps {
    lessonsState: LessonWithProgress[];
    selectedLessonId: number | null;
    setSelectedLessonId: (id: number | null) => void;
    course: Course;
    progress: number; // Nuevo prop para recibir el progreso
}

const LessonCards = ({
    lessonsState,
    selectedLessonId,
    setSelectedLessonId,
    course,
    progress, // Nuevo prop para recibir el progreso
}: LessonCardsProps) => {
    const router = useRouter();
    const { toast } = useToast();

    const renderLessonCard = (lessonItem: LessonWithProgress) => {
        const isCurrentLesson = lessonItem.id === selectedLessonId;
        const isAccessible = !lessonItem.isLocked;
        const isCompleted =
            lessonItem.porcentajecompletado === 100 && lessonItem.isCompleted;

        return (
            <div
                key={lessonItem.id}
                onClick={() => {
                    if (isAccessible) {
                        setSelectedLessonId(lessonItem.id);
                        router.push(`/estudiantes/clases/${lessonItem.id}`);
                    } else {
                        toast({
                            title: 'Clase Bloqueada',
                            description: 'Debes completar las clases anteriores primero.',
                            variant: 'destructive',
                        });
                    }
                }}
                className={`mb-2 rounded-lg p-4 transition-all ${isAccessible ? 'cursor-pointer hover:bg-blue-50' : 'cursor-not-allowed opacity-75'} ${isCurrentLesson ? 'border-l-8 border-blue-500 bg-blue-50' : 'bg-gray-50'} ${isCompleted ? 'border-green-500' : ''} `}
            >
                <div className="mb-2 flex items-center justify-between">
                    <h3
                        className={`font-semibold ${
                            isAccessible ? 'text-gray-900' : 'text-gray-500'
                        }`}
                    >
                        Clase {lessonItem.order}: {lessonItem.title}
                    </h3>
                    {isCompleted ? (
                        <FaCheckCircle className="text-green-500" />
                    ) : lessonItem.isLocked ? (
                        <FaLock className="text-gray-400" />
                    ) : (
                        <FaClock className="text-gray-400" />
                    )}
                </div>
                <p className="mb-2 text-sm text-gray-600">{course.instructor}</p>
                <div className="relative h-2 rounded bg-gray-200">
                    <div
                        className="absolute h-2 rounded bg-blue-500"
                        style={{ width: `${isCurrentLesson ? progress : lessonItem.porcentajecompletado}%` }}
                    />
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{lessonItem.duration} mins</span>
                    <span>{isCurrentLesson ? progress : lessonItem.porcentajecompletado}%</span>
                </div>
            </div>
        );
    };

    return (
        <>{lessonsState.sort((a, b) => a.order - b.order).map(renderLessonCard)}</>
    );
};

export default LessonCards;
