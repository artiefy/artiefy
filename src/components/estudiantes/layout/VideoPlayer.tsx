import React, { useEffect, useState, useRef } from 'react';

interface VideoPlayerProps {
  videoKey: string;
  onVideoEnd: () => void;
  onProgressUpdate: (progress: number) => void;
  isVideoCompleted: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoKey,
  onVideoEnd,
  onProgressUpdate,
  isVideoCompleted,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      const url = videoKey
        ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${videoKey}`
        : '';
      try {
        const response = await fetch(url);
        if (response.status === 403) {
          setVideoUrl('');
        } else {
          setVideoUrl(url);
        }
      } catch {
        setVideoUrl('');
      }
    };

    fetchVideoUrl().catch(console.error);
  }, [videoKey]);

  const handleTimeUpdate = () => {
    if (videoRef.current && !isVideoCompleted) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      onProgressUpdate(progress);
    }
  };

  const handleVideoEnd = () => {
    onVideoEnd();
  };

  return (
    <div className="flex items-center justify-center">
      {videoUrl ? (
        <video
          ref={videoRef}
          controls
          className="h-auto w-full"
          onEnded={handleVideoEnd}
          onTimeUpdate={handleTimeUpdate}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <p>Video not available</p>
      )}
    </div>
  );
};

export default VideoPlayer;
