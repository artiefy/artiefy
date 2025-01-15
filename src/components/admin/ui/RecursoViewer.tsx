import React from 'react';
import dynamic from 'next/dynamic';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '~/components/admin/ui/dialog';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

interface RecursoViewerProps {
    recurso: {
        nombre: string;
        tipo: 'documento' | 'video' | 'enlace' | 'youtube' | 'drive';
        url: string;
    } | null;
    isOpen: boolean;
    onClose: () => void;
}

export function RecursoViewer({
    recurso,
    isOpen,
    onClose,
}: RecursoViewerProps) {
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
                                    playerVars: {
                                        origin: window.location.origin,
                                    },
                                },
                                file: {
                                    attributes: {
                                        controlsList: 'nodownload',
                                    },
                                },
                            }}
                        />
                    </div>
                );
            case 'documento':
            case 'enlace':
                return (
                    <iframe
                        src={recurso.url}
                        className="h-[60vh] w-full"
                        title={recurso.nombre}
                    />
                );
            default:
                return <p>Tipo de recurso no soportado.</p>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="overflow-auto sm:max-h-[80vh] sm:max-w-[80vw]">
                <DialogHeader>
                    <DialogTitle>{recurso.nombre}</DialogTitle>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
}
