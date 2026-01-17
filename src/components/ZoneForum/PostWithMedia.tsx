'use client';

import Image from 'next/image';

import { getPublicUrl } from '~/server/lib/s3-upload';

interface PostWithMediaProps {
  id: number;
  content: string;
  imageKey?: string | null;
  audioKey?: string | null;
  videoKey?: string | null;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export function PostWithMedia({
  content,
  imageKey,
  audioKey,
  videoKey,
  userName,
  createdAt,
}: PostWithMediaProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-black/20 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-primary font-semibold text-sm">{userName}</p>
          <p className="text-xs text-gray-500">{formatDate(createdAt)}</p>
        </div>
      </div>

      <p className="text-gray-200 text-sm leading-relaxed">{content}</p>

      {/* Media rendering */}
      <div className="space-y-3 mt-4">
        {imageKey && (
          <div className="rounded-lg overflow-hidden bg-black/40">
            <Image
              src={getPublicUrl(imageKey)}
              alt="Imagen del post"
              className="w-full max-h-96 object-cover"
              width={600}
              height={384}
            />
          </div>
        )}

        {audioKey && (
          <div className="rounded-lg overflow-hidden bg-black/40 p-4">
            <audio controls className="w-full" src={getPublicUrl(audioKey)} />
          </div>
        )}

        {videoKey && (
          <div className="rounded-lg overflow-hidden bg-black/40">
            <video
              controls
              className="w-full max-h-96"
              src={getPublicUrl(videoKey)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
