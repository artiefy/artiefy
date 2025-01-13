import React from 'react';

interface VideoPlayerProps {
    videoKey: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoKey }) => {
    const videoUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${videoKey}`;

    return (
        <div className="flex items-center justify-center">
            <video controls className="h-auto w-full">
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default VideoPlayer;
