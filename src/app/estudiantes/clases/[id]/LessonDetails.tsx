'use client';
import { useState } from 'react';
import {
  FaPlay,
  FaPause,
  FaExpand,
  FaComments,
  FaCheckCircle,
  FaClock,
  FaLock,
} from 'react-icons/fa';
import VideoPlayer from '~/components/estudiantes/layout/VideoPlayer';

interface Lesson {
  id: number;
  title: string;
  coverVideoKey: string;
  description: string | null;
  resourceKey: string;
  porcentajecompletado: number;
}

const mockClasses = [
  {
    id: 1,
    title: 'Introduction to React Fundamentals',
    instructor: 'Sarah Johnson',
    progress: 100,
    completed: true,
    duration: '45 min',
  },
  {
    id: 2,
    title: 'State Management in React',
    instructor: 'Michael Chen',
    progress: 75,
    completed: false,
    duration: '60 min',
  },
  {
    id: 3,
    title: 'React Hooks Deep Dive',
    instructor: 'Emily Parker',
    progress: 0,
    completed: false,
    duration: '55 min',
  },
];

const activities = [
  {
    id: 1,
    title: 'Practice Exercise 1',
    type: 'assignment',
    completed: true,
  },
  {
    id: 2,
    title: 'Module Quiz',
    type: 'quiz',
    completed: false,
  },
  {
    id: 3,
    title: 'Coding Challenge',
    type: 'challenge',
    completed: false,
  },
];

export default function LessonDetails({ lesson }: { lesson: Lesson }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div className="w-80 overflow-y-auto bg-white p-4 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Course Content</h2>
        {mockClasses.map((classItem) => (
          <div
            key={classItem.id}
            className={`mb-2 rounded-lg p-4 ${classItem.id === 2 ? 'border-l-4 border-blue-500 bg-blue-50' : 'bg-gray-50'}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{classItem.title}</h3>
              {classItem.completed ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaClock className="text-gray-400" />
              )}
            </div>
            <p className="mb-2 text-sm text-gray-600">{classItem.instructor}</p>
            <div className="relative h-2 rounded bg-gray-200">
              <div
                className="absolute h-2 rounded bg-blue-500"
                style={{ width: `${classItem.progress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-gray-500">{classItem.duration}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          {/* Video Player */}
          <div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-black">
            <VideoPlayer videoKey={lesson.coverVideoKey} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="rounded-full p-2 hover:bg-white/20"
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button className="rounded-full p-2 hover:bg-white/20">
                  <FaExpand />
                </button>
              </div>
            </div>
          </div>

          {/* Class Info */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <h1 className="mb-4 text-2xl font-bold">{lesson.title}</h1>
            <p className="text-gray-600">{lesson.description}</p>
            <p className="mt-4">Resource Key: {lesson.resourceKey}</p>
            <p className="mt-4">
              Porcentaje Completado: {lesson.porcentajecompletado}%
            </p>
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
                <h3 className="font-semibold">{activity.title}</h3>
                <span className="text-xs uppercase text-gray-500">
                  {activity.type}
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
