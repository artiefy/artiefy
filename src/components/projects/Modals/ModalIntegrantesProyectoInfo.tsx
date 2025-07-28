import React from 'react';

import { Mail, Users, X } from 'lucide-react';

import { Badge } from '~/components/projects/ui/badge';
import { Button } from '~/components/projects/ui/button';
import { Card, CardContent } from '~/components/projects/ui/card';

interface Integrante {
  id: number | string;
  nombre: string;
  rol: string;
  especialidad: string;
  email: string;
}

interface Proyecto {
  titulo: string;
  rama: string;
  especialidades: number | string;
  participacion: string;
}

interface ModalIntegrantesProyectoInfoProps {
  isOpen: boolean;
  onClose: () => void;
  proyecto: Proyecto;
  integrantes: Integrante[];
}

const ModalIntegrantesProyectoInfo: React.FC<
  ModalIntegrantesProyectoInfoProps
> = ({ isOpen, onClose, proyecto, integrantes }) => {
  if (!isOpen) return null;

  // Evita errores si no hay datos
  const safeProyecto = proyecto ?? {
    titulo: '',
    rama: '',
    especialidades: 0,
    participacion: '',
  };
  const safeIntegrantes = integrantes ?? [];

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div className="relative mx-auto max-h-[95vh] min-h-[80vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-teal-800 p-6 shadow-2xl">
        {/* Header del Modal */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-cyan-300">
              <Users className="h-8 w-8 text-slate-900" />
            </div>
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                {safeProyecto.titulo}
              </h1>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="border-teal-400/30 bg-teal-500/20 text-teal-300"
                >
                  {safeProyecto.rama}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-purple-400/50 text-purple-300"
                >
                  # de {safeIntegrantes.length}
                </Badge>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 border-teal-400/50 text-teal-300"
                >
                  <Users className="h-3 w-3" />
                  Integrantes
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Sección de Integrantes */}
        <div className="mb-6">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-semibold text-white">
            <Users className="h-6 w-6 text-teal-400" />
            Integrantes del Proyecto
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {safeIntegrantes.map((integrante) => (
              <Card
                key={integrante.id}
                className="group border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-4 text-center">
                    {/* Avatar reemplazado por iniciales */}
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-teal-400/50 bg-gradient-to-br from-teal-400 to-cyan-300 text-lg font-semibold text-slate-900">
                      {integrante.nombre
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>

                    {/* Información del integrante */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-teal-300">
                        {integrante.nombre}
                      </h3>
                      <Badge className="border-teal-400/30 bg-teal-500/20 text-teal-300">
                        {integrante.rol}
                      </Badge>
                      <p className="text-sm text-gray-300">
                        {integrante.especialidad}
                      </p>
                    </div>

                    {/* Enlaces de contacto */}
                    <div className="flex items-center gap-2 pt-2">
                      {integrante.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-gray-300 hover:bg-teal-500/20 hover:text-teal-300"
                          title={`Enviar email a ${integrante.nombre}`}
                          asChild
                        >
                          <a
                            href={`mailto:${integrante.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Estadísticas del equipo */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-teal-300">
                {safeIntegrantes.length}
              </div>
              <div className="text-sm text-gray-300">Integrantes Activos</div>
            </CardContent>
          </Card>
          <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-purple-300">
                {safeProyecto.especialidades}
              </div>
              <div className="text-sm text-gray-300">Especialidades</div>
            </CardContent>
          </Card>
          <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-cyan-300">
                {safeProyecto.participacion}
              </div>
              <div className="text-sm text-gray-300">Participación</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModalIntegrantesProyectoInfo;
