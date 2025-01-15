'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaComments, FaCheckCircle, FaLock, FaClock } from 'react-icons/fa';
import VideoPlayer from '~/components/estudiantes/layout/VideoPlayer';
import { updateLessonProgress } from '~/server/actions/lessonActions';

interface Lesson {
  id: number;
  title: string;
  coverVideoKey: string;
  description: string | null;
  resourceKey: string;
  porcentajecompletado: number;
  duration: number;
}

interface Activity {
  id: number;
  name: string;
  description: string | null;
  tipo: string;
  completed: boolean;
}

export default function LessonDetails({
  lesson,
  activities,
  lessons = [],
}: {
  lesson: Lesson;
  activities: Activity[];
  lessons: Lesson[];
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
    lesson.id
  );
  const [progress, setProgress] = useState(lesson.porcentajecompletado);
  const router = useRouter();

  useEffect(() => {
    if (selectedLessonId !== null && selectedLessonId !== lesson.id) {
      router.push(`/estudiantes/clases/${selectedLessonId}`);
    }
  }, [selectedLessonId, lesson.id, router]);

  const handleVideoEnd = async () => {
    setProgress(100);
    await updateLessonProgress(lesson.id, 100);
    unlockNextLesson();
  };

  const handleProgressUpdate = async (videoProgress: number) => {
    const roundedProgress = Math.round(videoProgress);
    if (roundedProgress > progress) {
      setProgress(roundedProgress);
      await updateLessonProgress(lesson.id, roundedProgress);
    }
  };

  const unlockNextLesson = () => {
    const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
    if (currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      if (nextLesson) {
        setSelectedLessonId(nextLesson.id);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div className="w-80 overflow-y-auto bg-white p-4 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Course Content</h2>
        {lessons.map((lessonItem, index) => {
          const isLocked =
            index > 0 && (lessons[index - 1]?.porcentajecompletado ?? 0) < 100;
          return (
            <div
              key={lessonItem.id}
              className={`mb-2 cursor-pointer rounded-lg p-4 ${
                lessonItem.id === selectedLessonId
                  ? 'border-l-4 border-blue-500 bg-blue-50'
                  : 'bg-gray-50'
              } ${isLocked ? 'opacity-50' : ''}`}
              onClick={() => !isLocked && setSelectedLessonId(lessonItem.id)}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold">{lessonItem.title}</h3>
                {lessonItem.porcentajecompletado === 100 ? (
                  <FaCheckCircle className="text-green-500" />
                ) : isLocked ? (
                  <FaLock className="text-gray-400" />
                ) : (
                  <FaClock className="text-gray-400" />
                )}
              </div>
              <p className="mb-2 text-sm text-gray-600">Instructor</p>
              <div className="relative h-2 rounded bg-gray-200">
                <div
                  className="absolute h-2 rounded bg-blue-500"
                  style={{ width: `${lessonItem.porcentajecompletado}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {lessonItem.duration} mins
              </p>
              <p className="mt-1 text-right text-xs text-gray-500">
                {lessonItem.porcentajecompletado}%
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          {/* Video Player */}
          <div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-black">
            <VideoPlayer
              videoKey={lesson.coverVideoKey}
              onVideoEnd={handleVideoEnd}
              onProgressUpdate={handleProgressUpdate}
            />
          </div>

          {/* Class Info */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <h1 className="mb-4 text-2xl font-bold">{lesson.title}</h1>
            <p className="text-gray-600">{lesson.description}</p>
            <p className="mt-4">Resource Key: {lesson.resourceKey}</p>
            <p className="mt-4">Porcentaje Completado: {progress}%</p>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 overflow-y-auto bg-white p-4 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Activities</h2>
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{activity.name}</h3>
                <span className="text-xs uppercase text-gray-500">
                  {activity.tipo}
                </span>
              </div>
              {activity.completed ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaLock className="text-gray-400" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chatbot Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 rounded-full bg-blue-500 p-4 text-white shadow-lg transition-colors hover:bg-blue-600"
      >
        <FaComments className="text-xl" />
      </button>

      {/* Chatbot Modal */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 size-96 rounded-lg bg-white p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">Course Assistant</h3>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="mb-4 h-72 overflow-y-auto rounded-lg bg-gray-50 p-4">
            {/* Chat messages would go here */}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 rounded-lg border p-2"
            />
            <button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
