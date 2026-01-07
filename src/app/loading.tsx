'use client';

import { useState } from 'react';

import Image from 'next/image';

import { BsRocket } from 'react-icons/bs';

import '~/styles/loading.css';

export default function Loading() {
  // Usar useState con lazy initialization para evitar Math.random durante render
  const [starsData] = useState(() =>
    Array.from({ length: 100 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
    }))
  );

  const [fireParticlesData] = useState(() =>
    Array.from({ length: 20 }).map(() => ({
      left: 48 + Math.random() * 4,
    }))
  );

  return (
    <div className="rocket-loading-container">
      {/* Estrellas de fondo */}
      <div className="stars">
        {starsData.map((star, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.animationDelay}s`,
            }}
          />
        ))}
      </div>

      {/* Logo en la parte superior */}
      <div className="logo-container">
        <Image
          src="/artiefy-logo.svg"
          alt="Logo de Artiefy"
          width={200}
          height={60}
          priority
          sizes="200px"
          className="logo-glow"
        />
      </div>

      {/* Cohete y efectos */}
      <div className="rocket-container">
        {/* El cohete con todos sus efectos pegados */}
        <div className="rocket">
          {/* Partículas de fuego pegadas al cohete */}
          <div className="fire-particles">
            {fireParticlesData.map((fire, i) => (
              <div
                key={i}
                className="fire-particle"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  left: `${fire.left - 48}%`,
                }}
              />
            ))}
          </div>

          {/* Llama del cohete pegada */}
          <div className="rocket-flame" />

          {/* Icono del cohete */}
          <BsRocket className="rocket-icon" />
        </div>

        {/* Ondas de choque */}
        <div className="shock-waves">
          <div className="shock-wave" />
          <div className="shock-wave" />
          <div className="shock-wave" />
        </div>
      </div>

      {/* Ondas de energía */}
      <div className="energy-rings">
        <div className="energy-ring" />
        <div className="energy-ring" />
        <div className="energy-ring" />
      </div>
    </div>
  );
}
