'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import '~/styles/loading.css';

const Loading: React.FC = () => {
  const [launch, setLaunch] = useState(false);

  useEffect(() => {
    setLaunch(true);
  }, []);

  return (
    <div className="fullscreen-background">
      <div className={`card ${launch ? 'launch' : ''}`}>
        <div className="card-info">
          <div className="loading-container">
            <div className="loader" aria-live="assertive" role="alert"></div>
          </div>
          <span className="animate-pulse">CARGANDO!</span>
        </div>
        <Image
          src="/cursor.png"
          alt="Logo"
          className="logo"
          width={140}
          height={140}
          priority
        />
      </div>
    </div>
  );
};

export default Loading;