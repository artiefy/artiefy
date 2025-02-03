"use client"
import React, { useEffect, useState } from 'react';
import '~/styles/rocket.css';

const Loading: React.FC = () => {
    const [launch, setLaunch] = useState(false);

    useEffect(() => {
        // Trigger the launch animation as soon as the component mounts
        setLaunch(true);
    }, []);

    return (
        <div className="fullscreen-background">
            <div className={`card ${launch ? 'launch' : ''}`}>
                <div className="star star-1"></div>
                <div className="star star-2"></div>
                <div className="star star-3"></div>
                <div className="star star-4"></div>
                <div className="star star-5"></div>
                <div className="star star-6"></div>
                <div className="star star-7"></div>
                <div className="card-info">
                    <span>Cargando... Artiefy!</span>
                </div>
                <svg className="moon" viewBox="0 0 20 20">
                    <path d="M 10 9 z z M 7.007 6.552 c 0 -2.259 0.795 -4.33 2.117 -5.955 C 4.34 1.042 0.594 5.07 0.594 9.98 c 0 5.207 4.211 9.426 9.406 9.426 c 2.94 0 5.972 -1.354 7.696 -3.472 c -0.289 0.026 -0.987 0.044 -1.283 0.044 C 11.219 15.979 7.007 11.759 7.007 6.552 z"></path>
                </svg>
                <svg className="rocket" viewBox="48.0129 48.1783 416 415.6">
                    <path d="M461.81,53.81a4.4,4.4,0,0,0-3.3-3.39c-54.38-13.3-180,34.09-248.13,102.17a294.9,294.9,0,0,0-33.09,39.08c-21-1.9-42-.3-59.88,7.5-50.49,22.2-65.18,80.18-69.28,105.07a9,9,0,0,0,9.8,10.4l81.07-8.9a180.29,180.29,0,0,0,1.1,18.3,18.15,18.15,0,0,0,5.3,11.09l31.39,31.39a18.15,18.15,0,0,0,11.1,5.3,179.91,179.91,0,0,0,18.19,1.1l-8.89,81a9,9,0,0,0,10.39,9.79c24.9-4,83-18.69,105.07-69.17,7.8-17.9,9.4-38.79,7.6-59.69a293.91,293.91,0,0,0,39.19-33.09C427.82,233.76,474.91,110.9,461.81,53.81ZM298.66,213.67a42.7,42.7,0,1,1,60.38,0A42.65,42.65,0,0,1,298.66,213.67Z"></path>
                </svg>
            </div>
        </div>
    );
};

export default Loading;
