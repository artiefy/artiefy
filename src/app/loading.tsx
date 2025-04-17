"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import "~/styles/loading.css"

export const dynamic = "force-static"

// Añadir esta exportación para mejorar el SEO
export const metadata = {
  robots: "noindex",
}

const Loading: React.FC = () => {
  const [launch, setLaunch] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLaunch(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="loading-fullscreen-background">
      <div className={`loading-card flex-col ${launch ? "loading-launch" : ""}`} aria-label="Cargando contenido">
        {/* Completamente eliminado cualquier texto visible */}
        <div
          className="loading-title mb-16 animate-pulse text-5xl sm:text-4xl md:text-4xl lg:text-4xl"
          aria-hidden="true"
        />
        <div className="flex items-center justify-center gap-8">
          <Image
            src="/cursor.png"
            alt="Logo de Artiefy"
            className="loading-logo"
            width={180}
            height={180}
            priority
            aria-hidden="true"
          />
          <div className="loading-wrapper" aria-hidden="true">
            <div className="loading-circle" />
            <div className="loading-circle" />
            <div className="loading-circle" />
            <div className="loading-shadow" />
            <div className="loading-shadow" />
            <div className="loading-shadow" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Loading
