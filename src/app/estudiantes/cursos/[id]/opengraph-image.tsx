import React from 'react'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Curso en Artiefy'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const course: { title: string; description: string; instructor: string } | null = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/courses/${params.id}`).then((res) =>
    res.json() as Promise<{ title: string; description: string; instructor: string } | null>
  )

  if (!course) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: 'linear-gradient(to bottom, #4F46E5, #7C3AED)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <div>Curso no encontrado</div>
        </div>
      ),
      {
        ...size,
      }
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(to bottom, #4F46E5, #7C3AED)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: '64px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
          {course.title}
        </div>
        <div style={{ fontSize: '36px', textAlign: 'center', maxWidth: '80%' }}>
          {course.description && course.description.length > 100 
            ? course.description.substring(0, 100) + '...' 
            : course.description}
        </div>
        <div style={{ fontSize: '24px', marginTop: '20px' }}>
          Instructor: {course.instructor}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

