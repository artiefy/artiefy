"use client";

import React from 'react';

export interface TextWavesProps {
  text: string;
  className?: string;
}

const TextWaves: React.FC<TextWavesProps> = ({ text, className = '' }) => {
  return (
    <h1 className={`inline-block overflow-hidden ${className}`}>
      <span className="block relative">
        {text.split(' ').map((word, i) => (
          <span
            key={i}
            className="inline-block mr-2 animate-wave"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {word}
          </span>
        ))}
      </span>
      <style jsx>{`
        .animate-wave {
          transform-origin: center;
          display: inline-block;
          animation: wave 900ms ease-in-out both;
        }

        @keyframes wave {
          0% { transform: translateY(0); opacity: 0; }
          40% { transform: translateY(-8px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </h1>
  );
};

export default TextWaves;

