'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs'; // Importar useUser de Clerk
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Edit,
  Trash2,
  Download,
} from 'lucide-react';
import { Header } from '~/components/estudiantes/layout/Header';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '~/components/projects/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/projects/ui/card';
import { Badge } from '~/components/projects/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '~/components/projects/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/projects/ui/table';

import ModalCategoria from '../../../../components/projects/Modals/ModalCategoria';
import ModalConfirmacionEliminacion from '../../../../components/projects/Modals/ModalConfirmacionEliminacion';
import ModalIntegrantesProyectoInfo from '../../../../components/projects/Modals/ModalIntegrantesProyectoInfo';
import ModalResumen from '../../../../components/projects/Modals/ModalResumen';
import ModalEntregaActividad from '~/components/projects/Modals/ModalEntregaActividad';
import {
  getProjectById,
  ProjectDetail,
} from '~/server/actions/project/getProjectById';
import { Category } from '~/types';

export default function ProjectDetails() {
  const { user, isLoaded } = useUser(); // Usar Clerk para obtener usuario
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params?.id);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [integrantes, setIntegrantes] = useState<any[]>([]);

  // Nuevo estado para userId - ahora usando Clerk
  const [userId, setUserId] = useState<string>('');

  // Estado para usuarios responsables
  const [usersResponsables, setUsersResponsables] = useState<
    { id: string; name: string }[]
  >([]);

  // Estado para el tipo de visualización del cronograma
  const [cronogramaTipo, setCronogramaTipo] = useState<
    'horas' | 'dias' | 'meses'
  >('horas');

  // Estado para entregas de actividades
  const [entregasActividades, setEntregasActividades] = useState<
    Record<number, any>
  >({});

  // Obtener userId de Clerk cuando esté disponible
  useEffect(() => {
    if (isLoaded && user) {
      setUserId(user.id);
      console.log('Usuario logueado:', user.id); // Debug
    }
  }, [isLoaded, user]);

  // Obtener todos los usuarios responsables al cargar el componente
  useEffect(() => {
    async function fetchResponsables() {
      try {
        const res = await fetch('/api/projects/UsersResponsable');
        if (res.ok) {
          const data = await res.json();
          setUsersResponsables(Array.isArray(data) ? data : []);
        }
      } catch {
        setUsersResponsables([]);
      }
    }
    fetchResponsables();
  }, []);

  useEffect(() => {
    console.log('useEffect DetalleProyectoPage ejecutado');
    if (!projectId || !isLoaded) return; // Esperar a que Clerk cargue

    (async () => {
      setLoading(true);
      const data = await getProjectById(projectId);
      setProject(data);
      setLoading(false);

      console.log('Proyecto cargado:', data); // Debug
      console.log('Usuario logueado ID:', userId); // Debug
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

      // Obtener integrantes inscritos
      const fetchIntegrantes = async () => {
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
              const integrantesConInfo = await Promise.all(
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
                    id =
                      typeof (idValue as { id?: unknown })?.id === 'string' ||
                      typeof (idValue as { id?: unknown })?.id === 'number'
                        ? (idValue as { id?: string | number }).id!
                        : '';
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

                  const integranteFinal = {
                    id,
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
      };
      fetchIntegrantes();
    })();
  }, [projectId, isLoaded, userId]); // Agregar isLoaded y userId como dependencias

  // Construir la URL de la imagen usando la misma lógica que en la página de proyectos
  const projectImageUrl = React.useMemo(() => {
    if (!project?.coverImageKey) return null;

    // Usar la misma lógica que en la página de proyectos
    return `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`;
  }, [project?.coverImageKey]);

  // Detectar el tipo de cronograma usando el campo tipo_visualizacion si existe
  const cronogramaInfo = React.useMemo(() => {
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
  }, [project]);

  // Genera las cabeceras según el tipo seleccionado y las fechas reales del proyecto
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

      let i = 0;
      let fechaActual = new Date(fechaInicio);
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

  // Publicar o despublicar proyecto
  const handleTogglePublicarProyecto = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: !project?.isPublic }),
      });
      if (res.ok) {
        setProject((prev) =>
          prev ? { ...prev, isPublic: !prev.isPublic } : prev
        );
      } else {
        alert('No se pudo actualizar el estado público del proyecto');
      }
    } catch {
      alert('Error al actualizar el estado público del proyecto');
    }
  };

  // Define una interfaz para el proyecto actualizado
  interface UpdatedProjectData {
    name?: string;
    planteamiento?: string;
    justificacion?: string;
    objetivo_general?: string;
    objetivos_especificos?: string[];
    actividades?: {
      id?: number;
      descripcion: string;
      meses: number[];
      responsibleUserId?: string;
      hoursPerDay?: number;
    }[];
    type_project?: string;
    categoryId?: number;
    coverImageKey?: string;
    fechaInicio?: string;
    fechaFin?: string;
    tipoVisualizacion?: 'meses' | 'dias';
  }

  // Validación similar a la creación de proyecto
  const validateProjectData = (data: UpdatedProjectData) => {
    console.log('Validando datos del proyecto:', data);
    if (
      !data.name ||
      !data.planteamiento ||
      !data.justificacion ||
      !data.objetivo_general ||
      !data.fechaInicio ||
      !data.fechaFin ||
      !data.type_project ||
      !data.categoryId ||
      !data.objetivos_especificos ||
      data.objetivos_especificos.length === 0 ||
      !data.actividades ||
      data.actividades.length === 0
    ) {
      console.warn('Validación fallida: faltan campos requeridos', data);
      alert(
        'Por favor completa todos los campos requeridos, incluyendo título, categoría, planteamiento, justificación, objetivo general, fechas, al menos un objetivo específico y una actividad.'
      );
      return false;
    }
    if (new Date(data.fechaInicio) > new Date(data.fechaFin)) {
      console.warn(
        'Validación fallida: fecha de inicio mayor a fecha de fin',
        data.fechaInicio,
        data.fechaFin
      );
      alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return false;
    }
    console.log('Validación exitosa');
    return true;
  };

  const handleUpdateProject = (updatedProjectData: UpdatedProjectData) => {
    console.log('Datos recibidos para actualizar:', updatedProjectData);
    // Validar antes de actualizar
    if (!validateProjectData(updatedProjectData)) return;

    setProject((prev) => {
      if (!prev) return prev;

      let objetivos_especificos = prev.objetivos_especificos;
      // Si updatedProjectData.objetivos_especificos es un array de string, conviértelo a la estructura esperada
      if (
        Array.isArray(updatedProjectData.objetivos_especificos) &&
        updatedProjectData.objetivos_especificos.length > 0 &&
        typeof updatedProjectData.objetivos_especificos[0] === 'string'
      ) {
        objetivos_especificos = updatedProjectData.objetivos_especificos.map(
          (desc, idx) => ({
            id: idx,
            description: desc,
            actividades: [],
          })
        );
      } else if (
        Array.isArray(updatedProjectData.objetivos_especificos) &&
        typeof updatedProjectData.objetivos_especificos[0] === 'object'
      ) {
        objetivos_especificos =
          updatedProjectData.objetivos_especificos as unknown as typeof prev.objetivos_especificos;
      }

      // Asegura que cada actividad tenga un id y los campos opcionales
      const actividadesActualizadas = updatedProjectData.actividades
        ? updatedProjectData.actividades.map((act, idx) => ({
            id: act.id ?? idx,
            descripcion: act.descripcion,
            meses: act.meses || [],
            responsibleUserId: act.responsibleUserId ?? null,
            hoursPerDay: act.hoursPerDay ?? null,
          }))
        : prev.actividades;

      const updatedProject: ProjectDetail = {
        ...prev,
        name: updatedProjectData.name ?? prev.name,
        planteamiento: updatedProjectData.planteamiento ?? prev.planteamiento,
        justificacion: updatedProjectData.justificacion ?? prev.justificacion,
        objetivo_general:
          updatedProjectData.objetivo_general ?? prev.objetivo_general,
        objetivos_especificos,
        actividades: actividadesActualizadas,
        type_project: updatedProjectData.type_project ?? prev.type_project,
        categoryId: updatedProjectData.categoryId ?? prev.categoryId,
        coverImageKey: updatedProjectData.coverImageKey ?? prev.coverImageKey,
        fecha_inicio: updatedProjectData.fechaInicio ?? prev.fecha_inicio,
        fecha_fin: updatedProjectData.fechaFin ?? prev.fecha_fin,
        tipo_visualizacion:
          updatedProjectData.tipoVisualizacion ?? prev.tipo_visualizacion,
        updatedAt: new Date().toISOString(),
      };

      console.log('Proyecto actualizado en setProject:', updatedProject);
      return updatedProject;
    });
  };

  // Mapa de actividades por id para acceso rápido
  const actividadesPorId = React.useMemo(() => {
    const map: Record<string, any> = {};
    if (project?.actividades) {
      project.actividades.forEach((act) => {
        if (act.id !== undefined) {
          map[String(act.id)] = act;
        }
      });
    }
    return map;
  }, [project?.actividades]);

  // Helper para obtener el nombre del responsable usando el id o descripción
  function getResponsableNombrePorId(
    id?: number | string | null,
    descripcion?: string
  ) {
    if (id) {
      const act = actividadesPorId[String(id)];
      if (act && act.responsibleUserId) {
        const responsable = usersResponsables.find(
          (u) => String(u.id) === String(act.responsibleUserId)
        );
        return responsable?.name ?? '-';
      }
    }
    // Fallback: buscar por descripción si no hay id
    if (descripcion) {
      const act = Object.values(actividadesPorId).find(
        (a) => a.descripcion === descripcion
      );
      if (act && act.responsibleUserId) {
        const responsable = usersResponsables.find(
          (u) => String(u.id) === String(act.responsibleUserId)
        );
        return responsable?.name ?? '-';
      }
    }
    return '-';
  }

  // Calcular la duración de cada actividad (por ejemplo, cantidad de meses/días)
  const duracionesActividad: Record<string, number> = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (project && Array.isArray(project.objetivos_especificos)) {
      project.objetivos_especificos.forEach((obj, objIdx) => {
        if (Array.isArray(obj.actividades)) {
          obj.actividades.forEach((act: any, actIdx: number) => {
            const key =
              typeof act.id !== 'undefined' ? String(act.id) : String(actIdx);
            // Duración: cantidad de elementos en act.meses (puede ser días o meses según tipo)
            map[key] = Array.isArray(act.meses) ? act.meses.length : 0;
          });
        }
      });
    }
    return map;
  }, [project]);

  // Helper para obtener el índice del objetivo y actividad
  function getOrdenActividad(act: any) {
    if (!project?.objetivos_especificos)
      return { objetivo: 9999, actividad: 9999 };
    for (let i = 0; i < project.objetivos_especificos.length; i++) {
      const obj = project.objetivos_especificos[i];
      if (Array.isArray(obj.actividades)) {
        for (let j = 0; j < obj.actividades.length; j++) {
          const a = obj.actividades[j];
          // Compara por id si existe, si no por descripción
          if (
            ('id' in a &&
              'id' in act &&
              a.id !== undefined &&
              act.id !== undefined &&
              String(a.id) === String(act.id)) ||
            (a.descripcion &&
              act.descripcion &&
              a.descripcion === act.descripcion)
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
      const ordenA = getOrdenActividad(a);
      const ordenB = getOrdenActividad(b);
      if (ordenA.objetivo !== ordenB.objetivo) {
        return ordenA.objetivo - ordenB.objetivo;
      }
      return ordenA.actividad - ordenB.actividad;
    });
  }, [project?.actividades, project?.objetivos_especificos]);

  // Estado y funciones para el modal de entrega de actividad
  const [modalEntregaOpen, setModalEntregaOpen] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<{
    id?: number;
    descripcion?: string;
  } | null>(null);
  const [entregaLoading, setEntregaLoading] = useState(false);
  // Nuevos estados para modo edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEntregaEdicion, setDatosEntregaEdicion] = useState<{
    archivos: {
      name: string;
      url: string;
      type: 'document' | 'image' | 'video' | 'compressed';
    }[];
    comentario: string;
  }>({ archivos: [], comentario: '' });

  const handleAbrirModalEntrega = (
    actividad: {
      id?: number;
      descripcion?: string;
    },
    esEdicion: boolean = false
  ) => {
    console.log(
      '🎯 Abriendo modal para actividad:',
      actividad,
      'Edición:',
      esEdicion
    );

    // Buscar la actividad completa en el proyecto para asegurar que tenga ID
    let actividadCompleta = actividad;

    if (!actividad.id && actividad.descripcion) {
      // Si no tiene ID, buscar por descripción en todas las actividades del proyecto
      const actividadEncontrada = project?.actividades?.find(
        (act) => act.descripcion === actividad.descripcion
      );

      if (actividadEncontrada) {
        actividadCompleta = {
          id: actividadEncontrada.id,
          descripcion: actividadEncontrada.descripcion,
        };
        console.log(
          '✅ Actividad encontrada por descripción:',
          actividadCompleta
        );
      } else {
        console.error(
          '❌ No se encontró actividad con descripción:',
          actividad.descripcion
        );
        alert('Error: No se pudo identificar la actividad');
        return;
      }
    }

    if (!actividadCompleta.id) {
      console.error('❌ La actividad no tiene ID válido:', actividadCompleta);
      alert('Error: La actividad seleccionada no tiene un ID válido');
      return;
    }

    console.log('✅ Actividad seleccionada correctamente:', actividadCompleta);
    setActividadSeleccionada(actividadCompleta);
    setModoEdicion(esEdicion);

    // Si es modo edición, preparar los datos existentes
    if (esEdicion && actividadCompleta.id) {
      const entregaExistente = entregasActividades[actividadCompleta.id];
      if (entregaExistente) {
        const archivos: {
          name: string;
          url: string;
          type: 'document' | 'image' | 'video' | 'compressed';
        }[] = [];

        // Agregar archivos existentes con sus URLs de descarga
        if (entregaExistente.documentKey) {
          archivos.push({
            name: entregaExistente.documentName || 'Documento',
            url: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${entregaExistente.documentKey}`,
            type: 'document',
          });
        }
        if (entregaExistente.imageKey) {
          archivos.push({
            name: entregaExistente.imageName || 'Imagen',
            url: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${entregaExistente.imageKey}`,
            type: 'image',
          });
        }
        if (entregaExistente.videoKey) {
          archivos.push({
            name: entregaExistente.videoName || 'Video',
            url: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${entregaExistente.videoKey}`,
            type: 'video',
          });
        }
        if (entregaExistente.compressedFileKey) {
          archivos.push({
            name: entregaExistente.compressedFileName || 'Archivo comprimido',
            url: `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${entregaExistente.compressedFileKey}`,
            type: 'compressed',
          });
        }

        setDatosEntregaEdicion({
          archivos,
          comentario: entregaExistente.comentario || '',
        });
      }
    } else {
      // Limpiar datos de edición si no es modo edición
      setDatosEntregaEdicion({ archivos: [], comentario: '' });
    }

    setModalEntregaOpen(true);
  };

  // Función para verificar si el usuario puede entregar una actividad específica
  const puedeEntregarActividad = React.useCallback(
    (actividad: any) => {
      if (!userId || !project || !isLoaded) {
        console.log('No puede entregar - falta información:', {
          userId,
          project: !!project,
          isLoaded,
        });
        return false;
      }

      console.log('Verificando permisos entrega:', {
        userId,
        projectUserId: project.userId,
        activityResponsibleId: actividad.responsibleUserId,
        esResponsableProyecto: project.userId === userId,
        esResponsableActividad: actividad.responsibleUserId === userId,
      });

      // El responsable del proyecto puede entregar cualquier actividad
      if (project.userId === userId) {
        console.log('Puede entregar: es responsable del proyecto');
        return true;
      }

      // El responsable de la actividad específica puede entregarla
      if (actividad.responsibleUserId === userId) {
        console.log('Puede entregar: es responsable de la actividad');
        return true;
      }

      console.log('No puede entregar: no es responsable');
      return false;
    },
    [userId, project, isLoaded]
  );

  // Función para verificar si el usuario puede aprobar entregas
  const puedeAprobarEntregas = React.useCallback(() => {
    if (!userId || !project || !isLoaded) {
      console.log('No puede aprobar - falta información:', {
        userId,
        project: !!project,
        isLoaded,
      });
      return false;
    }

    const puedeAprobar = project.userId === userId;
    console.log('Verificando permisos aprobación:', {
      userId,
      projectUserId: project.userId,
      puedeAprobar,
    });

    return puedeAprobar;
  }, [userId, project, isLoaded]);

  // Función para verificar si el usuario puede editar el proyecto
  const puedeEditarProyecto = React.useCallback(() => {
    if (!userId || !project || !isLoaded) {
      console.log('No puede editar - falta información:', {
        userId,
        project: !!project,
        isLoaded,
      });
      return false;
    }

    const puedeEditar = project.userId === userId;
    console.log('Verificando permisos edición:', {
      userId,
      projectUserId: project.userId,
      puedeEditar,
    });

    return puedeEditar;
  }, [userId, project, isLoaded]);

  // Función para obtener el estado de una actividad basado en las entregas - MEJORADO
  const getEstadoActividad = (actividadId?: number) => {
    console.log(`🔍 === getEstadoActividad para ID: ${actividadId} ===`);

    if (!actividadId) {
      console.log('❌ Sin ID de actividad');
      return { estado: 'pendiente', entregado: false, aprobado: false };
    }

    const entrega = entregasActividades[actividadId];
    console.log(`📦 Entrega encontrada:`, entrega);
    console.log(`📦 Tipo de entrega:`, typeof entrega);
    console.log(`📦 Keys de entrega:`, entrega ? Object.keys(entrega) : 'N/A');

    if (!entrega) {
      console.log(`ℹ️ No hay entrega registrada para actividad ${actividadId}`);
      return { estado: 'pendiente', entregado: false, aprobado: false };
    }

    // Log detallado de los campos de aprobación
    console.log(`📋 Análisis de aprobación:`, {
      aprobado_raw: entrega.aprobado,
      aprobado_type: typeof entrega.aprobado,
      aprobado_string: String(entrega.aprobado),
      entregado_raw: entrega.entregado,
      entregado_type: typeof entrega.entregado,
    });

    // Verificación más robusta del estado de aprobación
    const aprobadoValue = entrega.aprobado;

    // Estado aprobado (valores truthy para aprobación)
    if (
      aprobadoValue === true ||
      aprobadoValue === 1 ||
      aprobadoValue === '1' ||
      aprobadoValue === 'true'
    ) {
      console.log(`✅ Actividad ${actividadId} está APROBADA`);
      return { estado: 'completada', entregado: true, aprobado: true };
    }

    // Estado rechazado (valores falsy explícitos para rechazo)
    if (
      aprobadoValue === false ||
      aprobadoValue === 0 ||
      aprobadoValue === '0' ||
      aprobadoValue === 'false'
    ) {
      console.log(`❌ Actividad ${actividadId} está RECHAZADA`);
      return { estado: 'rechazada', entregado: true, aprobado: false };
    }

    // Verificar si hay una entrega válida (archivos o comentario)
    const tieneArchivos = Boolean(
      entrega.documentKey ||
        entrega.imageKey ||
        entrega.videoKey ||
        entrega.compressedFileKey
    );
    const tieneComentario = Boolean(
      entrega.comentario && entrega.comentario.trim() !== ''
    );
    const marcadoComoEntregado = Boolean(
      entrega.entregado === true ||
        entrega.entregado === 1 ||
        entrega.entregado === '1'
    );

    console.log(`🔍 Verificación de entrega:`, {
      tieneArchivos,
      tieneComentario,
      marcadoComoEntregado,
    });

    const tieneEntrega =
      tieneArchivos || tieneComentario || marcadoComoEntregado;

    if (tieneEntrega) {
      console.log(`📋 Actividad ${actividadId} tiene entrega EN EVALUACIÓN`);
      return { estado: 'en_evaluacion', entregado: true, aprobado: false };
    }

    console.log(`⏳ Actividad ${actividadId} está PENDIENTE`);
    return { estado: 'pendiente', entregado: false, aprobado: false };
  };

  // Cargar entregas existentes - MEJORADO CON MÁS DEBUGGING
  useEffect(() => {
    if (!project?.actividades?.length || !isLoaded) {
      console.log(
        '❌ No se pueden cargar entregas - condiciones no cumplidas:',
        {
          hasActividades: !!project?.actividades?.length,
          actividadesCount: project?.actividades?.length || 0,
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
      console.log('👤 User ID:', userId);

      try {
        const entregas: Record<number, any> = {};
        const resultadosCarga: {
          actividadId: number;
          estado: string;
          datos?: any;
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
                const entrega = await res.json();
                console.log(`📦 Datos RAW recibidos:`, entrega);
                console.log(`📦 Tipo de datos:`, typeof entrega);
                console.log(`📦 Es array:`, Array.isArray(entrega));
                console.log(`📦 Keys del objeto:`, Object.keys(entrega || {}));

                // MEJORADO: Validación más exhaustiva
                if (entrega && typeof entrega === 'object') {
                  // Log de cada campo importante
                  console.log(`📋 Análisis detallado de entrega:`, {
                    id: entrega.id,
                    entregado: entrega.entregado,
                    aprobado: entrega.aprobado,
                    documentKey: entrega.documentKey,
                    imageKey: entrega.imageKey,
                    videoKey: entrega.videoKey,
                    compressedFileKey: entrega.compressedFileKey,
                    comentario: entrega.comentario,
                    feedback: entrega.feedback,
                    userId: entrega.userId,
                    activityId: entrega.activityId,
                    createdAt: entrega.createdAt,
                    updatedAt: entrega.updatedAt,
                  });

                  // Verificar múltiples indicadores de entrega válida
                  const tieneId = Boolean(entrega.id);
                  const tieneArchivos = Boolean(
                    entrega.documentKey ||
                      entrega.imageKey ||
                      entrega.videoKey ||
                      entrega.compressedFileKey
                  );
                  const tieneComentario = Boolean(
                    entrega.comentario && entrega.comentario.trim() !== ''
                  );
                  const tieneEstadoEntregado = Boolean(
                    entrega.entregado === true ||
                      entrega.entregado === 1 ||
                      entrega.entregado === '1'
                  );
                  const tieneEstadoAprobacion =
                    entrega.aprobado !== undefined && entrega.aprobado !== null;

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
                    const entregaNormalizada = {
                      ...entrega,
                      // Asegurar que entregado sea boolean
                      entregado: Boolean(
                        entrega.entregado === true ||
                          entrega.entregado === 1 ||
                          entrega.entregado === '1' ||
                          tieneArchivos ||
                          tieneComentario
                      ),
                      // Normalizar aprobado
                      aprobado:
                        entrega.aprobado === true ||
                        entrega.aprobado === 1 ||
                        entrega.aprobado === '1'
                          ? true
                          : entrega.aprobado === false ||
                              entrega.aprobado === 0 ||
                              entrega.aprobado === '0'
                            ? false
                            : null,
                      // Asegurar campos de archivos
                      documentKey: entrega.documentKey || null,
                      imageKey: entrega.imageKey || null,
                      videoKey: entrega.videoKey || null,
                      compressedFileKey: entrega.compressedFileKey || null,
                      comentario: entrega.comentario || '',
                      feedback: entrega.feedback || null,
                    };

                    entregas[actividad.id] = entregaNormalizada;
                    resultadosCarga.push({
                      actividadId: actividad.id,
                      estado: 'ENCONTRADA',
                      datos: entregaNormalizada,
                    });

                    console.log(
                      `✅ Entrega VÁLIDA guardada:`,
                      entregaNormalizada
                    );
                  } else {
                    resultadosCarga.push({
                      actividadId: actividad.id,
                      estado: 'DATOS_INSUFICIENTES',
                      datos: entrega,
                    });
                    console.log(`❌ Entrega con datos insuficientes:`, entrega);
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
  }, [project?.actividades, projectId, isLoaded, userId]); // Agregar userId como dependencia

  // Función de depuración para verificar estado actual
  const debugEstadoEntregas = () => {
    console.log('\n🐛 === DEBUG ESTADO ACTUAL ===');
    console.log('📦 entregasActividades:', entregasActividades);
    console.log('📋 project.actividades:', project?.actividades);

    if (project?.actividades) {
      project.actividades.forEach((act) => {
        if (act.id) {
          const entrega = entregasActividades[act.id];
          const estado = getEstadoActividad(act.id);
          console.log(`🎯 Actividad ${act.id}: ${act.descripcion}`);
          console.log(`  └─ Entrega:`, entrega);
          console.log(`  └─ Estado calculado:`, estado);
        }
      });
    }
  };

  // Llamar debug en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(debugEstadoEntregas, 2000);
      return () => clearTimeout(timer);
    }
  }, [entregasActividades, project?.actividades]);

  // Función para entregar actividad (mejor manejo de errores y logs)
  const handleEntregarActividad = async (
    documentFile: File | null,
    imageFile: File | null,
    videoFile: File | null,
    compressedFile: File | null,
    comentario: string
  ) => {
    console.log('=== INICIO handleEntregarActividad ===');
    console.log('Archivos recibidos:', {
      documentFile: documentFile?.name,
      imageFile: imageFile?.name,
      videoFile: videoFile?.name,
      compressedFile: compressedFile?.name,
      comentario,
    });
    console.log('Estado actual completo:', {
      actividadSeleccionada,
      actividadSeleccionadaId: actividadSeleccionada?.id,
      actividadSeleccionadaDescripcion: actividadSeleccionada?.descripcion,
      userId,
      isLoaded,
      projectId,
    });

    // Validación mejorada con más información
    if (!actividadSeleccionada) {
      console.error('❌ Error: No hay actividad seleccionada');
      alert('Error: No hay actividad seleccionada');
      return;
    }

    console.log('🔍 Verificando ID de actividad:', {
      id: actividadSeleccionada.id,
      tipoId: typeof actividadSeleccionada.id,
      idEsNumero: typeof actividadSeleccionada.id === 'number',
      idEsDefinido: actividadSeleccionada.id !== undefined,
    });

    if (
      !actividadSeleccionada.id ||
      typeof actividadSeleccionada.id !== 'number'
    ) {
      console.error('❌ Error: La actividad seleccionada no tiene ID válido', {
        actividadSeleccionada,
        id: actividadSeleccionada.id,
        tipo: typeof actividadSeleccionada.id,
      });

      // Intentar buscar la actividad por descripción como fallback
      if (actividadSeleccionada.descripcion) {
        console.log('🔄 Intentando buscar actividad por descripción...');
        const actividadEncontrada = project?.actividades?.find(
          (act) => act.descripcion === actividadSeleccionada.descripcion
        );

        if (actividadEncontrada?.id) {
          console.log(
            '✅ Actividad encontrada por descripción:',
            actividadEncontrada
          );
          setActividadSeleccionada({
            id: actividadEncontrada.id,
            descripcion: actividadEncontrada.descripcion,
          });
          // Continuar con la función usando la actividad encontrada
          actividadSeleccionada.id = actividadEncontrada.id;
        } else {
          console.error('❌ No se pudo encontrar actividad por descripción');
          alert(
            'Error: No se pudo identificar la actividad. Por favor, recarga la página e intenta nuevamente.'
          );
          return;
        }
      } else {
        alert('Error: La actividad seleccionada no tiene un ID válido');
        return;
      }
    }

    if (!userId || !isLoaded) {
      console.error('❌ Error: Usuario no cargado', { userId, isLoaded });
      alert('Error: Usuario no autenticado');
      return;
    }

    if (!projectId) {
      console.error('❌ Error: No hay ID de proyecto');
      alert('Error: No se pudo identificar el proyecto');
      return;
    }

    // Verificar permisos antes de proceder
    const actividad = project?.actividades?.find(
      (a) => a.id === actividadSeleccionada.id
    );

    console.log('Actividad encontrada:', actividad);
    console.log('Verificando permisos para entrega...');

    if (!actividad) {
      console.error('❌ Error: No se encontró la actividad en el proyecto');
      alert('Error: No se encontró la actividad en el proyecto');
      return;
    }

    if (!puedeEntregarActividad(actividad)) {
      console.error('❌ Error: Sin permisos para entregar');
      alert('No tienes permisos para entregar esta actividad');
      return;
    }

    console.log('✅ Validaciones pasadas, iniciando proceso de entrega...');
    console.log('📋 Datos finales para entrega:', {
      actividadId: actividadSeleccionada.id,
      userId,
      projectId,
    });

    setEntregaLoading(true);

    try {
      let documentKey = '',
        imageKey = '',
        videoKey = '',
        compressedFileKey = '';
      let documentName = '',
        imageName = '',
        videoName = '',
        compressedFileName = '';

      console.log('=== SUBIENDO ARCHIVOS A S3 ===');

      // Función helper para subir archivos usando presigned URL
      const uploadFileToS3 = async (file: File, fileType: string) => {
        console.log(`📁 Subiendo ${fileType}:`, file.name);

        // 1. Solicitar presigned POST URL
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: file.type,
            fileSize: file.size,
            fileName: file.name,
          }),
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(
            `❌ Error solicitando presigned URL para ${fileType}:`,
            errorText
          );
          throw new Error(
            `Error solicitando presigned URL para ${fileType}: ${errorText}`
          );
        }

        const uploadData = await uploadResponse.json();
        console.log(`📋 Presigned URL obtenida para ${fileType}:`, uploadData);

        const { url, fields, key, coverImageKey } = uploadData;
        const finalKey = coverImageKey || key;

        // 2. Subir archivo a S3 usando presigned POST
        const formData = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          if (typeof v === 'string') {
            formData.append(k, v);
          }
        });
        formData.append('file', file);

        const s3Upload = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (!s3Upload.ok) {
          const errorText = await s3Upload.text();
          console.error(`❌ Error subiendo ${fileType} a S3:`, errorText);
          throw new Error(`Error subiendo ${fileType} a S3: ${errorText}`);
        }

        console.log(`✅ ${fileType} subido exitosamente. Key:`, finalKey);
        return { key: finalKey, name: file.name };
      };

      // Subir cada tipo de archivo si existe
      if (documentFile) {
        const result = await uploadFileToS3(documentFile, 'documento');
        documentKey = result.key;
        documentName = result.name;
      }

      if (imageFile) {
        const result = await uploadFileToS3(imageFile, 'imagen');
        imageKey = result.key;
        imageName = result.name;
      }

      if (videoFile) {
        const result = await uploadFileToS3(videoFile, 'video');
        videoKey = result.key;
        videoName = result.name;
      }

      if (compressedFile) {
        const result = await uploadFileToS3(
          compressedFile,
          'archivo comprimido'
        );
        compressedFileKey = result.key;
        compressedFileName = result.name;
      }

      console.log('=== TODOS LOS ARCHIVOS SUBIDOS EXITOSAMENTE ===');
      console.log('📁 Keys obtenidas:', {
        documentKey,
        imageKey,
        videoKey,
        compressedFileKey,
      });

      // Verificar que al menos un archivo fue subido
      if (
        !documentKey &&
        !imageKey &&
        !videoKey &&
        !compressedFileKey &&
        !comentario.trim()
      ) {
        console.warn(
          '⚠️ Advertencia: No se subió ningún archivo ni comentario'
        );
        alert('Debes subir al menos un archivo o agregar un comentario');
        return;
      }

      // Crear o actualizar la entrega
      const entregaExistente = entregasActividades[actividadSeleccionada.id];
      const method = entregaExistente ? 'PUT' : 'POST';

      console.log('=== GUARDANDO EN BASE DE DATOS ===');
      console.log('📤 Método:', method);
      console.log(
        '🔗 URL:',
        `/api/projects/${projectId}/activities/${actividadSeleccionada.id}/deliveries`
      );

      // CORREGIDO: Resetear estado de aprobación al editar/reenviar entrega
      const payload = {
        activityId: actividadSeleccionada.id,
        userId: userId,
        documentKey,
        documentName,
        imageKey,
        imageName,
        videoKey,
        videoName,
        compressedFileKey,
        compressedFileName,
        comentario,
        // Resetear aprobación y feedback al reenviar
        aprobado: null,
        feedback: null,
        entregado: true, // Marcar como entregado
      };
      console.log('📦 Payload a enviar:', payload);

      const res = await fetch(
        `/api/projects/${projectId}/activities/${actividadSeleccionada.id}/deliveries`,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      console.log('📡 Respuesta API entrega:', res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Error de la API:', errorText);
        throw new Error(`Error ${res.status}: ${errorText}`);
      }

      const entregaActualizada = await res.json();
      console.log('✅ Entrega guardada exitosamente:', entregaActualizada);

      // CORREGIDO: Actualizar estado local asegurando que se resetee la aprobación
      setEntregasActividades((prev: Record<number, any>) => ({
        ...prev,
        [actividadSeleccionada.id!]: {
          ...entregaActualizada,
          aprobado: null, // Asegurar que se resetee
          feedback: null, // Asegurar que se resetee
          entregado: true, // Asegurar que esté marcado como entregado
        },
      }));

      setModalEntregaOpen(false);
      setActividadSeleccionada(null);

      // CORREGIDO: Mensaje más específico según si es nueva entrega o edición
      const mensaje = entregaExistente
        ? '✅ Entrega actualizada exitosamente. La actividad vuelve a estar en evaluación.'
        : '✅ Entrega realizada exitosamente';
      alert(mensaje);
      console.log('=== FIN handleEntregarActividad EXITOSO ===');
    } catch (error) {
      console.error('=== ❌ ERROR EN handleEntregarActividad ===');
      console.error('Error completo:', error);
      console.error('Stack trace:', (error as Error)?.stack);
      alert(
        `❌ Error al realizar la entrega: ${(error as Error)?.message || 'Error desconocido'}`
      );
    } finally {
      setEntregaLoading(false);
      console.log('🏁 Finalizando handleEntregarActividad');
    }
  };

  // Función para aprobar/rechazar entrega
  const handleAprobarEntrega = async (
    actividadId: number,
    estudianteUserId: string,
    aprobado: boolean,
    feedback?: string
  ) => {
    if (!puedeAprobarEntregas()) {
      alert('No tienes permisos para aprobar entregas');
      return;
    }

    try {
      const res = await fetch(
        `/api/projects/${projectId}/activities/${actividadId}/deliveries/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: estudianteUserId,
            aprobado,
            feedback,
          }),
        }
      );

      if (!res.ok) throw new Error('Error al procesar aprobación');

      const result = await res.json();

      // Actualizar estado local
      setEntregasActividades((prev: Record<number, any>) => ({
        ...prev,
        [actividadId]: result.delivery,
      }));

      alert(result.message);
    } catch (error) {
      console.error('Error aprobando entrega:', error);
      alert('Error al procesar la aprobación');
    }
  };

  // Función para eliminar entrega
  const handleEliminarEntrega = async (actividadId: number) => {
    if (
      !confirm(
        '¿Estás seguro de que deseas eliminar esta entrega? Esta acción eliminará completamente la entrega y todos sus archivos. Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    console.log(
      '🗑️ Iniciando eliminación completa de entrega para actividad:',
      actividadId
    );

    try {
      const res = await fetch(
        `/api/projects/${projectId}/activities/${actividadId}/deliveries`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const result = await res.json();
      console.log('✅ Respuesta de eliminación:', result);

      // Actualizar estado local eliminando completamente la entrega
      setEntregasActividades((prev: Record<number, any>) => {
        const updated = { ...prev };
        delete updated[actividadId];
        return updated;
      });

      // Mostrar mensaje personalizado según el resultado
      let mensaje = '✅ Entrega eliminada exitosamente';

      if (result.filesDeleted) {
        const { total, successful, failed } = result.filesDeleted;
        if (total > 0) {
          if (failed > 0) {
            mensaje += `\n📁 Archivos: ${successful}/${total} eliminados exitosamente`;
            mensaje += `\n⚠️ ${failed} archivo(s) no se pudieron eliminar de S3`;
          } else {
            mensaje += `\n📁 Todos los archivos (${successful}) eliminados exitosamente`;
          }
        }
      }

      alert(mensaje);
      console.log('🎉 Eliminación completada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando entrega:', error);
      alert(
        `❌ Error al eliminar la entrega: ${(error as Error)?.message || 'Error desconocido'}`
      );
    }
  };

  // Función para descargar archivos de entrega
  const handleDescargarArchivo = async (
    actividadId: number,
    tipoArchivo: 'document' | 'image' | 'video' | 'compressed',
    userId: string
  ) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/activities/${actividadId}/deliveries/download?type=${tipoArchivo}&userId=${encodeURIComponent(userId)}`
      );

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const { downloadUrl, fileName } = await res.json();

      // Crear un enlace temporal para la descarga
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Descarga iniciada:', fileName);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert(
        `❌ Error al descargar el archivo: ${(error as Error)?.message || 'Error desconocido'}`
      );
    }
  };

  // Función mejorada para descargar archivos directamente
  const handleDescargarArchivoDirecto = async (
    actividadId: number,
    fileKey: string,
    fileName: string,
    fileType: 'document' | 'image' | 'video' | 'compressed'
  ) => {
    try {
      console.log(`💾 Iniciando descarga de: ${fileName} (${fileType})`);

      // Intentar primero con URL firmada para descarga
      try {
        const res = await fetch(
          `/api/projects/${projectId}/activities/${actividadId}/deliveries/download?key=${encodeURIComponent(fileKey)}&type=${fileType}&userId=${encodeURIComponent(userId)}`
        );

        if (res.ok) {
          const { downloadUrl, fileName: responseFileName } = await res.json();
          console.log(`✅ URL de descarga obtenida:`, downloadUrl);

          // Crear enlace de descarga forzada
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = responseFileName || fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log(`✅ Descarga iniciada: ${responseFileName || fileName}`);
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ Error con API de descarga, intentando método alternativo:', apiError);
      }

      // Método alternativo: descarga directa desde S3
      const directUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${fileKey}`;
      console.log(`🔄 Descarga directa desde S3:`, directUrl);

      // Fetch para forzar descarga
      const response = await fetch(directUrl);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar URL del blob
      window.URL.revokeObjectURL(url);

      console.log(`✅ Descarga completada: ${fileName}`);
    } catch (error) {
      console.error('❌ Error en descarga:', error);
      alert(`❌ Error al descargar el archivo: ${(error as Error)?.message || 'Error desconocido'}`);
    }
  };

  // Función para visualizar archivos (abre en una nueva pestaña)
  const handleVerArchivo = (
    actividadId: number,
    fileKey: string,
    fileType: 'document' | 'image' | 'video' | 'compressed',
    fileName: string
  ) => {
    // Construir la URL de S3
    const fileUrl = `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${fileKey}`;
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };
  
    // Componente para mostrar archivos de una entrega
    const ArchivosEntrega = ({
      actividadId,
      entrega,
    }: {
      actividadId: number;
      entrega: any;
    }) => {
      if (!entrega) {
        return <span className="text-sm text-gray-500 italic">Sin archivos</span>;
      }
  
      const archivos = [];
  
      // Recopilar todos los archivos disponibles
      if (entrega.documentKey && entrega.documentName) {
        archivos.push({
          key: entrega.documentKey,
          name: entrega.documentName,
          type: 'document' as const,
          icon: '📄',
        });
      }
  
      if (entrega.imageKey && entrega.imageName) {
        archivos.push({
          key: entrega.imageKey,
          name: entrega.imageName,
          type: 'image' as const,
          icon: '🖼️',
        });
      }
  
      if (entrega.videoKey && entrega.videoName) {
        archivos.push({
          key: entrega.videoKey,
          name: entrega.videoName,
          type: 'video' as const,
          icon: '🎥',
        });
      }
  
      if (entrega.compressedFileKey && entrega.compressedFileName) {
        archivos.push({
          key: entrega.compressedFileKey,
          name: entrega.compressedFileName,
          type: 'compressed' as const,
          icon: '📦',
        });
      }
  
      if (archivos.length === 0) {
        // Verificar si hay comentario o URL
        if (entrega.comentario || entrega.entregaUrl) {
          return (
            <div className="space-y-1">
              {entrega.comentario && (
                <div className="text-xs text-blue-400">
                  💬 Comentario incluido
                </div>
              )}
              {entrega.entregaUrl && (
                <div className="text-xs text-purple-400">🔗 URL incluida</div>
              )}
            </div>
          );
        }
        return <span className="text-sm text-gray-500 italic">Sin archivos</span>;
      }
  
      return (
        <div className="max-w-xs space-y-1">
          {archivos.map((archivo, index) => (
            <div key={index} className="flex gap-1">
              <button
                onClick={() =>
                  handleVerArchivo(
                    actividadId,
                    archivo.key,
                    archivo.type,
                    archivo.name
                  )
                }
                className="flex flex-1 items-center gap-2 rounded bg-slate-700 p-1 text-left text-xs text-cyan-300 transition-colors hover:bg-slate-600 hover:text-cyan-100"
                title={`Ver: ${archivo.name}`}
              >
                <span>{archivo.icon}</span>
                <span className="flex-1 truncate">
                  {archivo.name.length > 15
                    ? `${archivo.name.substring(0, 15)}...`
                    : archivo.name}
                </span>
              </button>
  
              {/* Botón de descarga mejorado */}
              <button
                onClick={() => handleDescargarArchivoDirecto(
                  actividadId,
                  archivo.key,
                  archivo.name,
                  archivo.type
                )}
                className="rounded bg-blue-600 p-1 text-xs text-white transition-colors hover:bg-blue-500"
                title={`Descargar: ${archivo.name}`}
              >
                <Download className="h-3 w-3" />
              </button>
            </div>
          ))}
  
          {/* Mostrar información adicional si existe */}
          {(entrega.comentario || entrega.entregaUrl) && (
            <div className="mt-1 border-t border-slate-600 pt-1">
              {entrega.comentario && (
                <div className="mb-1 text-xs text-blue-400">
                  💬 Con comentario
                </div>
              )}
              {entrega.entregaUrl && (
                <div className="text-xs text-purple-400">🔗 Con URL</div>
              )}
            </div>
          )}
        </div>
      );
    };

  // Mostrar loading mientras Clerk carga
  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-800 text-white">
        {!isLoaded ? 'Cargando autenticación...' : 'Cargando proyecto...'}
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-slate-800 text-white">
        Proyecto no encontrado
      </div>
    );
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Project Image and Basic Info */}
          <div className="lg:col-span-1">
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-6">
                <div className="mb-4 flex w-full items-center justify-center rounded-lg bg-slate-700/50">
                  {project.coverImageKey && !imageError ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`}
                      alt={project.name}
                      width={400}
                      height={400}
                      layout="responsive"
                      className="h-auto w-full rounded-lg object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="text-6xl text-slate-500">📊</div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h2 className="mb-2 text-2xl font-bold text-teal-400">
                      {project.name}
                    </h2>
                    <p className="text-gray-300">
                      Tipo de Proyecto:{' '}
                      <span className="text-white">{project.type_project}</span>
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-gray-400">Categoría:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-600 hover:bg-blue-700">
                        {_categoria?.name ?? 'Sin categoría'}
                      </Badge>
                      <Badge className="bg-green-600 hover:bg-green-700">
                        Creado{' '}
                        {project.createdAt
                          ? new Date(project.createdAt).toLocaleDateString()
                          : ''}
                      </Badge>
                      <Badge className="bg-teal-600 hover:bg-teal-700">
                        Actualizado{' '}
                        {project.updatedAt
                          ? new Date(project.updatedAt).toLocaleDateString()
                          : ''}
                      </Badge>
                      <Badge className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700">
                        <Users className="h-3 w-3" />
                        {inscritos} Integrantes
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Fecha de inicio:{' '}
                        {project.fecha_inicio
                          ? new Date(project.fecha_inicio).toLocaleDateString(
                              'es-ES'
                            )
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="h-4 w-4" />
                      <span>
                        Fecha de fin:{' '}
                        {project.fecha_fin
                          ? new Date(project.fecha_fin).toLocaleDateString(
                              'es-ES'
                            )
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Responsible and Actions */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-white">
                      Responsable del Proyecto
                    </h3>
                    <p className="text-teal-400">{responsable}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleTogglePublicarProyecto}
                      disabled={!puedeEditarProyecto()}
                    >
                      {project.isPublic
                        ? 'Despublicar Proyecto'
                        : 'Publicar Proyecto'}
                    </Button>
                    {puedeEditarProyecto() && (
                      <>
                        <Button
                          className="bg-teal-600 hover:bg-teal-700"
                          onClick={() => setIsEditModalOpen(true)}
                        >
                          <Edit className="mr-1 h-4 w-4" />
                          Editar Proyecto
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setConfirmOpen(true)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Eliminar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problem Statement */}
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white">
                  Planteamiento del Problema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{project.planteamiento}</p>
              </CardContent>
            </Card>

            {/* Justification and General Objective */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Justificación</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{project.justificacion}</p>
                </CardContent>
              </Card>

              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Objetivo General</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{project.objetivo_general}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <br />
        {/* Specific Objectives, Activities and Timeline */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                Objetivos Específicos y Actividades
              </CardTitle>
            </div>
          </CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardContent>
              <TabsContent value="horas">
                <div className="space-y-6">
                  {/* CORREGIDO: Renderizar usando project.actividades en lugar de obj.actividades */}
                  {Array.isArray(project.objetivos_especificos) &&
                  project.objetivos_especificos.length > 0 ? (
                    project.objetivos_especificos.map((obj, idx) => (
                      <div key={obj.id || idx}>
                        <h4 className="mb-3 font-semibold text-teal-400">
                          {obj.description}
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-slate-600">
                              <TableHead className="text-gray-300">
                                ACTIVIDADES
                              </TableHead>
                              <TableHead className="text-gray-300">
                                ESTADO
                              </TableHead>
                              <TableHead className="text-gray-300">
                                RESPONSABLE
                              </TableHead>
                              <TableHead className="text-gray-300">
                                ENTREGAS
                              </TableHead>
                              <TableHead className="text-gray-300">
                                ARCHIVOS
                              </TableHead>
                              <TableHead className="text-gray-300">
                                MOTIVO
                              </TableHead>
                              <TableHead className="text-gray-300">
                                ACCIONES
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* CORREGIDO: Filtrar actividades de project.actividades que pertenecen a este objetivo */}
                            {(() => {
                              // Obtener las actividades que pertenecen a este objetivo
                              const actividadesDelObjetivo = Array.isArray(
                                obj.actividades
                              )
                                ? obj.actividades
                                    .map((objAct: any) => {
                                      // Buscar la actividad completa en project.actividades
                                      const actividadCompleta =
                                        project.actividades?.find(
                                          (projectAct) =>
                                            projectAct.id === objAct.id ||
                                            projectAct.descripcion ===
                                              objAct.descripcion
                                        );
                                      return actividadCompleta;
                                    })
                                    .filter(Boolean) // Remover valores undefined
                                : [];

                              console.log(
                                `🔍 Actividades para objetivo "${obj.description}":`,
                                actividadesDelObjetivo
                              );

                              if (actividadesDelObjetivo.length === 0) {
                                return (
                                  <TableRow>
                                    <TableCell
                                      colSpan={7}
                                      className="text-gray-400 italic"
                                    >
                                      No hay actividades agregadas para este
                                      objetivo
                                    </TableCell>
                                  </TableRow>
                                );
                              }

                              return actividadesDelObjetivo.map(
                                (act, actIdx) => {
                                  if (!act) return null;

                                  console.log(
                                    `🎯 Renderizando actividad CORREGIDA ${act.id}: ${act.descripcion}`,
                                    act
                                  );

                                  // Usa el id, si no existe busca por descripción
                                  const responsable = getResponsableNombrePorId(
                                    act.id,
                                    act.descripcion
                                  );

                                  // Obtener el estado real de la actividad basado en las entregas
                                  const estadoActividad = getEstadoActividad(
                                    act.id
                                  );

                                  console.log(
                                    `🎯 Estado para actividad ${act.id}: ${act.descripcion}`,
                                    {
                                      estadoActividad,
                                      entrega: act.id
                                        ? entregasActividades[act.id]
                                        : null,
                                    }
                                  );

                                  return (
                                    <TableRow
                                      key={act.id || actIdx}
                                      className="border-slate-600"
                                    >
                                      <TableCell className="text-gray-300">
                                        {act.descripcion}
                                      </TableCell>
                                      {/* Estado dinámico basado en entregas reales */}
                                      <TableCell>
                                        {(() => {
                                          switch (estadoActividad.estado) {
                                            case 'completada':
                                              return (
                                                <Badge className="bg-green-600 text-white">
                                                  <CheckCircle className="mr-1 h-3 w-3" />
                                                  Completada
                                                </Badge>
                                              );
                                            case 'rechazada':
                                              return (
                                                <Badge className="bg-red-600 text-white">
                                                  <AlertCircle className="mr-1 h-3 w-3" />
                                                  Rechazada
                                                </Badge>
                                              );
                                            case 'en_evaluacion':
                                              return (
                                                <Badge className="bg-blue-600 text-white">
                                                  <Clock className="mr-1 h-3 w-3" />
                                                  En evaluación
                                                </Badge>
                                              );
                                            default:
                                              return (
                                                <Badge className="bg-yellow-500 text-black">
                                                  <AlertCircle className="mr-1 h-3 w-3" />
                                                  Pendiente
                                                </Badge>
                                              );
                                          }
                                        })()}
                                      </TableCell>
                                      <TableCell className="text-gray-300">
                                        {responsable}
                                      </TableCell>
                                      <TableCell>
                                        {/* Estado de entrega basado en datos reales */}
                                        {(() => {
                                          const entrega = act.id
                                            ? entregasActividades[act.id]
                                            : null;

                                          if (!entrega) {
                                            return (
                                              <Badge className="bg-gray-500 text-white">
                                                Sin entregar
                                              </Badge>
                                            );
                                          }

                                          switch (estadoActividad.estado) {
                                            case 'completada':
                                              return (
                                                <Badge className="bg-green-600 text-white">
                                                  <CheckCircle className="mr-1 h-3 w-3" />
                                                  Aprobada
                                                </Badge>
                                              );
                                            case 'rechazada':
                                              return (
                                                <Badge className="bg-red-600 text-white">
                                                  <AlertCircle className="mr-1 h-3 w-3" />
                                                  Rechazada
                                                </Badge>
                                              );
                                            case 'en_evaluacion':
                                              return (
                                                <Badge className="bg-blue-600 text-white">
                                                  <Clock className="mr-1 h-3 w-3" />
                                                  En evaluación
                                                </Badge>
                                              );
                                            default:
                                              return (
                                                <Badge className="bg-gray-500 text-white">
                                                  Sin entregar
                                                </Badge>
                                              );
                                          }
                                        })()}
                                      </TableCell>
                                      {/* Nueva columna de ARCHIVOS */}
                                      <TableCell>
                                        <ArchivosEntrega
                                          actividadId={act.id!}
                                          entrega={
                                            act.id
                                              ? entregasActividades[act.id]
                                              : null
                                          }
                                        />
                                      </TableCell>
                                      {/* Nueva columna para motivo de rechazo */}
                                      <TableCell>
                                        {(() => {
                                          const entrega = act.id
                                            ? entregasActividades[act.id]
                                            : null;

                                          if (!entrega || !entrega.feedback) {
                                            return (
                                              <span className="text-sm text-gray-500 italic">
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

                                          return (
                                            <div className="max-w-xs">
                                              <p
                                                className={`text-sm ${feedbackColor} break-words`}
                                              >
                                                {entrega.feedback}
                                              </p>
                                            </div>
                                          );
                                        })()}
                                      </TableCell>
                                      {/* Columna de acciones - simplificada */}
                                      <TableCell>
                                        {(() => {
                                          const entrega = act.id
                                            ? entregasActividades[act.id]
                                            : null;
                                          const puedeEntregar =
                                            puedeEntregarActividad(act);
                                          const puedeAprobar =
                                            puedeAprobarEntregas();

                                          console.log(
                                            `🔧 Acciones CORREGIDAS para actividad ${act.id}:`,
                                            {
                                              estadoActividad,
                                              puedeEntregar,
                                              puedeAprobar,
                                              entrega,
                                            }
                                          );

                                          const tieneEntrega =
                                            estadoActividad.entregado;

                                          if (tieneEntrega) {
                                            return (
                                              <div className="flex flex-col gap-2">
                                                {/* Botones para el responsable de la actividad o del proyecto */}
                                                {puedeEntregar && (
                                                  <div className="flex gap-2">
                                                    <Button
                                                      size="sm"
                                                      className="bg-blue-600 hover:bg-blue-700"
                                                      onClick={() =>
                                                        handleAbrirModalEntrega(
                                                          {
                                                            id: act.id,
                                                            descripcion:
                                                              act.descripcion,
                                                          },
                                                          true // Modo edición
                                                        )
                                                      }
                                                    >
                                                      {estadoActividad.estado ===
                                                      'rechazada'
                                                        ? 'Reenviar'
                                                        : 'Editar entrega'}
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="destructive"
                                                      onClick={() =>
                                                        handleEliminarEntrega(
                                                          act.id!
                                                        )
                                                      }
                                                    >
                                                      <Trash2 className="mr-1 h-3 w-3" />
                                                      Eliminar
                                                    </Button>
                                                  </div>
                                                )}

                                                {/* Botones para el responsable del proyecto (aprobación) */}
                                                {puedeAprobar &&
                                                  estadoActividad.estado !==
                                                    'completada' &&
                                                  estadoActividad.estado !==
                                                    'rechazada' && (
                                                    <div className="flex gap-2">
                                                      <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() =>
                                                          handleAprobarEntrega(
                                                            act.id!,
                                                            entrega.userId,
                                                            true,
                                                            'Entrega aprobada'
                                                          )
                                                        }
                                                      >
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Aprobar
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                          const feedback =
                                                            prompt(
                                                              'Motivo del rechazo:'
                                                            );
                                                          if (feedback) {
                                                            handleAprobarEntrega(
                                                              act.id!,
                                                              entrega.userId,
                                                              false,
                                                              feedback
                                                            );
                                                          }
                                                        }}
                                                      >
                                                        <AlertCircle className="mr-1 h-3 w-3" />
                                                        Rechazar
                                                      </Button>
                                                    </div>
                                                  )}
                                              </div>
                                            );
                                          } else if (puedeEntregar) {
                                            return (
                                              <Button
                                                size="sm"
                                                className="bg-teal-600 hover:bg-teal-700"
                                                onClick={() =>
                                                  handleAbrirModalEntrega(
                                                    {
                                                      id: act.id,
                                                      descripcion:
                                                        act.descripcion,
                                                    },
                                                    false // Modo nueva entrega
                                                  )
                                                }
                                              >
                                                Entregar actividad
                                              </Button>
                                            );
                                          } else {
                                            return (
                                              <span className="text-sm text-gray-500">
                                                Sin permisos
                                              </span>
                                            );
                                          }
                                        })()}
                                      </TableCell>
                                    </TableRow>
                                  );
                                }
                              );
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 italic">
                      No hay objetivos específicos
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
        {/* Cronograma separado */}
        <br />
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Cronograma</CardTitle>
            {/* Selector de visualización */}
            <div className="mt-2 flex gap-2">
              <span className="text-gray-300">Ver en:</span>
              <select
                value={cronogramaTipo}
                onChange={(e) =>
                  setCronogramaTipo(
                    e.target.value as 'horas' | 'dias' | 'meses'
                  )
                }
                className="rounded bg-slate-700 px-2 py-1 text-teal-300"
              >
                <option value="horas">Horas</option>
                <option value="dias">Días</option>
                <option value="meses">Meses</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-600">
                    <TableHead
                      className="sticky left-0 z-10 bg-slate-800 text-gray-300"
                      style={{ minWidth: 500 }} //ancho de la columna de actividades
                    >
                      Actividad
                    </TableHead>
                    {cronogramaTipo === 'horas' ? (
                      <TableHead className="text-center align-middle text-gray-300">
                        Duración (horas)
                      </TableHead>
                    ) : (
                      unidadesHeader.map((unidad) => (
                        <TableHead
                          key={unidad.indice}
                          className="text-center align-middle text-gray-300"
                          style={{ minWidth: 80 }}
                        >
                          {unidad.etiqueta}
                          <br />
                          <span className="text-xs text-gray-400">
                            {unidad.fecha}
                          </span>
                        </TableHead>
                      ))
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actividadesOrdenadas.map((act, idx) => {
                    const orden = getOrdenActividad(act);
                    return (
                      <TableRow
                        key={act.id ?? idx}
                        className="border-slate-600 transition-colors hover:bg-slate-700/60"
                      >
                        <TableCell
                          className="sticky left-0 z-10 bg-slate-800 text-gray-300 group-hover:bg-slate-700/60"
                          style={{ minWidth: 180 }}
                        >
                          {act.descripcion}
                        </TableCell>
                        {cronogramaTipo === 'horas' ? (
                          <TableCell className="text-center align-middle font-bold text-teal-300">
                            {act.hoursPerDay ?? '-'}
                          </TableCell>
                        ) : (
                          unidadesHeader.map((unidad) => (
                            <TableCell
                              key={unidad.indice}
                              className="text-center align-middle"
                              style={{ minWidth: 80 }}
                            >
                              {Array.isArray(act.meses) &&
                              act.meses.includes(unidad.indice) ? (
                                <div className="mx-auto h-6 w-6 rounded bg-green-600" />
                              ) : (
                                <div className="mx-auto h-6 w-6 rounded bg-slate-600" />
                              )}
                            </TableCell>
                          ))
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
            rama: '',
            especialidades: '',
            participacion: '',
          }}
          integrantes={integrantes}
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
              ? project.objetivos_especificos.map((obj, objIdx) => ({
                  id: String(obj.id),
                  title: obj.description,
                  activities: Array.isArray(obj.actividades)
                    ? obj.actividades.map((act: any, actIdx: number) => {
                        const key =
                          typeof act.id !== 'undefined'
                            ? String(act.id)
                            : String(actIdx);
                        const responsable = getResponsableNombrePorId(act.id);
                        return `${act.descripcion} (${responsable})`;
                      })
                    : [],
                }))
              : []
          }
          actividad={
            project.actividades?.map((a, idx) => {
              const responsable = getResponsableNombrePorId(a.id);
              return `${a.descripcion} (${responsable})`;
            }) || []
          }
          categoriaId={project.categoryId}
          numMeses={0}
          setActividades={() => ['']}
          setObjetivosEsp={() => ['']}
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
          onUpdateProject={() => {}}
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
