'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    // global-error must include html and body tags
    <html>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#01142B',
            color: '#fff',
          }}
        >
          <h2>¡Ha ocurrido un error inesperado!</h2>
          <pre
            style={{
              color: '#ff5555',
              margin: '1em 0',
              maxWidth: '80vw',
              overflowX: 'auto',
            }}
          >
            {error?.message}
          </pre>
          <button
            style={{
              background: '#0f3a6e',
              color: '#fff',
              padding: '0.5em 1.5em',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '1em',
            }}
            onClick={() => reset()}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
