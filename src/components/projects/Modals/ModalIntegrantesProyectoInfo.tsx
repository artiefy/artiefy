import React, { useEffect, useState } from 'react';

import { Mail, Users, X, Loader2 } from 'lucide-react';

import { Badge } from '~/components/projects/ui/badge';
import { Button } from '~/components/projects/ui/button';
import { Card, CardContent } from '~/components/projects/ui/card';

interface Integrante {
  id: number | string;
  nombre: string;
  rol: string;
  especialidad: string;
  email: string;
  esResponsable?: boolean;
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
  proyecto: Proyecto & { id: number | string }; // Añadir id del proyecto
  integrantes?: Integrante[]; // Hacer opcional ya que lo obtendremos de la API
}

const ModalIntegrantesProyectoInfo: React.FC<
  ModalIntegrantesProyectoInfoProps
> = ({ isOpen, onClose, proyecto, integrantes: integrantesProp }) => {
  const [integrantes, setIntegrantes] = useState<Integrante[]>(
    integrantesProp || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener integrantes cuando se abre el modal
  useEffect(() => {
    if (isOpen && proyecto?.id) {
      const fetchIntegrantes = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `/api/projects/taken?projectId=${proyecto.id}`
          );
          if (response.ok) {
            const data = await response.json();
            setIntegrantes(data.integrantes || []);
          } else {
            setError('Error al cargar los integrantes');
          }
        } catch (err) {
          setError('Error de conexión');
          console.error('Error fetching integrantes:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchIntegrantes();
    }
  }, [isOpen, proyecto?.id]);

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
          <div className="flex min-w-0 flex-1 items-center gap-4 pr-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-cyan-300">
              <Users className="h-8 w-8 text-slate-900" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="mb-2 text-2xl font-bold break-words text-white md:text-3xl">
                {safeProyecto.titulo}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="max-w-[150px] truncate border-teal-400/30 bg-teal-500/20 text-teal-300"
                >
                  {safeProyecto.rama}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Sección de Integrantes */}
        <div className="mb-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white md:text-2xl">
            <Users className="h-6 w-6 flex-shrink-0 text-teal-400" />
            Integrantes del Proyecto ({safeIntegrantes.length})
          </h2>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-teal-400" />
              <p className="text-lg text-gray-400">Cargando integrantes...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <p className="mb-2 text-lg text-red-400">{error}</p>
              <p className="text-sm text-gray-500">
                No se pudieron cargar los integrantes
              </p>
            </div>
          ) : safeIntegrantes.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-4 h-16 w-16 text-gray-500" />
              <p className="mb-2 text-lg text-gray-400">
                No hay integrantes inscritos
              </p>
              <p className="text-sm text-gray-500">
                Este proyecto aún no tiene miembros del equipo
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {safeIntegrantes.map((integrante) => (
                <Card
                  key={integrante.id}
                  className="group border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center space-y-4 text-center">
                      {/* Avatar con iniciales del nombre */}
                      <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-2 border-teal-400/50 bg-gradient-to-br from-teal-400 to-cyan-300 text-lg font-semibold text-slate-900">
                        {integrante.nombre && integrante.nombre.trim()
                          ? integrante.nombre
                              .trim()
                              .split(' ')
                              .map((n) => n[0]?.toUpperCase() || '')
                              .join('')
                              .slice(0, 2)
                          : '??'}
                      </div>

                      {/* Información del integrante */}
                      <div className="w-full min-w-0 space-y-2">
                        <h3 className="text-lg font-semibold break-words text-white transition-colors group-hover:text-teal-300">
                          {integrante.nombre || 'Sin nombre'}
                        </h3>
                        <div className="flex flex-wrap justify-center gap-2">
                          {integrante.esResponsable && (
                            <Badge className="max-w-full truncate border-yellow-400/30 bg-yellow-500/20 text-yellow-300">
                              👑 Responsable
                            </Badge>
                          )}
                          {integrante.rol && !integrante.esResponsable && (
                            <Badge className="max-w-full truncate border-teal-400/30 bg-teal-500/20 text-teal-300">
                              {integrante.rol}
                            </Badge>
                          )}
                        </div>
                        {integrante.especialidad && (
                          <p className="text-sm break-words text-gray-300">
                            {integrante.especialidad}
                          </p>
                        )}
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
          )}
        </div>

        {/* Estadísticas del equipo */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-teal-300">
                {
                  safeIntegrantes.filter(
                    (integrante) => !integrante.esResponsable
                  ).length
                }
              </div>
              <div className="text-sm text-gray-300">Integrantes Inscritos</div>
            </CardContent>
          </Card>
          <Card className="border-white/20 bg-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-cyan-300">
                {safeProyecto.participacion}
              </div>
              <div className="text-sm text-gray-300">Estado del Proyecto</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModalIntegrantesProyectoInfo;
