'use client';

import React from 'react';

import Image from 'next/image'; // Importar el componente Image
import { useRouter } from 'next/navigation';

import { Calendar, Eye, Users } from 'lucide-react';

import { Badge } from '~/components/projects/ui/badge';
import { Button } from '~/components/projects/ui/button';
import { Card, CardContent, CardHeader } from '~/components/projects/ui/card';
import { Progress } from '~/components/projects/ui/progress';

import ModalCategoria from './ModalCategoria';
import ModalIntegrantesProyectoInfo from './ModalIntegrantesProyectoInfo';

// Define el tipo PublicProject aquí o impórtalo si es necesario
interface PublicProject {
  id: number;
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  type_project: string;
  isPublic: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  objetivosEsp: string[];
  actividades: unknown[];
  image?: string;
  coverImageKey?: string;
}

interface ProjectInfoModalProps {
  open: boolean;
  onClose: () => void;
  project?: PublicProject | null;
  userId?: string;
}

// Define Category localmente si no está importado
interface Category {
  id: number;
  name: string;
  description: string;
  is_featured: boolean;
}

export default function ProjectInfoModal({
  open,
  onClose,
  project,
  userId,
}: ProjectInfoModalProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = React.useState<string | null>(null);
  const [alreadyTaken, setAlreadyTaken] = React.useState<boolean>(false);
  const [isOwner, setIsOwner] = React.useState<boolean>(false);
  const [inscritos, setInscritos] = React.useState<number>(0);
  const [solicitudPendiente, setSolicitudPendiente] = React.useState(false);
  const [verificandoSolicitud, setVerificandoSolicitud] = React.useState(false);

  // Estado para mostrar los modales
  const [showIntegrantes, setShowIntegrantes] = React.useState(false);
  const [showCategoria, setShowCategoria] = React.useState(false);

  // Datos simulados para ModalIntegrantesProyectoInfo (ajusta según tu estructura real)
  const integrantes = project?.user
    ? [
        {
          id: project.user.id,
          nombre: project.user.name,
          rol: 'Creador',
          especialidad: 'N/A',
          email: project.user.email,
        },
      ]
    : [];

  const proyectoInfo = {
    titulo: project?.name ?? '',
    rama: project?.category?.name ?? '',
    especialidades: project?.objetivosEsp?.length ?? 0,
    participacion: '100%',
  };

  // Obtener la cantidad de inscritos al abrir el modal
  React.useEffect(() => {
    const fetchInscritos = async () => {
      if (!project?.id) {
        setInscritos(0);
        return;
      }
      try {
        const res = await fetch(
          `/api/projects/taken/count?projectId=${project.id}`
        );
        if (!res.ok) {
          setInscritos(0);
          return;
        }
        const data: { count: number } = await res.json();
        setInscritos(data.count ?? 0);
      } catch {
        setInscritos(0);
      }
    };
    if (open && project?.id) {
      fetchInscritos();
    }
  }, [open, project?.id]);

  // Verifica si el usuario ya está inscrito o es el creador al abrir el modal
  React.useEffect(() => {
    const checkTakenAndOwner = async () => {
      if (!userId || !project?.id) {
        setAlreadyTaken(false);
        setIsOwner(false);
        return;
      }
      setIsOwner(project.user?.id === userId);
      try {
        const res = await fetch(
          `/api/projects/taken/check?userId=${userId}&projectId=${project.id}`
        );
        if (!res.ok) {
          setAlreadyTaken(false);
          return;
        }
        const data: { taken: boolean } = await res.json();
        setAlreadyTaken(data.taken === true);
      } catch {
        setAlreadyTaken(false);
      }
    };
    if (open && userId && project?.id) {
      checkTakenAndOwner();
    }
  }, [open, userId, project?.id, project?.user?.id]);

  // MEJORADO: Verificar si hay solicitud pendiente con mejor manejo de errores
  React.useEffect(() => {
    const checkSolicitudPendiente = async () => {
      if (!userId || !project?.id || !open) {
        console.log('🔍 No se puede verificar solicitud - faltan datos:', {
          userId: !!userId,
          projectId: !!project?.id,
          open,
        });
        setSolicitudPendiente(false);
        return;
      }

      console.log(
        `🔍 Verificando solicitud pendiente para usuario ${userId} en proyecto ${project.id}`
      );
      setVerificandoSolicitud(true);

      try {
        const url = `/api/projects/participation-requests?projectId=${project.id}&userId=${encodeURIComponent(
          userId
        )}`;
        console.log('🌐 URL de consulta:', url);

        const res = await fetch(url);
        console.log('📡 Respuesta de verificación:', {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
        });

        if (res.ok) {
          const solicitud = await res.json();
          console.log('📋 Datos de solicitud recibidos:', solicitud);

          // MEJORADO: Verificar diferentes estados de solicitud
          if (!solicitud) {
            setSolicitudPendiente(false);
          } else if (
            solicitud.status === 'pending' ||
            solicitud.status === 'PENDING'
          ) {
            setSolicitudPendiente(true);
          } else if (solicitud.status === 'approved') {
            // Si la solicitud fue aprobada, verificar si ya está inscrito
            setSolicitudPendiente(false);
            // Forzar re-verificación del estado de inscripción
            if (userId && project.id) {
              try {
                const checkRes = await fetch(
                  `/api/projects/taken/check?userId=${userId}&projectId=${project.id}`
                );
                if (checkRes.ok) {
                  const checkData: { taken: boolean } = await checkRes.json();
                  setAlreadyTaken(checkData.taken === true);
                }
              } catch (error) {
                console.warn('Error verificando inscripción:', error);
              }
            }
          } else {
            // rejected o cualquier otro estado
            setSolicitudPendiente(false);
          }

          console.log('✅ Estado final de solicitud:', {
            solicitudPendiente: solicitud?.status === 'pending',
            estadoSolicitud: solicitud?.status,
          });
        } else if (res.status === 404) {
          // 404 significa que no hay solicitud, esto es normal
          console.log('ℹ️ No hay solicitud registrada (404)');
          setSolicitudPendiente(false);
        } else {
          console.warn('⚠️ Error en respuesta:', res.status, res.statusText);
          setSolicitudPendiente(false);
        }
      } catch (error) {
        console.error('❌ Error verificando solicitud pendiente:', error);
        setSolicitudPendiente(false);
      } finally {
        setVerificandoSolicitud(false);
      }
    };

    // Solo ejecutar cuando el modal esté abierto y tengamos los datos necesarios
    if (open && userId && project?.id) {
      checkSolicitudPendiente();
    } else {
      // Resetear estado si el modal se cierra
      setSolicitudPendiente(false);
      setVerificandoSolicitud(false);
    }
  }, [open, userId, project?.id]);

  const handleInscribirse = async () => {
    if (!userId || !project) {
      setError('Usuario no autenticado o proyecto inválido');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/taken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, projectId: project.id }),
      });
      if (!res.ok) throw new Error('No se pudo inscribir al proyecto');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        router.push(`/proyectos/DetallesProyectos/${project.id}`);
      }, 800);
    } catch (_e) {
      setError('No se pudo inscribir al proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleRenunciar = async () => {
    if (!userId || !project) {
      setError('Usuario no autenticado o proyecto inválido');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/taken', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, projectId: project.id }),
      });
      if (!res.ok) throw new Error('No se pudo renunciar al proyecto');
      setSuccess(true);
      setAlreadyTaken(false);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (_e) {
      setError('No se pudo renunciar al proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleVerProyecto = () => {
    if (project?.id) {
      onClose();
      router.push(`/proyectos/DetallesProyectos/${project.id}`);
    }
  };

  const handleSolicitarParticipacion = async () => {
    if (!userId || !project) {
      setError('Usuario no autenticado o proyecto inválido');
      return;
    }

    const mensaje = prompt(
      'Mensaje opcional para el responsable del proyecto (opcional):'
    );

    console.log('📤 Enviando solicitud de participación:', {
      userId,
      projectId: project.id,
      mensaje: mensaje || 'Sin mensaje',
    });

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/participation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          projectId: project.id,
          requestMessage: mensaje || null,
        }),
      });

      console.log('📡 Respuesta de solicitud:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Error en solicitud:', errorData);
        throw new Error(errorData.error || 'No se pudo enviar la solicitud');
      }

      const responseData = await res.json();
      console.log('✅ Solicitud enviada exitosamente:', responseData);

      setSuccess(true);
      setSolicitudPendiente(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'No se pudo enviar la solicitud';
      console.error('❌ Error final:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitarRenuncia = async () => {
    if (!userId || !project) {
      setError('Usuario no autenticado o proyecto inválido');
      return;
    }

    const mensaje = prompt('Motivo de la renuncia (opcional):');

    if (mensaje === null) {
      return; // Usuario canceló
    }

    console.log('📤 Enviando solicitud de renuncia:', {
      userId,
      projectId: project.id,
      mensaje: mensaje || 'Sin mensaje',
    });

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects/participation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          projectId: project.id,
          requestType: 'resignation',
          requestMessage: mensaje || null,
        }),
      });

      console.log('📡 Respuesta de solicitud de renuncia:', {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Error en solicitud:', errorData);
        throw new Error(
          errorData.error || 'No se pudo enviar la solicitud de renuncia'
        );
      }

      const responseData = await res.json();
      console.log(
        '✅ Solicitud de renuncia enviada exitosamente:',
        responseData
      );

      setSuccess(true);
      setSolicitudPendiente(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (e) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : 'No se pudo enviar la solicitud de renuncia';
      console.error('❌ Error final:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Mueve el useRef fuera de cualquier return o condicional
  const backdropRef = React.useRef<HTMLDivElement>(null);

  // Bloquear scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !project) return null;

  // Progreso simulado (puedes calcularlo si tienes datos)
  const progreso = 100;

  // Adaptar la categoría para ModalCategoria (sin usar any y con id numérico)
  const categoriaForModal: Category | undefined = project?.category
    ? {
        id:
          typeof project.category.id === 'string'
            ? Number(project.category.id)
            : project.category.id,
        name: project.category.name,
        description:
          (project.category as { description?: string }).description ??
          'Sin descripción disponible',
        is_featured:
          (project.category as { is_featured?: boolean }).is_featured ?? false,
      }
    : undefined;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div
          className="relative m-6 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-slate-800 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de cerrar sobre la carta, siempre visible al hacer scroll, sin afectar el ancho */}
          <div className="sticky top-0 z-50 flex w-full justify-end bg-slate-800/1">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:bg-slate-700 hover:text-white"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <span className="sr-only">Cerrar</span>
              <svg
                width={24}
                height={24}
                viewBox="0 0 16 16"
                className="text-white"
              >
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          </div>
          {/* Imagen del proyecto */}
          <div className="mb-4 w-full">
            <div className="relative w-full">
              <Image
                src={project.image ?? project.coverImageKey ?? ''}
                alt="Imagen del proyecto"
                width={1200}
                height={320}
                className="max-h-64 w-full rounded-2xl object-cover opacity-70 shadow-lg"
                style={{ background: '#222' }}
                priority
              />
              {/* Overlay para desvanecer abajo */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(30,41,59,0.15) 60%, rgba(30,41,59,0.85) 100%)',
                }}
              />
            </div>
          </div>
          <div className="w-full space-y-6">
            {/* Header del Proyecto */}
            <Card className="relative border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 space-y-2 pr-4">
                    <h1 className="text-3xl font-bold break-words text-white">
                      {project.name}
                    </h1>
                    <p className="line-clamp-3 break-words text-slate-400">
                      {project.planteamiento ?? 'Sin planteamiento'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Badges de Estado */}
                <div className="flex flex-wrap gap-2">
                  <Badge className="max-w-[150px] truncate border-cyan-500/30 bg-cyan-500/20 text-cyan-400">
                    {isOwner ? 'Propio' : 'Público'}
                  </Badge>
                  <Badge className="max-w-[200px] truncate border-blue-500/30 bg-blue-500/20 text-blue-400">
                    {project.type_project}
                  </Badge>
                  {project.category?.name && (
                    <Button
                      variant="link"
                      className="max-w-[200px] truncate border-green-500/30 bg-green-500/20 px-2 py-0 text-green-400 underline underline-offset-2"
                      onClick={() => setShowCategoria(true)}
                    >
                      {project.category.name}
                    </Button>
                  )}
                </div>
                {/* Progreso */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-300">Progreso</span>
                    <span className="font-bold text-cyan-400">{progreso}%</span>
                  </div>
                  <Progress value={progreso} className="h-2 bg-slate-700" />
                </div>
                {/* Información del Proyecto */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="min-w-0 space-y-4">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Users className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                      <Button
                        type="button"
                        variant="outline"
                        className="truncate rounded-md border-cyan-400 bg-transparent px-3 py-1 font-semibold text-cyan-400 transition-transform duration-150 hover:scale-105 hover:bg-cyan-900/20 hover:text-white focus:scale-105 active:scale-100"
                        onClick={() => setShowIntegrantes(true)}
                      >
                        {inscritos} Integrantes
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Calendar className="h-5 w-5 flex-shrink-0 text-cyan-400" />
                      <span className="text-sm break-words">
                        Fecha de creación:{' '}
                        {typeof project.createdAt === 'string'
                          ? new Date(project.createdAt).toLocaleDateString(
                              'es-ES',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )
                          : ''}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-4">
                    <div className="text-slate-300">
                      <span className="font-medium text-cyan-400">Tipo:</span>{' '}
                      <span className="break-words">
                        {project.type_project}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <span className="flex-shrink-0 font-medium text-cyan-400">
                        Categoría:
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        className="max-w-[200px] truncate rounded-md border-cyan-400 bg-transparent px-3 py-1 font-semibold text-cyan-400 transition-transform duration-150 hover:scale-105 hover:bg-cyan-900/20 hover:text-white focus:scale-105 active:scale-100"
                        onClick={() => setShowCategoria(true)}
                      >
                        {project.category?.name ?? 'Sin categoría'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Secciones Principales */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Planteamiento */}
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400" />
                    Planteamiento
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto">
                    <p className="leading-relaxed break-words text-slate-300">
                      {project.planteamiento ?? 'Sin planteamiento'}
                    </p>
                  </div>
                </CardContent>
              </Card>
              {/* Objetivo */}
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                    <div className="h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
                    Objetivo
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto">
                    <p className="leading-relaxed break-words text-slate-300">
                      {project.objetivo_general ?? 'Sin objetivo'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex w-full justify-center gap-3">
              {!userId ? (
                <Button
                  className="flex-1 bg-blue-500 text-lg text-white hover:bg-blue-600"
                  onClick={() => {
                    onClose();
                    window.location.href = '/sign-in';
                  }}
                >
                  <span className="w-full text-lg font-semibold">
                    Iniciar Sesión
                  </span>
                </Button>
              ) : isOwner ? (
                <Button
                  className="flex-1 bg-cyan-500 text-white hover:bg-cyan-600"
                  onClick={handleVerProyecto}
                >
                  <span className="flex w-full items-center justify-center text-lg font-semibold">
                    <Eye className="mr-2 h-5 w-5" />
                    Ver Proyecto
                  </span>
                </Button>
              ) : alreadyTaken ? (
                <>
                  <Button
                    className="flex-1 bg-cyan-500 text-white hover:bg-cyan-600"
                    onClick={handleVerProyecto}
                  >
                    <span className="flex w-full items-center justify-center text-lg font-semibold">
                      <Eye className="mr-2 h-5 w-5" />
                      Ver Proyecto
                    </span>
                  </Button>
                  <Button
                    className="flex-1 bg-orange-500 text-lg text-white hover:bg-orange-600"
                    onClick={handleSolicitarRenuncia}
                    disabled={loading || solicitudPendiente}
                  >
                    <span className="w-full text-lg font-semibold">
                      {loading
                        ? 'Enviando solicitud...'
                        : solicitudPendiente
                          ? 'Renuncia Pendiente'
                          : 'Solicitar Renuncia'}
                    </span>
                  </Button>
                </>
              ) : verificandoSolicitud ? (
                <Button
                  className="flex-1 bg-gray-500 text-lg text-white"
                  disabled
                >
                  <span className="w-full text-lg font-semibold">
                    Verificando solicitud...
                  </span>
                </Button>
              ) : solicitudPendiente ? (
                <Button
                  className="flex-1 bg-yellow-500 text-lg text-black hover:bg-yellow-600"
                  disabled
                >
                  <span className="w-full text-lg font-semibold">
                    Solicitud Pendiente
                  </span>
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-green-500 text-lg text-white hover:bg-green-600"
                  onClick={handleSolicitarParticipacion}
                  disabled={loading || success}
                >
                  <span className="w-full text-lg font-semibold">
                    {loading
                      ? 'Enviando solicitud...'
                      : success
                        ? '¡Solicitud enviada!'
                        : 'Solicitar participación'}
                  </span>
                </Button>
              )}
            </div>
          </div>
          {/* Modal de Integrantes */}
          <ModalIntegrantesProyectoInfo
            isOpen={showIntegrantes}
            onClose={() => setShowIntegrantes(false)}
            proyecto={proyectoInfo}
            integrantes={integrantes}
          />
          {/* Modal de Categoría */}
          <ModalCategoria
            isOpen={showCategoria}
            onClose={() => setShowCategoria(false)}
            categoria={categoriaForModal}
          />
        </div>
      </div>
    </div>
  );
}
