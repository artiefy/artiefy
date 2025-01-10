import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import dynamic from 'next/dynamic'

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false })

type RecursoViewerProps = {
  recurso: {
    nombre: string;
    tipo: 'documento' | 'video' | 'enlace' | 'youtube' | 'drive';
    url: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecursoViewer({ recurso, isOpen, onClose }: RecursoViewerProps) {
  if (!recurso) return null;

  const renderContent = () => {
    switch (recurso.tipo) {
      case 'video':
      case 'youtube':
      case 'drive':
        return (
          <div className="aspect-video w-full">
            <ReactPlayer
              url={recurso.url}
              width="100%"
              height="100%"
              controls
              config={{
                youtube: {
                  playerVars: { origin: window.location.origin }
                },
                file: {
                  attributes: {
                    controlsList: 'nodownload'
                  }
                }
              }}
            />
          </div>
        );
      case 'documento':
      case 'enlace':
        return (
          <iframe 
            src={recurso.url} 
            className="w-full h-[60vh]"
            title={recurso.nombre}
          />
        );
      default:
        return <p>Tipo de recurso no soportado.</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] sm:max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{recurso.nombre}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}

