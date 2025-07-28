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

  const handleAbrirModalEntrega = (actividad: {
    id?: number;
    descripcion?: string;
  }) => {
    setActividadSeleccionada(actividad);
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

  // Cargar entregas existentes
  useEffect(() => {
    if (!project?.actividades?.length || !userId || !isLoaded) return;

    const fetchEntregas = async () => {
      try {
        const entregas: Record<number, any> = {};

        for (const actividad of project.actividades) {
          if (actividad.id) {
            const res = await fetch(
              `/api/projects/${projectId}/activities/${actividad.id}/deliveries`
            );
            if (res.ok) {
              const entrega = await res.json();
              if (entrega) {
                entregas[actividad.id] = entrega;
              }
            }
          }
        }

        setEntregasActividades(entregas);
      } catch (error) {
        console.error('Error cargando entregas:', error);
      }
    };

    fetchEntregas();
  }, [project?.actividades, projectId, userId, isLoaded]);

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

    if (!actividadSeleccionada?.id || !userId || !isLoaded) {
      console.log('Validación inicial falló:', {
        actividadSeleccionada: actividadSeleccionada?.id,
        userId,
        isLoaded,
      });
      return;
    }

    // Verificar permisos antes de proceder
    const actividad = project?.actividades?.find(
      (a) => a.id === actividadSeleccionada.id
    );

    console.log('Actividad encontrada:', actividad);
    console.log('Verificando permisos para entrega...');

    if (!actividad || !puedeEntregarActividad(actividad)) {
      alert('No tienes permisos para entregar esta actividad');
      return;
    }

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

      // Subir cada tipo de archivo si existe
      if (documentFile) {
        console.log('Subiendo documento:', documentFile.name);
        const formData = new FormData();
        formData.append('file', documentFile);
        const uploadRes = await fetch('/api/projects/upload', {
          method: 'POST',
          body: formData,
        });
        console.log('Respuesta upload documento:', uploadRes.status);
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          documentKey = data.key || '';
          documentName = documentFile.name;
          console.log('Documento subido exitosamente. Key:', documentKey);
        } else {
          console.error('Error subiendo documento:', await uploadRes.text());
        }
      }

      if (imageFile) {
        console.log('Subiendo imagen:', imageFile.name);
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('/api/projects/upload', {
          method: 'POST',
          body: formData,
        });
        console.log('Respuesta upload imagen:', uploadRes.status);
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageKey = data.key || '';
          imageName = imageFile.name;
          console.log('Imagen subida exitosamente. Key:', imageKey);
        } else {
          console.error('Error subiendo imagen:', await uploadRes.text());
        }
      }

      if (videoFile) {
        console.log('Subiendo video:', videoFile.name);
        const formData = new FormData();
        formData.append('file', videoFile);
        const uploadRes = await fetch('/api/projects/upload', {
          method: 'POST',
          body: formData,
        });
        console.log('Respuesta upload video:', uploadRes.status);
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          videoKey = data.key || '';
          videoName = videoFile.name;
          console.log('Video subido exitosamente. Key:', videoKey);
        } else {
          console.error('Error subiendo video:', await uploadRes.text());
        }
      }

      if (compressedFile) {
        console.log('Subiendo archivo comprimido:', compressedFile.name);
        const formData = new FormData();
        formData.append('file', compressedFile);
        const uploadRes = await fetch('/api/projects/upload', {
          method: 'POST',
          body: formData,
        });
        console.log('Respuesta upload comprimido:', uploadRes.status);
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          compressedFileKey = data.key || '';
          compressedFileName = compressedFile.name;
          console.log(
            'Archivo comprimido subido exitosamente. Key:',
            compressedFileKey
          );
        } else {
          console.error(
            'Error subiendo archivo comprimido:',
            await uploadRes.text()
          );
        }
      }

      console.log('=== TODOS LOS ARCHIVOS SUBIDOS ===');
      console.log('Keys obtenidas:', {
        documentKey,
        imageKey,
        videoKey,
        compressedFileKey,
      });

      // Crear o actualizar la entrega
      const entregaExistente = entregasActividades[actividadSeleccionada.id];
      const method = entregaExistente ? 'PUT' : 'POST';

      console.log('=== GUARDANDO EN BASE DE DATOS ===');
      console.log('Método:', method);
      console.log(
        'URL:',
        `/api/projects/${projectId}/activities/${actividadSeleccionada.id}/deliveries`
      );

      const payload = {
        documentKey,
        documentName,
        imageKey,
        imageName,
        videoKey,
        videoName,
        compressedFileKey,
        compressedFileName,
        comentario,
      };
      console.log('Payload a enviar:', payload);

      const res = await fetch(
        `/api/projects/${projectId}/activities/${actividadSeleccionada.id}/deliveries`,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      console.log('Respuesta API entrega:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error de la API:', errorText);
        throw new Error(`Error guardando entrega: ${errorText}`);
      }

      const entregaActualizada = await res.json();
      console.log('Entrega guardada exitosamente:', entregaActualizada);

      // Actualizar estado local
      setEntregasActividades((prev: Record<number, any>) => ({
        ...prev,
        [actividadSeleccionada.id!]: entregaActualizada,
      }));

      setModalEntregaOpen(false);
      setActividadSeleccionada(null);

      alert('Entrega realizada exitosamente');
      console.log('=== FIN handleEntregarActividad EXITOSO ===');
    } catch (error) {
      console.error('=== ERROR EN handleEntregarActividad ===');
      console.error('Error completo:', error);
      alert('Error al realizar la entrega');
    } finally {
      setEntregaLoading(false);
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
                  {/* Render objetivos y actividades en tablas */}
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
                              {/* Quitar columna CRONOGRAMA */}
                              <TableHead className="text-gray-300">
                                ENTREGAS
                              </TableHead>
                              {/* Nueva columna para acciones de entrega */}
                              <TableHead className="text-gray-300">
                                ACCIONES
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Array.isArray(obj.actividades) &&
                            obj.actividades.length > 0 ? (
                              obj.actividades.map(
                                (
                                  act: {
                                    descripcion: string;
                                    meses: number[];
                                    id?: number;
                                    entregaRealizada?: boolean;
                                    entregaAprobada?: boolean; // <-- Añadido para evitar error TS
                                  },
                                  actIdx: number
                                ) => {
                                  const key =
                                    typeof act.id !== 'undefined'
                                      ? String(act.id)
                                      : String(actIdx);

                                  // Usa el id, si no existe busca por descripción
                                  const responsable = getResponsableNombrePorId(
                                    act.id,
                                    act.descripcion
                                  );

                                  // Simulación: determinar si hay entrega realizada
                                  // Reemplaza esto con tu lógica real
                                  const entregaRealizada =
                                    act.entregaRealizada ?? false;

                                  return (
                                    <TableRow
                                      key={actIdx}
                                      className="border-slate-600"
                                    >
                                      <TableCell className="text-gray-300">
                                        {act.descripcion}
                                      </TableCell>
                                      {/* Estado dinámico */}
                                      <TableCell>
                                        {entregaRealizada ? (
                                          <Badge className="bg-green-600">
                                            Entregado
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-yellow-500 text-black">
                                            Pendiente
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-gray-300">
                                        {responsable}
                                      </TableCell>
                                      <TableCell>
                                        {/* Estado de entrega */}
                                        {!act.entregaRealizada ? (
                                          <Badge className="bg-gray-500">
                                            Sin entregar
                                          </Badge>
                                        ) : act.entregaAprobada ? (
                                          <Badge className="bg-green-600">
                                            Completada
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-blue-600">
                                            En evaluación
                                          </Badge>
                                        )}
                                      </TableCell>
                                      {/* Nueva columna de acciones */}
                                      <TableCell>
                                        {(() => {
                                          const entrega = act.id
                                            ? entregasActividades[act.id]
                                            : null;
                                          const puedeEntregar =
                                            puedeEntregarActividad(act);
                                          const puedeAprobar =
                                            puedeAprobarEntregas();

                                          if (entrega?.entregado) {
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
                                                          }
                                                        )
                                                      }
                                                    >
                                                      Editar entrega
                                                    </Button>
                                                  </div>
                                                )}

                                                {/* Botones para el responsable del proyecto (aprobación) */}
                                                {puedeAprobar &&
                                                  !entrega.aprobado && (
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

                                                {/* Mostrar estado de aprobación */}
                                                {entrega.aprobado && (
                                                  <Badge className="bg-green-600">
                                                    Aprobada
                                                  </Badge>
                                                )}
                                              </div>
                                            );
                                          } else if (puedeEntregar) {
                                            return (
                                              <Button
                                                size="sm"
                                                className="bg-teal-600 hover:bg-teal-700"
                                                onClick={() =>
                                                  handleAbrirModalEntrega({
                                                    id: act.id,
                                                    descripcion:
                                                      act.descripcion,
                                                  })
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
                              )
                            ) : (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="text-gray-400 italic"
                                >
                                  No hay actividades agregadas para este
                                  objetivo
                                </TableCell>
                              </TableRow>
                            )}
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
      `}</style>
    </div>
  );
}
