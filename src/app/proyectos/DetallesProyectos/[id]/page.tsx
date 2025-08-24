'use client';

import React, { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

import { useUser } from '@clerk/nextjs'; // Importar useUser de Clerk
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  EyeOff,
  Globe,
  Trash2,
  Users,
} from 'lucide-react';

import Loading from '~/app/loading';
import { Header } from '~/components/estudiantes/layout/Header';
import ModalEntregaActividad from '~/components/projects/Modals/ModalEntregaActividad';
import ModalPublicarProyecto from '~/components/projects/Modals/ModalPublicarProyecto';
import { Badge } from '~/components/projects/ui/badge';
import { Button } from '~/components/projects/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/projects/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/projects/ui/table';
import { Tabs, TabsContent } from '~/components/projects/ui/tabs';
import {
  getProjectById,
  ProjectDetail,
} from '~/server/actions/project/getProjectById';
import { Category } from '~/types';

import ModalCategoria from '../../../../components/projects/Modals/ModalCategoria';
import ModalConfirmacionEliminacion from '../../../../components/projects/Modals/ModalConfirmacionEliminacion';
import ModalIntegrantesProyectoInfo from '../../../../components/projects/Modals/ModalIntegrantesProyectoInfo';
import ModalResumen from '../../../../components/projects/Modals/ModalResumen';
import ModalSolicitudesParticipacion from '../../../../components/projects/Modals/ModalSolicitudesParticipacion';

// Define a type for project activity delivery to avoid 'any'
interface ProjectActivityDelivery {
  documentKey?: string | null;
  documentName?: string | null;
  imageKey?: string | null;
  imageName?: string | null;
  videoKey?: string | null;
  videoName?: string | null;
  compressedFileKey?: string | null;
  compressedFileName?: string | null;
  comentario?: string | null;
  entregaUrl?: string | null;
  entregado?: boolean | number | string;
  aprobado?: boolean | number | string | null;
  feedback?: string | null;
  [key: string]: unknown;
}

// Add missing type definition for ObjetivoEspecifico
interface ObjetivoEspecifico {
  id?: number | string;
  description?: string;
  title?: string;
  name?: string;
  actividades?: {
    id?: number;
    descripcion?: string;
    meses?: number[];
  }[];
}

const noop = () => []; // Función vacía estable

