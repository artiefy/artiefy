'use client';

import { useCallback, useRef, useState } from 'react';

import { type LessonWithProgress } from '~/types';

import VideoPlayer, { type VideoPlayerHandle } from './LessonVideo';

interface LessonPlayerProps {
  lesson: LessonWithProgress;
  progress: number;
  handleVideoEnd: () => void;
  handleProgressUpdate: (progress: number) => void;
  onTimeUpdate?: (time: number) => void;
}

export default function LessonPlayer({
  lesson,
  progress,
  handleVideoEnd,
  handleProgressUpdate,
  onTimeUpdate,
}: LessonPlayerProps) {
  const isLocked = false;
  const hasVideo = Boolean(
    lesson.coverVideoKey && lesson.coverVideoKey !== 'none'
  );
  const playerRef = useRef<VideoPlayerHandle | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVideoEndWrapper = useCallback(() => {
    setIsPlaying(false);
    handleProgressUpdate(100);
    handleVideoEnd();
  }, [handleProgressUpdate, handleVideoEnd]);

  return (
    <div className="w-full" style={{ backgroundColor: '#01152d' }}>
      <div className="w-full">
        <div className="px-4 pt-12 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Video Player con overlay */}
            {hasVideo && (
              <div className="group relative aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-2xl">
                <VideoPlayer
                  videoKey={lesson.coverVideoKey}
                  onVideoEnd={handleVideoEndWrapper}
                  onProgressUpdate={handleProgressUpdate}
                  onTimeUpdate={onTimeUpdate}
                  isVideoCompleted={progress === 100}
                  isLocked={isLocked}
                  resumeProgress={progress}
                  resumeTimeSeconds={
                    progress === 100 ? 0 : (lesson.lastPositionSeconds ?? 0)
                  }
                  onPlaybackChange={setIsPlaying}
                  ref={playerRef}
                />

                {/* Overlay gradients */}
                <div className="pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-500">
                  <div className="absolute top-0 right-0 left-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
                  <div className="absolute right-0 bottom-0 left-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Botón play central */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    isPlaying ? 'pointer-events-none opacity-0' : 'opacity-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => playerRef.current?.play()}
                    className="group/play flex h-20 w-20 items-center justify-center rounded-full bg-[#22c4d3e6] shadow-2xl transition-all hover:scale-110 hover:bg-[#22c4d3e6]/90 md:h-24 md:w-24"
                    aria-label="Reproducir video"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ml-1 h-8 w-8 text-accent-foreground transition-transform group-hover/play:scale-110 md:h-10 md:w-10"
                    >
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Header info debajo del video */}
            <div className="mt-4 mb-4 pl-0">
              <div className="mb-3 flex items-center gap-3">
                {lesson.courseTitle ? (
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {lesson.courseTitle}
                  </span>
                ) : null}
                {lesson.duration ? (
                  <span className="text-xs text-muted-foreground">
                    {lesson.duration} min
                  </span>
                ) : null}
              </div>
              <h1 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
                {lesson.title}
              </h1>
              {lesson.description ? (
                <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                  {lesson.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