export default function ProjectDetails() {
  // --- STATE HOOKS ---
  const { user, isLoaded } = useUser(); // Usar Clerk para obtener usuario
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params?.id);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState('horas');
  const [ModalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [responsable, setResponsable] = useState<string>(
    'Nombre del Responsable'
  );
  const [_categoria, setCategoria] = useState<Category | null>(null);
  const [inscritos, setInscritos] = useState<number>(0);
  const [integrantes, setIntegrantes] = useState<
    {
      id: string | number;
      nombre: string;
      rol: string;
      especialidad: string;
      email: string;
      github?: string;
      linkedin?: string;
    }[]
  >([]);

  // Estado para el tipo de visualización del cronograma
  const [cronogramaTipo, setCronogramaTipo] = useState<
    'horas' | 'dias' | 'meses'
  >('horas');

  // Estado para entregas de actividades
  const [entregasActividades, setEntregasActividades] = useState<
    Record<number, ProjectActivityDelivery>
  >({});

  // Estado para el modal de solicitudes de participación
  const [modalSolicitudesOpen, setModalSolicitudesOpen] = useState(false);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  // Estado para el modal de publicación y el comentario
  const [modalPublicarOpen, setModalPublicarOpen] = useState(false);
  const [comentarioPublicar, setComentarioPublicar] = useState('');
  // Nuevo estado para loading del botón de publicar

  const [publicandoProyecto, _setPublicandoProyecto] = useState(false);

  // Estado para el modal de entrega de actividad
  const [modalEntregaOpen, setModalEntregaOpen] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<{
    id?: number;
    descripcion?: string;
  } | null>(null);

  const [entregaLoading, _setEntregaLoading] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEntregaEdicion, setDatosEntregaEdicion] = useState<{
    archivos: {
      name: string;
      url: string;
      type: 'document' | 'image' | 'video' | 'compressed';
    }[];
    comentario: string;
  }>({
    archivos: [],
    comentario: '',
  });

  // Función para recargar el contador de solicitudes pendientes
  const recargarSolicitudesPendientes = async () => {
    try {
      const res = await fetch(
        `/api/projects/solicitudes/count?projectId=${projectId}`
      );
      if (res.ok) {
        const data: { count: number } = await res.json();
        setSolicitudesPendientes(data.count ?? 0);
        console.log(
          `🔔 Contador actualizado: ${data.count} solicitudes pendientes`
        );
      } else {
        setSolicitudesPendientes(0);
      }
    } catch {
      setSolicitudesPendientes(0);
    }
  };

  // Extrae fetchIntegrantes fuera del useEffect para evitar redefinición en cada render
  // Cambia type Integrante a interface Integrante
  interface Integrante {
    id: string | number;
    nombre: string;
    rol: string;
    especialidad: string;
    email: string;
    github?: string;
    linkedin?: string;
  }

  // Cambia la firma de fetchIntegrantes para evitar any
  const fetchIntegrantes = useCallback(
    async (
      projectId: number,
      setIntegrantes: React.Dispatch<React.SetStateAction<Integrante[]>>
    ) => {
      console.log('Ejecutando fetchIntegrantes');
      try {
        const res = await fetch(
          `/api/projects/taken/list?projectId=${projectId}`
        );
        console.log('Respuesta fetch /api/projects/taken/list:', res);
        if (res.ok) {
          const data: unknown = await res.json();
          console.log('Integrantes raw de la API:', data);
          if (Array.isArray(data)) {
            const integrantesConInfo: Integrante[] = await Promise.all(
              data.map(async (item) => {
                const obj = item as Record<string, unknown>;
                // Log del objeto original
                console.log('Integrante original:', obj);
                // idValue puede ser string, number, o un objeto
                const idValue = obj?.id;
                let id: string | number = '';
                if (
                  typeof idValue === 'string' ||
                  typeof idValue === 'number'
                ) {
                  id = idValue;
                } else if (idValue && typeof idValue === 'object') {
                  const nestedId = (idValue as { id?: unknown })?.id;
                  if (
                    typeof nestedId === 'string' ||
                    typeof nestedId === 'number'
                  ) {
                    id = nestedId;
                  } else {
                    id = '';
                  }
                } else {
                  id = '';
                }

                // Debug: mostrar el id que se va a usar
                console.log('Buscando info de usuario para id:', id);

                // Obtener info del usuario si hay id
                let userInfo: {
                  name?: string;
                  email?: string;
                  github?: string;
                  linkedin?: string;
                  especialidad?: string;
                } = {};
                if (id) {
                  try {
                    const userRes = await fetch(`/api/user?userId=${id}`);
                    if (userRes.ok) {
                      userInfo = await userRes.json();
                      // Debug: mostrar la info recibida
                      console.log('Respuesta de /api/user:', userInfo);
                    } else {
                      console.log('No se encontró usuario para id:', id);
                    }
                  } catch (e) {
                    console.log('Error al buscar usuario:', id, e);
                  }
                }

                const integranteFinal: Integrante = {
                  id, // <-- always string | number
                  nombre: (userInfo.name ??
                    obj?.nombre ??
                    obj?.name ??
                    '') as string,
                  rol: (obj?.rol ?? obj?.role ?? '') as string,
                  especialidad: (userInfo.especialidad ??
                    obj?.especialidad ??
                    '') as string,
                  email: (userInfo.email ?? obj?.email ?? '') as string,
                  github: (userInfo.github ?? obj?.github ?? '') as string,
                  linkedin: (userInfo.linkedin ??
                    obj?.linkedin ??
                    '') as string,
                };
                // Log del resultado final de cada integrante
                console.log('Integrante final:', integranteFinal);
                return integranteFinal;
              })
            );
            // Log del array final de integrantes
            console.log('Integrantes finales:', integrantesConInfo);
            setIntegrantes(integrantesConInfo);
          } else {
            setIntegrantes([]);
          }
        } else {
          setIntegrantes([]);
        }
      } catch (e) {
        console.log('Error en fetchIntegrantes:', e);
        setIntegrantes([]);
      }
    },
    []
  );

  // --- MEMO HOOKS (ordenados juntos) ---
  const actividadesProyecto = React.useMemo(
    () => project?.actividades ?? [],
    [project]
  );

  const actividadesPorId = React.useMemo(() => {
    const map: Record<string, unknown> = {};
    if (project?.actividades) {
      project.actividades.forEach((act) => {
        if (
          typeof act === 'object' &&
          act &&
          'id' in act &&
          act.id !== undefined &&
          (typeof act.id === 'string' || typeof act.id === 'number')
        ) {
          map[String(act.id)] = act;
        }
      });
    }
    return map;
  }, [project?.actividades]);

  const unidadesHeader = React.useMemo(() => {
    const unidades = [];
    if (
      cronogramaTipo === 'dias' &&
      project?.fecha_inicio &&
      project?.fecha_fin
    ) {
      // Asegura que el rango sea desde fecha_inicio hasta fecha_fin inclusive
      const fechaInicioStr = project.fecha_inicio.split('T')[0];
      const fechaFinStr = project.fecha_fin.split('T')[0];
      const fechaInicio = new Date(fechaInicioStr);
      const fechaFin = new Date(fechaFinStr);

      // Si la fecha de inicio es domingo, avanzar al lunes siguiente
      if (fechaInicio.getDay() === 0) {
        fechaInicio.setDate(fechaInicio.getDate() + 1);
      }

      let i = 0;
      const fechaActual = new Date(fechaInicio);
      while (fechaActual <= fechaFin) {
        unidades.push({
          indice: i,
          etiqueta: `Día ${i + 1}`,
          fecha: fechaActual.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
        });
        // Suma un día para el siguiente
        fechaActual.setDate(fechaActual.getDate() + 1);
        i++;
      }
    } else if (
      cronogramaTipo === 'meses' &&
      project?.fecha_inicio &&
      project?.fecha_fin
    ) {
      const fechaInicioStr = project.fecha_inicio.split('T')[0];
      const fechaFinStr = project.fecha_fin.split('T')[0];
      const fechaInicio = new Date(fechaInicioStr);
      const fechaFin = new Date(fechaFinStr);
      let i = 0;
      const fechaActual = new Date(fechaInicio);
      while (fechaActual <= fechaFin) {
        unidades.push({
          indice: i,
          etiqueta: `Mes ${i + 1}`,
          fecha: fechaActual
            .toLocaleString('es-ES', { month: 'long', year: 'numeric' })
            .toUpperCase(),
        });
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        i++;
      }
    } else if (
      cronogramaTipo === 'horas' &&
      project?.actividades &&
      project.actividades.length > 0
    ) {
      // Visualización por horas: una columna por actividad
      project.actividades.forEach((act, idx) => {
        unidades.push({
          indice: idx,
          etiqueta: `Actividad ${idx + 1}`,
          fecha: `${act.hoursPerDay ?? '-'} horas/día`,
        });
      });
    } else if (project?.actividades && project.actividades.length > 0) {
      const maxIndex = Math.max(
        ...project.actividades.flatMap((a) => a.meses ?? [0])
      );
      for (let i = 0; i <= maxIndex; i++) {
        unidades.push({
          indice: i,
          etiqueta: cronogramaTipo === 'dias' ? `Día ${i + 1}` : `Mes ${i + 1}`,
          fecha: '',
        });
      }
    }
    return unidades;
  }, [
    cronogramaTipo,
    project?.fecha_inicio,
    project?.fecha_fin,
    project?.actividades,
  ]);

  // --- PERMISOS Y ESTADO DE ACTIVIDAD ---
  function puedeEditarProyecto() {
    return project?.userId && user?.id && project.userId === user.id;
  }

  function puedeEntregarActividad(
    actividad: { responsibleUserId?: string | number } | undefined
  ) {
    if (!user?.id || !project) return false;
    const responsibleUserId = actividad?.responsibleUserId;
    return project.userId === user.id || responsibleUserId === user.id;
  }

  function puedeAprobarEntregas() {
    return project?.userId && user?.id && project.userId === user.id;
  }

  function getEstadoActividad(actividadId?: number) {
    if (!actividadId)
      return { estado: 'pendiente', entregado: false, aprobado: false };
    const entrega =
      typeof actividadId === 'number'
        ? entregasActividades[actividadId]
        : undefined;
    if (!entrega)
      return { estado: 'pendiente', entregado: false, aprobado: false };
    const aprobadoValue = entrega?.aprobado;
    if (
      aprobadoValue === true ||
      aprobadoValue === 1 ||
      aprobadoValue === '1' ||
      aprobadoValue === 'true'
    ) {
      return { estado: 'completada', entregado: true, aprobado: true };
    }
    if (
      aprobadoValue === false ||
      aprobadoValue === 0 ||
      aprobadoValue === '0' ||
      aprobadoValue === 'false'
    ) {
      return { estado: 'rechazada', entregado: true, aprobado: false };
    }
    const tieneArchivos = Boolean(
      entrega?.documentKey ??
        entrega?.imageKey ??
        entrega?.videoKey ??
        entrega?.compressedFileKey
    );
    const tieneComentario = Boolean(
      entrega?.comentario && entrega.comentario.trim() !== ''
    );
    const marcadoComoEntregado = Boolean(
      entrega?.entregado === true ||
        entrega?.entregado === 1 ||
        entrega?.entregado === '1'
    );
    const tieneEntrega =
      tieneArchivos || tieneComentario || marcadoComoEntregado;
    if (tieneEntrega) {
      return { estado: 'en_evaluacion', entregado: true, aprobado: false };
    }
    return { estado: 'pendiente', entregado: false, aprobado: false };
  }

  // --- HANDLERS PARA MODAL DE ENTREGA ---
  function handleAbrirModalEntrega(
    actividad: {
      id?: number;
      descripcion?: string;
      responsibleUserId?: string | number;
    },
    esEdicion = false
  ) {
    setActividadSeleccionada(actividad);
    setModoEdicion(esEdicion);
    if (esEdicion && actividad.id) {
      const entregaExistente = entregasActividades[actividad.id];
      if (entregaExistente) {
        const archivos: {
          name: string;
          url: string;
          type: 'document' | 'image' | 'video' | 'compressed';
        }[] = [];
        if (entregaExistente.documentKey) {
          archivos.push({
            name: entregaExistente.documentName ?? 'Documento',
            url: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${entregaExistente.documentKey}`,
            type: 'document',
          });
        }
        if (entregaExistente.imageKey) {
          archivos.push({
            name: entregaExistente.imageName ?? 'Imagen',
            url: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${entregaExistente.imageKey}`,
            type: 'image',
          });
        }
        if (entregaExistente.videoKey) {
          archivos.push({
            name: entregaExistente.videoName ?? 'Video',
            url: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${entregaExistente.videoKey}`,
            type: 'video',
          });
        }
        if (entregaExistente.compressedFileKey) {
          archivos.push({
            name: entregaExistente.compressedFileName ?? 'Archivo comprimido',
            url: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${entregaExistente.compressedFileKey}`,
            type: 'compressed',
          });
        }
        setDatosEntregaEdicion({
          archivos,
          comentario: entregaExistente.comentario ?? '',
        });
      }
    } else {
      setDatosEntregaEdicion({ archivos: [], comentario: '' });
    }
    setModalEntregaOpen(true);
  }

  function handleEliminarEntrega(_actividadId: number) {
    setModalEntregaOpen(false);
  }

  function handleAprobarEntrega(
    _actividadId: number,
    _estudianteUserId: string,
    _aprobado: boolean,
    _feedback?: string
  ) {
    // Implementa aquí la lógica de aprobación real si es necesario
  }

  async function handleEntregarActividad(
    _documentFile: File | null,
    _imageFile: File | null,
    _videoFile: File | null,
    _compressedFile: File | null,
    _comentario: string
  ): Promise<void> {
    // Implementa aquí la lógica de entrega real si es necesario
  }

  // Cambia esta función para que publique el proyecto correctamente
  async function handleConfirmarPublicarProyecto() {
    if (!projectId) return;
    try {
      _setPublicandoProyecto(true);
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublic: true,
          publicComment: comentarioPublicar,
        }),
      });
      if (res.ok) {
        setModalPublicarOpen(false);
        setComentarioPublicar('');
        await reloadProject();
      }
    } catch (_e) {
      // Manejo de error opcional
    } finally {
      _setPublicandoProyecto(false);
    }
  }

  // --- COMPONENTE PARA ARCHIVOS DE ENTREGA ---
  const ArchivosEntrega = ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    actividadId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    entrega,
  }: {
    actividadId: number;
    entrega: ProjectActivityDelivery | null | undefined;
  }) => {
    return null;
  };

  // --- HELPERS ---
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function getResponsableNombrePorId(
    id?: number | string | null,
    descripcion?: string
  ) {
    if (id) {
      const act = actividadesPorId[String(id)];
      if (
        act &&
        typeof act === 'object' &&
        act !== null &&
        'responsibleUserId' in act &&
        typeof (act as { responsibleUserId?: string | number })
          .responsibleUserId !== 'undefined'
      ) {
        return (act as { responsibleUserId?: string | number })
          .responsibleUserId;
      }
    }
    if (descripcion) {
      const act = Object.values(actividadesPorId).find(
        (a) =>
          typeof a === 'object' &&
          a !== null &&
          'descripcion' in a &&
          (a as { descripcion?: string }).descripcion === descripcion
      );
      if (
        act &&
        typeof act === 'object' &&
        act !== null &&
        'responsibleUserId' in act &&
        typeof (act as { responsibleUserId?: string | number })
          .responsibleUserId !== 'undefined'
      ) {
        return (act as { responsibleUserId?: string | number })
          .responsibleUserId;
      }
    }
    return '-';
  }

  // Calcular la duración de cada actividad (por ejemplo, cantidad de meses/días)

  const _duracionesActividad: Record<string, number> = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (project && Array.isArray(project.objetivos_especificos)) {
      project.objetivos_especificos.forEach((obj) => {
        if (Array.isArray(obj.actividades)) {
          obj.actividades.forEach(
            (
              act: { meses?: number[]; id?: number | string },
              actIdx: number
            ) => {
              if (act && Array.isArray(act.meses)) {
                map[String(act.id ?? actIdx)] = act.meses.length;
              }
            }
          );
        }
      });
    }
    return map;
  }, [project]);

  // Helper para obtener el índice del objetivo y actividad
  function getOrdenActividad(act: unknown) {
    if (!project?.objetivos_especificos)
      return { objetivo: 9999, actividad: 9999 };
    for (let i = 0; i < project.objetivos_especificos.length; i++) {
      const obj = project.objetivos_especificos[i];
      if (Array.isArray(obj.actividades)) {
        for (let j = 0; j < obj.actividades.length; j++) {
          const a = obj.actividades[j];
          if (
            typeof a === 'object' &&
            a !== null &&
            typeof act === 'object' &&
            act !== null &&
            'id' in a &&
            'id' in (act as object) &&
            a.id !== undefined &&
            (act as { id?: unknown }).id !== undefined &&
            (typeof a.id === 'string' || typeof a.id === 'number') &&
            (typeof (act as { id?: unknown }).id === 'string' ||
              typeof (act as { id?: unknown }).id === 'number') &&
            String(a.id) === String((act as { id?: unknown }).id)
          ) {
            return { objetivo: i, actividad: j };
          }
          if (
            typeof a === 'object' &&
            a !== null &&
            typeof act === 'object' &&
            act !== null &&
            'descripcion' in a &&
            'descripcion' in (act as object) &&
            (a as { descripcion?: unknown }).descripcion ===
              (act as { descripcion?: unknown }).descripcion
          ) {
            return { objetivo: i, actividad: j };
          }
        }
      }
    }
    return { objetivo: 9999, actividad: 9999 }; // Si no se encuentra, lo manda al final
  }

  // Ordena las actividades antes de renderizar el cronograma
  const actividadesOrdenadas = React.useMemo(() => {
    if (!project?.actividades) return [];
    return [...project.actividades].sort((a, b) => {
      const aId =
        typeof a.id === 'string' || typeof a.id === 'number' ? a.id : undefined;
      const bId =
        typeof b.id === 'string' || typeof b.id === 'number' ? b.id : undefined;
      const ordenA = getOrdenActividad(
        aId ? ({ ...a, id: aId } as unknown) : a
      );
      const ordenB = getOrdenActividad(
        bId ? ({ ...b, id: bId } as unknown) : b
      );
      if (ordenA.objetivo !== ordenB.objetivo) {
        return ordenA.objetivo - ordenB.objetivo;
      }
      return ordenA.actividad - ordenB.actividad;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.actividades, project?.objetivos_especificos]);

  // --- CALLBACKS Y FUNCIONES ---
  // Función para recargar el proyecto desde el backend
  const reloadProject = async () => {
    if (!projectId) return;
    setLoading(true);
    const data = await getProjectById(projectId);
    setProject(data);
    setLoading(false);
  };

  // Detectar el tipo de cronograma usando el campo tipo_visualizacion si existe
  /* const cronogramaInfo = React.useMemo(() => {
    if (!project?.actividades?.length)
      return { tipo: 'sin_datos', maxUnidades: 0 };

    // Prioridad: usar tipo_visualizacion si existe
    let tipo: 'dias' | 'meses' = 'meses';
    if (
      project?.tipo_visualizacion === 'dias' ||
      project?.tipo_visualizacion === 'meses'
    ) {
      tipo = project.tipo_visualizacion;
    } else {
      // fallback heurística
      const allValues = project.actividades.flatMap((a) => a.meses ?? []);
      if (!allValues.length) return { tipo: 'sin_datos', maxUnidades: 0 };
      const maxValue = Math.max(...allValues);
      tipo = maxValue >= 10 ? 'dias' : 'meses';
    }

    // Calcular maxUnidades según tipo y fechas
    let maxUnidades = 0;
    if (
      (tipo === 'dias' || tipo === 'meses') &&
      project.fecha_inicio &&
      project.fecha_fin
    ) {
      // Normaliza fechas a solo YYYY-MM-DD si vienen en formato ISO
      const fechaInicioStr = project.fecha_inicio.split('T')[0];
      const fechaFinStr = project.fecha_fin.split('T')[0];

      if (tipo === 'dias') {
        const [y1, m1, d1] = fechaInicioStr.split('-').map(Number);
        const [y2, m2, d2] = fechaFinStr.split('-').map(Number);
        const fechaInicio = new Date(Date.UTC(y1, m1 - 1, d1));
        const fechaFin = new Date(Date.UTC(y2, m2 - 1, d2));
        maxUnidades =
          Math.floor(
            (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24)
          ) + 1;
      } else {
        const fechaInicio = new Date(fechaInicioStr);
        const fechaFin = new Date(fechaFinStr);
        let count = 0;
        const fechaActual = new Date(fechaInicio);
        while (fechaActual <= fechaFin) {
          count++;
          fechaActual.setMonth(fechaActual.getMonth() + 1);
        }
        maxUnidades = count;
      }
    } else {
      // fallback: usar heurística anterior
      const allValues = project.actividades.flatMap((a) => a.meses ?? []);
      maxUnidades = allValues.length ? Math.max(...allValues) + 1 : 0;
    }

    return { tipo, maxUnidades };
  }, [project]); */

  // --- EFFECTS ---
  useEffect(() => {
    console.log('useEffect DetalleProyectoPage ejecutado');
    if (!projectId || !isLoaded || !user?.id) return; // Esperar a que Clerk cargue y user esté disponible

    (async () => {
      setLoading(true);
      const data = await getProjectById(projectId);
      setProject(data);
      setLoading(false);

      console.log('Proyecto cargado:', data); // Debug
      console.log('Usuario logueado ID:', user?.id); // Debug
      console.log('Responsable del proyecto ID:', data?.userId); // Debug

      // Obtener el nombre del responsable si el proyecto existe
      if (data?.userId) {
        try {
          const res = await fetch(`/api/user?userId=${data.userId}`);
          if (res.ok) {
            const user: { name?: string } = await res.json();
            setResponsable(user?.name ?? 'Nombre del Responsable');
          } else {
            setResponsable('Nombre del Responsable');
          }
        } catch {
          setResponsable('Nombre del Responsable');
        }
      }

      // Obtener la categoría del proyecto
      if (data?.categoryId) {
        try {
          // Cambia 'id' por 'categoryId' en la URL
          const url = `/api/projects/categoriesProjects?categoryId=${encodeURIComponent(data.categoryId)}`;
          const res = await fetch(url);
          if (res.ok) {
            const cat: Category | Category[] = await res.json();
            setCategoria(Array.isArray(cat) ? cat[0] : cat);
          } else {
            setCategoria(null);
          }
        } catch (err) {
          console.error('Error obteniendo categoría:', err);
          setCategoria(null);
        }
      }

      // Obtener la cantidad de inscritos
      const fetchInscritos = async () => {
        try {
          const res = await fetch(
            `/api/projects/taken/count?projectId=${projectId}`
          );
          if (res.ok) {
            const data: { count: number } = await res.json();
            setInscritos(data.count ?? 0);
          } else {
            setInscritos(0);
          }
        } catch {
          setInscritos(0);
        }
      };
      fetchInscritos();

      // Obtener la cantidad de solicitudes pendientes
      const fetchSolicitudesPendientes = async () => {
        try {
          const res = await fetch(
            `/api/projects/solicitudes/count?projectId=${projectId}`
          );
          if (res.ok) {
            const data: { count: number } = await res.json();
            setSolicitudesPendientes(data.count ?? 0);
          } else {
            setSolicitudesPendientes(0);
          }
        } catch {
          setSolicitudesPendientes(0);
        }
      };
      fetchSolicitudesPendientes();
    })();
  }, [projectId, isLoaded, user?.id]);

  // Nuevo useEffect SOLO para fetchIntegrantes
  useEffect(() => {
    if (!projectId || !isLoaded || !user?.id) return;
    fetchIntegrantes(projectId, setIntegrantes);
  }, [projectId, isLoaded, user?.id, fetchIntegrantes]);

  useEffect(() => {
    if (
      !Array.isArray(project?.actividades) ||
      !project.actividades.length ||
      !isLoaded
    ) {
      console.log(
        '❌ No se pueden cargar entregas - condiciones no cumplidas:',
        {
          hasActividades: !!project?.actividades?.length,
          actividadesCount: project?.actividades?.length ?? 0,
          isLoaded,
          projectId,
        }
      );
      return;
    }

    const fetchEntregas = async () => {
      console.log('🔄 === INICIO CARGA DE ENTREGAS ===');
      console.log('📋 Proyecto completo:', project);
      console.log('📋 Actividades del proyecto:', project.actividades);
      console.log('🆔 Project ID:', projectId);
      console.log('👤 User ID:', user?.id);

      try {
        const entregas: Record<number, ProjectActivityDelivery> = {};
        const resultadosCarga: {
          actividadId: number;
          estado: string;
          datos?: unknown;
        }[] = [];

        for (const actividad of project.actividades) {
          console.log(`\n🎯 === PROCESANDO ACTIVIDAD ${actividad.id} ===`);
          console.log('📝 Descripción:', actividad.descripcion);

          if (actividad.id) {
            const url = `/api/projects/${projectId}/activities/${actividad.id}/deliveries`;
            console.log('🌐 URL de consulta:', url);

            try {
              const res = await fetch(url);
              console.log(`📡 Respuesta HTTP:`, {
                status: res.status,
                statusText: res.statusText,
                ok: res.ok,
                url: res.url,
              });

              if (res.ok) {
                const entrega: unknown = await res.json();
                console.log(`📦 Datos RAW recibidos:`, entrega);
                console.log(`📦 Tipo de datos:`, typeof entrega);
                console.log(`📦 Es array:`, Array.isArray(entrega));
                console.log(`📦 Keys del objeto:`, Object.keys(entrega ?? {}));

                // MEJORADO: Validación más exhaustiva
                if (
                  entrega &&
                  typeof entrega === 'object' &&
                  entrega !== null
                ) {
                  // Use type assertion for ProjectActivityDelivery
                  const entregaObj = entrega as ProjectActivityDelivery;
                  // Log de cada campo importante
                  console.log(`📋 Análisis detallado de entrega:`, {
                    id: entregaObj.id,
                    entregado: entregaObj.entregado,
                    aprobado: entregaObj.aprobado,
                    documentKey: entregaObj.documentKey,
                    imageKey: entregaObj.imageKey,
                    videoKey: entregaObj.videoKey,
                    compressedFileKey: entregaObj.compressedFileKey,
                    comentario: entregaObj.comentario,
                    feedback: entregaObj.feedback,
                    userId: entregaObj.userId,
                    activityId: entregaObj.activityId,
                    createdAt: entregaObj.createdAt,
                    updatedAt: entregaObj.updatedAt,
                  });

                  // Verificar múltiples indicadores de entrega válida
                  const tieneId = Boolean('id' in entregaObj && entregaObj.id);
                  const tieneArchivos = Boolean(
                    ('documentKey' in entregaObj && entregaObj.documentKey) ??
                      ('imageKey' in entregaObj && entregaObj.imageKey) ??
                      ('videoKey' in entregaObj && entregaObj.videoKey) ??
                      ('compressedFileKey' in entregaObj &&
                        entregaObj.compressedFileKey)
                  );
                  const tieneComentario = Boolean(
                    'comentario' in entregaObj &&
                      typeof entregaObj.comentario === 'string' &&
                      entregaObj.comentario.trim() !== ''
                  );
                  const tieneEstadoEntregado = Boolean(
                    'entregado' in entregaObj &&
                      (entregaObj.entregado === true ||
                        entregaObj.entregado === 1 ||
                        entregaObj.entregado === '1')
                  );
                  const tieneEstadoAprobacion =
                    'aprobado' in entregaObj &&
                    entregaObj.aprobado !== undefined &&
                    entregaObj.aprobado !== null;

                  console.log(`🔍 Validaciones individuales:`, {
                    tieneId,
                    tieneArchivos,
                    tieneComentario,
                    tieneEstadoEntregado,
                    tieneEstadoAprobacion,
                  });

                  const esEntregaValida =
                    tieneId ||
                    tieneArchivos ||
                    tieneComentario ||
                    tieneEstadoEntregado ||
                    tieneEstadoAprobacion;

                  console.log(`✅ ¿Es entrega válida?:`, esEntregaValida);

                  if (esEntregaValida) {
                    // Normalizar y limpiar datos
                    const entregaNormalizada: ProjectActivityDelivery = {
                      ...entregaObj,
                      entregado: Boolean(
                        entregaObj.entregado === true ||
                          entregaObj.entregado === 1 ||
                          entregaObj.entregado === '1' ||
                          tieneArchivos ||
                          tieneComentario
                      ),
                      aprobado:
                        entregaObj.aprobado === true ||
                        entregaObj.aprobado === 1 ||
                        entregaObj.aprobado === '1'
                          ? true
                          : entregaObj.aprobado === false ||
                              entregaObj.aprobado === 0 ||
                              entregaObj.aprobado === '0'
                            ? false
                            : null,
                      documentKey:
                        'documentKey' in entregaObj
                          ? (entregaObj.documentKey ?? null)
                          : null,
                      imageKey:
                        'imageKey' in entregaObj
                          ? (entregaObj.imageKey ?? null)
                          : null,
                      videoKey:
                        'videoKey' in entregaObj
                          ? (entregaObj.videoKey ?? null)
                          : null,
                      compressedFileKey:
                        'compressedFileKey' in entregaObj
                          ? (entregaObj.compressedFileKey ?? null)
                          : null,
                      comentario:
                        'comentario' in entregaObj
                          ? (entregaObj.comentario ?? '')
                          : '',
                      feedback:
                        'feedback' in entregaObj
                          ? (entregaObj.feedback ?? null)
                          : null,
                    };

                    entregas[actividad.id] = entregaNormalizada;
                    resultadosCarga.push({
                      actividadId: actividad.id,
                      estado: 'ENCONTRADA',
                      datos: entregaNormalizada,
                    });
                  } else {
                    resultadosCarga.push({
                      actividadId: actividad.id,
                      estado: 'DATOS_INSUFICIENTES',
                      datos: entregaObj,
                    });
                    console.log(
                      `❌ Entrega con datos insuficientes:`,
                      entregaObj
                    );
                  }
                } else {
                  resultadosCarga.push({
                    actividadId: actividad.id,
                    estado: 'RESPUESTA_INVALIDA',
                    datos: entrega,
                  });
                  console.log(
                    `❌ Respuesta inválida para actividad ${actividad.id}:`,
                    entrega
                  );
                }
              } else {
                const errorText = await res.text();
                resultadosCarga.push({
                  actividadId: actividad.id,
                  estado: `ERROR_HTTP_${res.status}`,
                });
                console.log(
                  `❌ Error HTTP ${res.status} para actividad ${actividad.id}:`,
                  errorText
                );
              }
            } catch (fetchError) {
              resultadosCarga.push({
                actividadId: actividad.id,
                estado: 'ERROR_FETCH',
              });
              console.error(
                `❌ Error fetch para actividad ${actividad.id}:`,
                fetchError
              );
            }
          } else {
            resultadosCarga.push({
              actividadId: 0,
              estado: 'SIN_ID',
            });
            console.log('⚠️ Actividad sin ID:', actividad);
          }
        }

        console.log('\n📊 === RESUMEN FINAL DE CARGA ===');
        console.log('📋 Resultados por actividad:', resultadosCarga);
        console.log('📊 Total actividades procesadas:', resultadosCarga.length);
        console.log('✅ Entregas encontradas:', Object.keys(entregas).length);
        console.log('📦 Entregas finales:', entregas);

        // Actualizar estado y forzar re-render
        console.log('🔄 Actualizando estado de entregas...');
        setEntregasActividades(entregas);

        // Log del estado después de la actualización
        setTimeout(() => {
          console.log('🔍 Estado después de actualización:', entregas);
          console.log('🔄 Forzando re-render adicional...');
          setEntregasActividades((prev) => {
            console.log('🔄 Estado previo en re-render:', prev);
            return { ...prev };
          });
        }, 100);
      } catch (error) {
        console.error('❌ === ERROR GENERAL EN CARGA DE ENTREGAS ===');
        console.error('Error completo:', error);
        console.error('Stack trace:', (error as Error)?.stack);
      }
    };

    fetchEntregas();
  }, [projectId, actividadesProyecto, isLoaded, user?.id, project]);

  // --- NUEVO: Estado y lógica para ciclo imagen/video ---
  const [showImage, setShowImage] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (project?.coverImageKey && project?.coverVideoKey) {
      if (showImage) {
        // Mostrar imagen por 20 segundos, luego mostrar video
        timer = setTimeout(() => {
          setShowImage(false);
        }, 20000);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showImage, project?.coverImageKey, project?.coverVideoKey]);

  // Cuando el video termina, volver a mostrar la imagen
  const handleVideoEnded = () => {
    setShowImage(true);
    // Reiniciar el video para la próxima vez
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // --- RENDER ---
  // Mostrar loading mientras Clerk carga
  if (!isLoaded || loading) {
    return <Loading />;
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-800 text-white">
        Proyecto no encontrado
      </div>
    );
  }

  // Añade esta función utilitaria antes del return principal:
  function formatFechaDDMMYYYY(fecha?: string) {
    if (!fecha) return '';
    // Si viene en formato ISO (yyyy-mm-ddTHH:MM:SS...), toma solo la parte de la fecha
    const datePart = fecha.includes('T') ? fecha.split('T')[0] : fecha;
    const [yyyy, mm, dd] = datePart.split('-');
    if (yyyy && mm && dd) {
      return `${dd} - ${mm} - ${yyyy}`;
    }
    return fecha;
  }

  return (
    <div className="min-h-screen bg-[#01142B] bg-gradient-to-br from-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#041C3C] shadow-md">
        <Header />
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="sticky top-[175px] z-40 -mx-6 bg-slate-800/1 px-6 pb-2">
          <Button
            variant="ghost"
            className="group mb-4 rounded-md border border-white bg-slate-800 font-bold text-cyan-400 shadow-lg transition-all duration-200 hover:scale-105 hover:border-cyan-400 hover:bg-cyan-950/60 hover:text-cyan-300 focus:scale-105 active:scale-100"
            onClick={() => router.push('/proyectos/MisProyectos')}
            style={{ borderWidth: 2 }}
          >
            {/* Custom SVG for a thicker arrow */}
            <svg
              className="mr-2 h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1 group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Project Image and Basic Info */}
          <div className="xl:col-span-1">
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-6">
                <div className="mb-4 flex w-full items-center justify-center rounded-lg bg-slate-700/50">
                  {/* Mostrar imagen 20s, luego video autoplay, repetir ciclo */}
                  {project.coverImageKey && project.coverVideoKey ? (
                    showImage ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`}
                        alt={project.name}
                        width={500}
                        height={500}
                        style={{
                          width: '600px',
                          height: 'auto',
                          borderRadius: '0.5rem',
                          maxWidth: '100%',
                          display: 'block',
                          margin: '0 auto',
                        }}
                        layout="responsive"
                        className="h-auto w-full max-w-[500px] rounded-lg object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        controls={true}
                        muted={true}
                        width={250}
                        height={250}
                        style={{
                          width: '300px',
                          height: 'auto',
                          borderRadius: '0.5rem',
                          maxWidth: '100%',
                          display: 'block',
                          margin: '0 auto',
                        }}
                        poster={
                          project.coverImageKey
                            ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`
                            : undefined
                        }
                        onEnded={handleVideoEnded}
                      >
                        <source
                          src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverVideoKey}`}
                          type="video/mp4"
                        />
                        Tu navegador no soporta la reproducción de video.
                      </video>
                    )
                  ) : project.coverVideoKey ? (
                    <video
                      controls
                      width={250}
                      height={250}
                      style={{
                        width: '250px',
                        height: 'auto',
                        borderRadius: '0.5rem',
                        maxWidth: '100%',
                        display: 'block',
                        margin: '0 auto',
                      }}
                      poster={
                        project.coverImageKey
                          ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`
                          : undefined
                      }
                    >
                      <source
                        src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverVideoKey}`}
                        type="video/mp4"
                      />
                      Tu navegador no soporta la reproducción de video.
                    </video>
                  ) : project.coverImageKey && !imageError ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`}
                      alt={project.name}
                      width={250}
                      height={250}
                      layout="responsive"
                      className="h-auto w-full max-w-[250px] rounded-lg object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="text-6xl text-slate-500">📊</div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h2 className="mb-2 text-xl font-bold break-words hyphens-auto text-teal-400 md:text-2xl">
                      {project.name}
                    </h2>
                    <p className="text-sm break-words text-gray-300 md:text-base">
                      Tipo de Proyecto:{' '}
                      <span className="break-words text-white">
                        {project.type_project}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-sm text-gray-400">Categoría:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="max-w-full truncate bg-blue-600 text-xs hover:bg-blue-700">
                        {_categoria?.name ?? 'Sin categoría'}
                      </Badge>
                      <Badge className="bg-green-600 text-xs hover:bg-green-700">
                        Creado{' '}
                        {formatFechaDDMMYYYY(project.createdAt)
                          // ? new Date(project.createdAt).toLocaleDateString()
                          // : ''
                          }
                      </Badge>
                      <Badge className="bg-teal-600 text-xs hover:bg-teal-700">
                        Actualizado{' '}
                        {formatFechaDDMMYYYY(project.updatedAt)
                          // ? new Date(project.updatedAt).toLocaleDateString()
                          // : ''
                          }
                      </Badge>
                      <Badge
                        className="transition-colores flex cursor-pointer items-center gap-1 bg-purple-600 text-xs hover:bg-purple-700"
                        onClick={() => setIsModalOpen(true)}
                      >
                        <Users className="h-3 w-3 flex-shrink-0" />
                        {inscritos} Integrantes
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="min-w-0 break-words">
                        Fecha de inicio:{' '}
                        {formatFechaDDMMYYYY(project.fecha_inicio)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span className="min-w-0 break-words">
                        Fecha de fin: {formatFechaDDMMYYYY(project.fecha_fin)}
                      </span>
                    </div>
                  </div>

                  {/* Mostrar comentario público si el proyecto es público y existe */}
                  {project.isPublic && project.publicComment && (
                    <div className="mt-4 rounded bg-blue-900/60 p-3">
                      <div className="mb-1 text-xs font-semibold text-blue-300">
                        Comentario al publicar:
                      </div>
                      <div className="text-sm break-words whitespace-pre-line text-blue-100">
                        {project.publicComment}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Details */}
          <div className="space-y-6 xl:col-span-2">
            {/* Responsible and Actions */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-4 md:p-6">
                <div className="mb-4 flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                  <div className="min-w-0 flex-1 pr-4">
                    <h3 className="mb-1 text-lg font-semibold break-words hyphens-auto text-white">
                      Responsable del Proyecto
                    </h3>
                    <p className="truncate break-words text-teal-400">
                      {responsable}
                    </p>
                  </div>
                </div>
                {/* Actions Section - Responsive Layout */}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-shrink-0">
                  {puedeEditarProyecto() && (
                    <Button
                      className="relative truncate bg-purple-600 text-xs hover:bg-purple-700 sm:text-sm"
                      size="sm"
                      onClick={() => setModalSolicitudesOpen(true)}
                    >
                      <Users className="mr-1 h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                      <span className="truncate sm:inline">Solicitudes</span>
                      {solicitudesPendientes > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white sm:h-5 sm:w-5">
                          {solicitudesPendientes}
                        </span>
                      )}
                    </Button>
                  )}

                  {/* Botón Publicar/Despublicar */}
                  {puedeEditarProyecto() &&
                    (project.isPublic ? (
                      <Button
                        className="flex items-center gap-1 truncate bg-yellow-600 text-xs hover:bg-yellow-700 sm:text-sm"
                        size="sm"
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              `/api/projects/${projectId}`,
                              {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  isPublic: false,
                                  publicComment: '',
                                }),
                              }
                            );
                            if (res.ok) {
                              await reloadProject();
                            }
                          } catch (_e) {
                            // Manejo de error opcional
                          }
                        }}
                        title="Despublicar proyecto"
                      >
                        <EyeOff className="h-4 w-4" />
                        <span className="truncate">Despublicar</span>
                      </Button>
                    ) : (
                      <Button
                        className="flex items-center gap-1 truncate bg-green-600 text-xs hover:bg-green-700 sm:text-sm"
                        size="sm"
                        onClick={() => setModalPublicarOpen(true)}
                        title="Publicar proyecto"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="truncate">Publicar</span>
                      </Button>
                    ))}

                  {/* Botones originales: Editar y Eliminar */}
                  {puedeEditarProyecto() && (
                    <>
                      <Button
                        className="truncate bg-teal-600 text-xs hover:bg-teal-700 sm:text-sm"
                        size="sm"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <svg
                          className="mr-1 h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                        <span className="hidden truncate sm:inline">
                          Editar Proyecto
                        </span>
                        <span className="truncate sm:hidden">Editar</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="truncate text-xs sm:text-sm"
                        onClick={() => setConfirmOpen(true)}
                      >
                        <Trash2 className="mr-1 h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                        <span className="truncate sm:inline">Eliminar</span>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Problem Statement */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg text-white md:text-xl">
                  Planteamiento del Problema
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6">
                <p className="overflow-wrap-anywhere text-sm break-words hyphens-auto whitespace-pre-wrap text-gray-300 md:text-base">
                  {project.planteamiento}
                </p>
              </CardContent>
            </Card>

            {/* Justification and General Objective */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg text-white md:text-xl">
                    Justificación
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6">
                  <p className="overflow-wrap-anywhere text-sm break-words hyphens-auto whitespace-pre-wrap text-gray-300 md:text-base">
                    {project.justificacion}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg text-white md:text-xl">
                    Objetivo General
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6">
                  <p className="overflow-wrap-anywhere text-sm break-words hyphens-auto whitespace-pre-wrap text-gray-300 md:text-base">
                    {project.objetivo_general}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <br />

        {/* Specific Objectives, Activities and Timeline */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white md:text-xl">
                Objetivos Específicos y Actividades
              </CardTitle>
            </div>
          </CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardContent className="p-4 md:p-6">
              <TabsContent value="horas">
                <div className="space-y-6">
                  {/* CORREGIDO: Renderizar objetivos específicos con mejor validación */}
                  {(() => {
                    console.log('🔍 === DEBUGGING OBJETIVOS ESPECÍFICOS ===');
                    console.log(
                      'project?.objetivos_especificos:',
                      project?.objetivos_especificos
                    );
                    console.log(
                      'Es array:',
                      Array.isArray(project?.objetivos_especificos)
                    );
                    console.log(
                      'Longitud:',
                      project?.objetivos_especificos?.length
                    );
                    console.log('Tipo:', typeof project?.objetivos_especificos);

                    // Verificar si existen objetivos específicos
                    if (!project?.objetivos_especificos) {
                      console.log(
                        '❌ No hay objetivos específicos en el proyecto'
                      );
                      return (
                        <div className="py-8 text-center text-gray-400 italic">
                          No hay objetivos específicos definidos para este
                          proyecto
                        </div>
                      );
                    }

                    // Si no es array, intentar convertirlo o manejarlo
                    let objetivos: ObjetivoEspecifico[] = [];
                    if (Array.isArray(project.objetivos_especificos)) {
                      objetivos =
                        project.objetivos_especificos as ObjetivoEspecifico[];
                    } else if (
                      typeof project.objetivos_especificos === 'object' &&
                      project.objetivos_especificos !== null
                    ) {
                      objetivos = Object.values(
                        project.objetivos_especificos as Record<
                          string,
                          ObjetivoEspecifico
                        >
                      );
                    }

                    if (!objetivos || objetivos.length === 0) {
                      console.log(
                        'ℹ️ Array de objetivos específicos está vacío'
                      );
                      return (
                        <div className="py-8 text-center text-gray-400 italic">
                          No hay objetivos específicos definidos para este
                          proyecto
                        </div>
                      );
                    }

                    console.log(
                      '✅ Renderizando',
                      objetivos.length,
                      'objetivos específicos'
                    );

                    return objetivos.map((obj, idx) => {
                      console.log(`🎯 Procesando objetivo ${idx}:`, obj);

                      // Determinar el título del objetivo
                      let titulo = '';
                      if (typeof obj === 'string') {
                        titulo = obj;
                      } else if (obj && typeof obj === 'object') {
                        titulo =
                          ('description' in obj &&
                          typeof obj.description === 'string'
                            ? obj.description
                            : undefined) ??
                          ('title' in obj && typeof obj.title === 'string'
                            ? obj.title
                            : undefined) ??
                          ('name' in obj && typeof obj.name === 'string'
                            ? obj.name
                            : undefined) ??
                          `Objetivo Específico ${idx + 1}`;
                      } else {
                        titulo = `Objetivo Específico ${idx + 1}`;
                      }

                      console.log(`📝 Título del objetivo ${idx}:`, titulo);

                      // Obtener actividades del objetivo
                      interface Actividad {
                        id?: number;
                        descripcion?: string;
                        meses?: number[];
                      }
                      let actividades: Actividad[] = [];
                      if (
                        obj &&
                        typeof obj === 'object' &&
                        Array.isArray(obj.actividades)
                      ) {
                        actividades = obj.actividades as Actividad[];
                      }

                      console.log(
                        `📋 Actividades del objetivo ${idx}:`,
                        actividades
                      );

                      return (
                        <div
                          key={obj.id ?? idx}
                          className="overflow-hidden rounded-lg border border-slate-600 p-4"
                        >
                          <h4 className="mb-3 text-sm font-semibold break-words hyphens-auto text-teal-400 md:text-base">
                            {titulo}
                          </h4>

                          {/* Responsive Table Container */}
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-slate-600">
                                  <TableHead className="max-w-[200px] min-w-[150px] text-xs text-gray-300 md:text-sm">
                                    ACTIVIDADES
                                  </TableHead>
                                  <TableHead className="max-w-[100px] min-w-[80px] text-xs text-gray-300 md:text-sm">
                                    ESTADO
                                  </TableHead>
                                  <TableHead className="max-w-[120px] min-w-[100px] text-xs text-gray-300 md:text-sm">
                                    RESPONSABLE
                                  </TableHead>
                                  <TableHead className="max-w-[100px] min-w-[80px] text-xs text-gray-300 md:text-sm">
                                    ENTREGAS
                                  </TableHead>
                                  <TableHead className="max-w-[150px] min-w-[120px] text-xs text-gray-300 md:text-sm">
                                    ARCHIVOS
                                  </TableHead>
                                  <TableHead className="max-w-[120px] min-w-[100px] text-xs text-gray-300 md:text-sm">
                                    MOTIVO
                                  </TableHead>
                                  <TableHead className="max-w-[180px] min-w-[150px] text-xs text-gray-300 md:text-sm">
                                    ACCIONES
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {actividades.length > 0 ? (
                                  actividades.map((act, actIdx) => {
                                    console.log(
                                      `🔧 Procesando actividad ${actIdx} del objetivo ${idx}:`,
                                      act
                                    );

                                    // Use type guard for act
                                    const actObj: Actividad =
                                      act && typeof act === 'object'
                                        ? act
                                        : {
                                            id: undefined,
                                            descripcion: undefined,
                                          };

                                    // Buscar la actividad completa en el proyecto para obtener responsibleUserId
                                    const actividadCompleta =
                                      project.actividades?.find(
                                        (projectAct) =>
                                          projectAct.id === actObj.id ||
                                          projectAct.descripcion ===
                                            actObj.descripcion
                                      );

                                    // Obtener el id de usuario responsable de la actividad
                                    const responsableUserId =
                                      actividadCompleta &&
                                      'responsibleUserId' in actividadCompleta
                                        ? actividadCompleta.responsibleUserId
                                        : undefined;

                                    // Usar el id de usuario para la consulta de usuario
                                    // (No se hace fetch aquí, solo se muestra el id o nombre si está disponible)
                                    const responsable =
                                      typeof responsableUserId === 'string' ||
                                      typeof responsableUserId === 'number'
                                        ? (integrantes.find(
                                            (i) =>
                                              String(i.id) ===
                                              String(responsableUserId)
                                          )?.nombre ?? responsableUserId)
                                        : '-';

                                    const actividadId =
                                      actividadCompleta?.id ?? actObj.id;

                                    const estadoActividad =
                                      getEstadoActividad(actividadId);

                                    return (
                                      <TableRow
                                        key={act.id ?? actIdx}
                                        className="border-slate-600"
                                      >
                                        <TableCell className="max-w-[200px] text-xs text-gray-300 md:text-sm">
                                          <div className="overflow-wrap-anywhere pr-4 leading-tight break-words hyphens-auto">
                                            {act.descripcion ??
                                              `Actividad ${actIdx + 1}`}
                                          </div>
                                        </TableCell>
                                        <TableCell className="max-w-[100px]">
                                          {(() => {
                                            switch (estadoActividad.estado) {
                                              case 'completada':
                                                return (
                                                  <Badge className="truncate bg-green-600 text-xs text-white">
                                                    <CheckCircle className="mr-1 h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">
                                                      Completada
                                                    </span>
                                                  </Badge>
                                                );
                                              case 'rechazada':
                                                return (
                                                  <Badge className="truncate bg-red-600 text-xs text-white">
                                                    <AlertCircle className="mr-1 h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">
                                                      Rechazada
                                                    </span>
                                                  </Badge>
                                                );
                                              case 'en_evaluacion':
                                                return (
                                                  <Badge className="truncate bg-blue-600 text-xs text-white">
                                                    <Clock className="mr-1 h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">
                                                      En evaluación
                                                    </span>
                                                  </Badge>
                                                );
                                              default:
                                                return (
                                                  <Badge className="truncate bg-yellow-500 text-xs text-black">
                                                    <AlertCircle className="mr-1 h-3 w-3 flex-shrink-0" />
                                                    <span className="truncate">
                                                      Pendiente
                                                    </span>
                                                  </Badge>
                                                );
                                            }
                                          })()}
                                        </TableCell>
                                        <TableCell className="max-w-[120px] text-xs text-gray-300 md:text-sm">
                                          <div
                                            className="truncate break-words"
                                            title={
                                              typeof responsable === 'string'
                                                ? responsable
                                                : String(responsable ?? '')
                                            }
                                          >
                                            {responsable}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          {/* ...existing entregas logic... */}
                                        </TableCell>
                                        <TableCell className="max-w-[150px]">
                                          {typeof actividadId === 'number' ? (
                                            <ArchivosEntrega
                                              actividadId={actividadId}
                                              entrega={
                                                entregasActividades[actividadId]
                                              }
                                            />
                                          ) : null}
                                        </TableCell>
                                        <TableCell className="max-w-[120px]">
                                          {(() => {
                                            const entrega =
                                              typeof actividadId === 'number'
                                                ? entregasActividades[
                                                    actividadId
                                                  ]
                                                : undefined;
                                            // Safe access to feedback
                                            if (
                                              !entrega ||
                                              !entrega ||
                                              typeof entrega !== 'object' ||
                                              typeof (
                                                entrega as {
                                                  feedback?: unknown;
                                                }
                                              ).feedback !== 'string' ||
                                              (
                                                (
                                                  entrega as {
                                                    feedback?: string;
                                                  }
                                                ).feedback ?? ''
                                              ).trim() === ''
                                            ) {
                                              return (
                                                <span className="truncate text-xs text-gray-500 italic">
                                                  Sin comentarios
                                                </span>
                                              );
                                            }
                                            const feedbackColor =
                                              estadoActividad.estado ===
                                              'completada'
                                                ? 'text-green-400'
                                                : estadoActividad.estado ===
                                                    'rechazada'
                                                  ? 'text-red-400'
                                                  : 'text-blue-400';
                                            const feedbackText =
                                              typeof entrega === 'object' &&
                                              entrega !== null &&
                                              !(entrega instanceof Error) &&
                                              'feedback' in entrega &&
                                              typeof (
                                                entrega as {
                                                  feedback?: unknown;
                                                }
                                              ).feedback === 'string'
                                                ? (
                                                    entrega as {
                                                      feedback: string;
                                                    }
                                                  ).feedback
                                                : '';
                                            return (
                                              <div
                                                className="max-w-[120px]"
                                                title={feedbackText}
                                              >
                                                <p
                                                  className={`text-xs ${feedbackColor} truncate break-words`}
                                                >
                                                  {feedbackText}
                                                </p>
                                              </div>
                                            );
                                          })()}
                                        </TableCell>
                                        <TableCell className="max-w-[180px]">
                                          {(() => {
                                            const entrega =
                                              typeof actividadId === 'number'
                                                ? entregasActividades[
                                                    actividadId
                                                  ]
                                                : undefined;
                                            const actividadParaPermisos =
                                              (actividadCompleta as {
                                                responsibleUserId?:
                                                  | string
                                                  | number;
                                              }) ?? act;
                                            const puedeEntregar =
                                              puedeEntregarActividad(
                                                actividadParaPermisos
                                              );
                                            const puedeAprobar =
                                              puedeAprobarEntregas();
                                            const tieneEntrega =
                                              estadoActividad.entregado;

                                            // Helper para obtener el userId seguro como string
                                            const getEntregaUserId = (
                                              entregaObj: unknown
                                            ): string => {
                                              if (
                                                entregaObj &&
                                                typeof entregaObj ===
                                                  'object' &&
                                                'userId' in entregaObj
                                              ) {
                                                const userId = (
                                                  entregaObj as {
                                                    userId?: unknown;
                                                  }
                                                ).userId;
                                                if (typeof userId === 'string')
                                                  return userId;
                                                if (typeof userId === 'number')
                                                  return String(userId);
                                              }
                                              return '';
                                            };

                                            if (tieneEntrega) {
                                              return (
                                                <div className="flex max-w-[180px] min-w-[180px] flex-col gap-1 overflow-hidden">
                                                  {puedeEntregar && (
                                                    <div className="flex flex-col gap-1 sm:flex-row">
                                                      {typeof actividadId ===
                                                        'number' && (
                                                        <Button
                                                          size="sm"
                                                          className="truncate bg-blue-600 text-xs hover:bg-blue-700"
                                                          onClick={() =>
                                                            handleAbrirModalEntrega(
                                                              {
                                                                id: actividadId,
                                                                descripcion:
                                                                  act.descripcion,
                                                              },
                                                              true
                                                            )
                                                          }
                                                        >
                                                          <span className="truncate">
                                                            {estadoActividad.estado ===
                                                            'rechazada'
                                                              ? 'Reenviar'
                                                              : 'Editar'}
                                                          </span>
                                                        </Button>
                                                      )}
                                                      {typeof actividadId ===
                                                        'number' && (
                                                        <Button
                                                          size="sm"
                                                          variant="destructive"
                                                          className="px-2 text-xs"
                                                          onClick={() =>
                                                            handleEliminarEntrega(
                                                              actividadId
                                                            )
                                                          }
                                                        >
                                                          <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                      )}
                                                    </div>
                                                  )}
                                                  {puedeAprobar &&
                                                    estadoActividad.estado !==
                                                      'completada' &&
                                                    estadoActividad.estado !==
                                                      'rechazada' && (
                                                      <div className="flex flex-col gap-1 sm:flex-row">
                                                        {typeof actividadId ===
                                                          'number' && (
                                                          <Button
                                                            size="sm"
                                                            className="truncate bg-green-600 text-xs hover:bg-green-700"
                                                            onClick={() =>
                                                              handleAprobarEntrega(
                                                                actividadId,
                                                                getEntregaUserId(
                                                                  entrega
                                                                ),
                                                                true,
                                                                'Entrega aprobada'
                                                              )
                                                            }
                                                          >
                                                            <CheckCircle className="mr-1 h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">
                                                              Aprobar
                                                            </span>
                                                          </Button>
                                                        )}
                                                        {typeof actividadId ===
                                                          'number' && (
                                                          <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="truncate text-xs"
                                                            onClick={() => {
                                                              const feedback =
                                                                prompt(
                                                                  'Motivo del rechazo:'
                                                                );
                                                              if (
                                                                typeof feedback ===
                                                                  'string' &&
                                                                feedback.trim() !==
                                                                  ''
                                                              ) {
                                                                handleAprobarEntrega(
                                                                  actividadId,
                                                                  getEntregaUserId(
                                                                    entrega
                                                                  ),
                                                                  false,
                                                                  feedback
                                                                );
                                                              }
                                                            }}
                                                          >
                                                            <AlertCircle className="mr-1 h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">
                                                              Rechazar
                                                            </span>
                                                          </Button>
                                                        )}
                                                      </div>
                                                    )}
                                                </div>
                                              );
                                            } else if (puedeEntregar) {
                                              return typeof actividadId ===
                                                'number' ? (
                                                <Button
                                                  size="sm"
                                                  className="max-w-full truncate bg-teal-600 text-xs hover:bg-teal-700"
                                                  onClick={() =>
                                                    handleAbrirModalEntrega(
                                                      {
                                                        id: actividadId,
                                                        descripcion:
                                                          act.descripcion,
                                                      },
                                                      false
                                                    )
                                                  }
                                                >
                                                  <span className="truncate">
                                                    Entregar
                                                  </span>
                                                </Button>
                                              ) : (
                                                <span className="truncate text-xs text-gray-500">
                                                  Sin permisos
                                                </span>
                                              );
                                            } else {
                                              return (
                                                <span className="truncate text-xs text-gray-500">
                                                  Sin permisos
                                                </span>
                                              );
                                            }
                                          })()}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell
                                      colSpan={7}
                                      className="py-8 text-center text-sm text-gray-400 italic"
                                    >
                                      No hay actividades agregadas para este
                                      objetivo
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Cronograma separado */}
        <br />
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-lg text-white md:text-xl">
              Cronograma
            </CardTitle>
            {/* Selector de visualización */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-300">Ver en:</span>
              <select
                value={cronogramaTipo}
                onChange={(e) =>
                  setCronogramaTipo(
                    e.target.value as 'horas' | 'dias' | 'meses'
                  )
                }
                className="rounded bg-slate-700 px-2 py-1 text-sm text-teal-300"
              >
                <option value="horas">Horas</option>
                <option value="dias">Días</option>
                <option value="meses"> Meses</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow className="border-slate-600">
                      <TableHead
                        className="sticky left-0 z-10 border-r border-slate-600 bg-slate-800 text-xs text-gray-300 md:text-sm"
                        style={{ width: '40%' }}
                      >
                        <div className="pr-4">Actividad</div>
                      </TableHead>
                      {cronogramaTipo === 'horas' ? (
                        <TableHead
                          className="text-center align-middle text-xs text-gray-300 md:text-sm"
                          style={{ width: '60%' }}
                        >
                          Duración (horas)
                        </TableHead>
                      ) : (
                        <TableHead
                          className="p-0 text-xs text-gray-300 md:text-sm"
                          style={{ width: '60%' }}
                        >
                          <div className="flex">
                            {unidadesHeader.map((unidad) => (
                              <div
                                key={unidad.indice}
                                className="min-w-[60px] flex-1 border-l border-slate-600 p-2 text-center align-middle"
                              >
                                <div className="text-xs break-words">
                                  <div>{unidad.etiqueta}</div>
                                  <div className="mt-1 text-xs text-gray-400">
                                    {unidad.fecha}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actividadesOrdenadas.map((act, idx) => {
                      return (
                        <TableRow
                          key={act.id ?? idx}
                          className="border-slate-600 transition-colors hover:bg-slate-700/60"
                        >
                          <TableCell
                            className="sticky left-0 z-10 max-w-[200px] border-r border-slate-600 bg-slate-800 text-xs text-gray-300 group-hover:bg-slate-700/60 md:text-sm"
                            style={{ width: '40%' }}
                          >
                            <div className="overflow-wrap-anywhere pr-4 leading-tight break-words hyphens-auto">
                              {act.descripcion}
                            </div>
                          </TableCell>
                          {cronogramaTipo === 'horas' ? (
                            <TableCell
                              className="text-center align-middle text-xs font-bold text-teal-300 md:text-sm"
                              style={{ width: '60%' }}
                            >
                              {act.hoursPerDay ?? '-'}
                            </TableCell>
                          ) : (
                            <TableCell className="p-0" style={{ width: '60%' }}>
                              <div className="flex">
                                {unidadesHeader.map((unidad) => (
                                  <div
                                    key={unidad.indice}
                                    className="min-w-[60px] flex-1 border-l border-slate-600 p-2 text-center align-middle"
                                  >
                                    {Array.isArray(act.meses) &&
                                    act.meses.includes(unidad.indice) ? (
                                      <div className="mx-auto h-4 w-4 rounded bg-green-600 md:h-5 md:w-5" />
                                    ) : (
                                      <div className="mx-auto h-4 w-4 rounded bg-slate-600 md:h-5 md:w-5" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <ModalCategoria
          isOpen={ModalCategoriaOpen}
          onClose={() => setModalCategoriaOpen(false)}
          categoria={_categoria}
        />
        <ModalIntegrantesProyectoInfo
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          proyecto={{
            ...project,
            titulo: project.name ?? '',
            rama: _categoria?.name ?? 'Sin categoría',
            especialidades: integrantes.length,
            participacion: 'Activa',
          }}
          integrantes={integrantes.map((integrante) => ({
            id: integrante.id,
            nombre: integrante.nombre || 'Sin nombre',
            rol: integrante.rol || 'Integrante',
            especialidad: integrante.especialidad || 'No especificada',
            email: integrante.email || '',
          }))}
        />
        <ModalConfirmacionEliminacion
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          projectId={projectId}
        />
        <ModalResumen
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          titulo={project.name}
          planteamiento={project.planteamiento}
          justificacion={project.justificacion}
          objetivoGen={project.objetivo_general}
          objetivosEsp={
            Array.isArray(project.objetivos_especificos)
              ? project.objetivos_especificos.map((obj) => ({
                  id: String(
                    typeof obj === 'object' && obj !== null && 'id' in obj
                      ? obj.id
                      : ''
                  ),
                  title:
                    typeof obj === 'object' &&
                    obj !== null &&
                    'description' in obj
                      ? ((obj as { description?: string }).description ?? '')
                      : '',
                  activities:
                    typeof obj === 'object' &&
                    obj !== null &&
                    Array.isArray(
                      (obj as { actividades?: unknown }).actividades
                    )
                      ? (obj as { actividades?: unknown[] }).actividades!.map(
                          (act) =>
                            typeof act === 'object' &&
                            act !== null &&
                            'descripcion' in act &&
                            typeof (act as { descripcion?: string })
                              .descripcion === 'string'
                              ? (act as { descripcion: string }).descripcion
                              : ''
                        )
                      : [],
                }))
              : []
          }
          actividades={
            Array.isArray(project.actividades)
              ? project.actividades.map((a) => ({
                  descripcion:
                    typeof a.descripcion === 'string' ? a.descripcion : '',
                  meses: Array.isArray(a.meses) ? a.meses : [],
                  objetivoId:
                    typeof (a as { objetivoId?: string }).objetivoId ===
                    'string'
                      ? (a as { objetivoId?: string }).objetivoId
                      : undefined,
                  responsibleUserId:
                    typeof (a as { responsibleUserId?: string })
                      .responsibleUserId === 'string'
                      ? (a as { responsibleUserId: string }).responsibleUserId
                      : undefined,
                  hoursPerDay:
                    typeof (a as { hoursPerDay?: number }).hoursPerDay ===
                    'number'
                      ? (a as { hoursPerDay: number }).hoursPerDay
                      : undefined,
                }))
              : []
          }
          categoriaId={project.categoryId}
          numMeses={0}
          setActividades={noop} // <-- función estable
          setObjetivosEsp={noop} // <-- función estable
          projectId={project.id}
          coverImageKey={project.coverImageKey ?? undefined}
          tipoProyecto={project.type_project ?? undefined}
          tipoVisualizacion={
            project.tipo_visualizacion === 'dias'
              ? 'dias'
              : project.tipo_visualizacion === 'meses'
                ? 'meses'
                : 'meses'
          }
          fechaInicio={project.fecha_inicio ?? undefined}
          fechaFin={project.fecha_fin ?? undefined}
        />

        {/* Modal de entrega de actividad */}
        <ModalEntregaActividad
          isOpen={modalEntregaOpen}
          onClose={() => {
            setModalEntregaOpen(false);
            setActividadSeleccionada(null);
            setModoEdicion(false);
            setDatosEntregaEdicion({ archivos: [], comentario: '' });
          }}
          onSubmit={(
            documentFile,
            imageFile,
            videoFile,
            compressedFile,
            comentario
          ) =>
            handleEntregarActividad(
              documentFile,
              imageFile,
              videoFile,
              compressedFile,
              comentario
            )
          }
          loading={entregaLoading}
          isEditing={modoEdicion}
          activityName={actividadSeleccionada?.descripcion}
          archivosEntregaEdicion={datosEntregaEdicion.archivos}
        />
        {/* Modal de solicitudes de participación */}
        <ModalSolicitudesParticipacion
          isOpen={modalSolicitudesOpen}
          onClose={() => setModalSolicitudesOpen(false)}
          projectId={projectId}
          userId={user?.id ?? ''} // <-- nunca undefined
          onSolicitudProcesada={recargarSolicitudesPendientes}
        />
        {/* Modal para publicar proyecto con comentario */}
        <ModalPublicarProyecto
          isOpen={modalPublicarOpen}
          onClose={async () => {
            setModalPublicarOpen(false);
            await reloadProject();
          }}
          comentario={comentarioPublicar}
          setComentario={setComentarioPublicar}
          onConfirm={handleConfirmarPublicarProyecto}
          loading={publicandoProyecto}
        />
      </div>
      {/* Scrollbar color personalizado */}
      <style jsx global>{`
        /* Oculta el scroll global del html/body */
        html,
        body {
          scrollbar-width: thin !important; /* Firefox */
          scrollbar-color: #0f3a6e #041c3c;
          -ms-overflow-style: none !important; /* IE 10+ */
        }

        /* Estilos para el scroll en WebKit (Chrome, Safari) */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          html {
            overflow: -moz-scrollbars-vertical;
            scrollbar-width: thin;
          }
          body {
            overflow-y: scroll;
            scrollbar-width: thin;
          }
        }

        /* Estilos específicos para el scrollbar en Chrome/Safari */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #041c3c;
          }
          ::-webkit-scrollbar-thumb {
            background-color: #0f3a6e;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background-color: #0a2e4d;
          }
        }
      `}</style>
    </div>
  );
}
