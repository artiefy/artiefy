'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { useAuth, useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Calendar,
  Edit,
  Eye,
  ImageIcon,
  Plus,
  Search,
  //  Trash2,
  Users,
} from 'lucide-react';

import { Header } from '~/components/estudiantes/layout/Header';
import { Badge } from '~/components/projects/ui/badge';
import { Button } from '~/components/projects/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/projects/ui/card';
import { Input } from '~/components/projects/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/projects/ui/select';

import ModalConfirmacionEliminacion from '../../../components/projects/Modals/ModalConfirmacionEliminacion';
import ModalIntegrantesProyectoInfo from '../../../components/projects/Modals/ModalIntegrantesProyectoInfo';
import ModalJustificacion from '../../../components/projects/Modals/ModalJustificacion';
import ModalObjetivoGen from '../../../components/projects/Modals/ModalObjetivoGen';
import ModalObjetivosEsp from '../../../components/projects/Modals/ModalObjetivosEsp';
import ModalPlanteamiento from '../../../components/projects/Modals/ModalPlanteamiento';
import ModalResumen from '../../../components/projects/Modals/ModalResumen';
import ModalGenerarProyecto from '~/components/projects/Modals/ModalGenerarProyecto';

// Actualizar la interfaz para incluir el tipo de proyecto
interface Project {
  id: number;
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  coverImageKey?: string;
  type_project: string;
  userId: string;
  categoryId: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  // Virtuales para la UI:
  category?: string;
  tags?: string[];
  author?: string;
  views?: number;
  status?: string;
  date?: string;
  title?: string;
  description?: string;
  projectType?: 'own' | 'taken'; // Nuevo campo para identificar el tipo
}

// Actualizar la interfaz para incluir los datos completos
interface ProjectDetails {
  id: number;
  name: string;
  planteamiento: string;
  justificacion: string;
  objetivo_general: string;
  objetivos_especificos: string[];
  actividades: { descripcion: string; meses: number[] }[];
  type_project: string;
  categoryId: number;
  coverImageKey?: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Añade la interfaz para SpecificObjective (igual que en el modal)
interface SpecificObjective {
  id: string;
  title: string;
  activities: string[];
}

export default function ProyectosPage() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { user } = useUser(); // Agregar useUser para obtener datos del usuario

  const [planteamientoOpen, setPlanteamientoOpen] = React.useState(false);
  const [planteamientoTexto, setPlanteamientoTexto] = useState('');
  const [justificacionOpen, setJustificacionOpen] = React.useState(false);
  const [justificacionTexto, setJustificacionTexto] = useState('');
  const [objetivoGenOpen, setObjetivoGenOpen] = React.useState(false);
  const [objetivoGenTexto, setObjetivoGenTexto] = useState('');
  const [ObjetivosEspOpen, setObjetivosEspOpen] = React.useState(false);
  const [ObjetivosEspTexto, setObjetivosEspTexto] = useState<
    SpecificObjective[]
  >([]);
  const [ResumenOpen, setResumenOpen] = React.useState(false);
  const [modalGenerarOpen, setModalGenerarOpen] = useState(false);
  const [proyectoGenerado, setProyectoGenerado] = useState<any>(null);
  const [modalResumenGeneradoOpen, setModalResumenGeneradoOpen] =
    useState(false);

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingProjectDetails, setEditingProjectDetails] =
    useState<ProjectDetails | null>(null);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(
    null
  );
  const [integrantesModalOpen, setIntegrantesModalOpen] = useState<
    number | null
  >(null);

  const [responsablesPorActividad, setResponsablesPorActividad] = useState<{
    [key: string]: string;
  }>({});
  const [horasPorActividad, setHorasPorActividad] = useState<{
    [key: string]: number;
  }>({});

  // Estado para horas por día de trabajo del proyecto (flujo de creación)
  const [horasPorDiaProyecto, setHorasPorDiaProyecto] = useState<number>(6);

  // Estado para tiempo estimado total del proyecto (flujo de creación)
  const [tiempoEstimadoProyecto, setTiempoEstimadoProyecto] =
    useState<number>(0);

  const handleConfirmarPlanteamiento = () => {
    setPlanteamientoOpen(false);
    setJustificacionOpen(true);
  };
  const handleAnteriorJustificacion = () => {
    setJustificacionOpen(false);
    setPlanteamientoOpen(true);
  };
  const handleConfirmarJustificacion = () => {
    setJustificacionOpen(false);
    setObjetivoGenOpen(true);
  };
  const handleAnteriorObjetivoGen = () => {
    setObjetivoGenOpen(false);
    setJustificacionOpen(true);
  };
  const handleConfirmarObjetivoGen = () => {
    setObjetivoGenOpen(false);
    setObjetivosEspOpen(true);
  };
  const handleAnteriorObjetivosEsp = () => {
    setObjetivosEspOpen(false);
    setObjetivoGenOpen(true);
  };
  const handleConfirmarObjetivosEsp = (data: {
    objetivos: SpecificObjective[];
    responsablesPorActividad: { [key: string]: string };
    horasPorActividad: { [key: string]: number };
    horasPorDiaProyecto: number; // <-- Recibe el valor
    tiempoEstimadoProyecto?: number; // <-- Nuevo campo opcional
  }) => {
    setObjetivosEspTexto(data.objetivos);
    setResponsablesPorActividad(data.responsablesPorActividad || {});
    setHorasPorActividad(data.horasPorActividad || {});
    setHorasPorDiaProyecto(data.horasPorDiaProyecto ?? 6);
    setTiempoEstimadoProyecto(data.tiempoEstimadoProyecto ?? 0); // <-- Guarda el valor
    setObjetivosEspOpen(false);
    setResumenOpen(true);
  };

  // Estado para los proyectos cargados desde la BD
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Estado para los contadores de inscritos por proyecto
  const [inscritosMap, setInscritosMap] = useState<Record<number, number>>({});

  // NUEVO: Estado para almacenar los integrantes de cada proyecto
  const [integrantesMap, setIntegrantesMap] = useState<Record<number, any[]>>(
    {}
  );

  // NUEVO: Estado para cargar categorías de proyectos
  const [categoriasMap, setCategoriasMap] = useState<Record<number, string>>(
    {}
  );

  // Estado para solicitudes pendientes por proyecto
  const [solicitudesPendientesMap, setSolicitudesPendientesMap] = useState<
    Record<number, number>
  >({});

  // Función para recargar solicitudes pendientes de un proyecto específico
  const recargarSolicitudesProyecto = async (projectId: number) => {
    try {
      const res = await fetch(
        `/api/projects/solicitudes/count?projectId=${projectId}`
      );
      if (res.ok) {
        const data: { count: number } = await res.json();
        setSolicitudesPendientesMap((prev) => ({
          ...prev,
          [projectId]: data.count ?? 0,
        }));
        console.log(
          `🔔 Proyecto ${projectId} actualizado: ${data.count} solicitudes`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error actualizando solicitudes proyecto ${projectId}:`,
        error
      );
    }
  };

  // Cargar la cantidad de solicitudes pendientes para todos los proyectos
  useEffect(() => {
    const fetchSolicitudesPendientes = async () => {
      if (projects.length === 0 || !userId) return;

      console.log(
        '🔔 Obteniendo solicitudes pendientes para proyectos:',
        projects.length
      );
      const newMap: Record<number, number> = {};

      await Promise.all(
        projects.map(async (project) => {
          // Solo obtener solicitudes para proyectos propios donde el usuario actual es el responsable
          if (project.projectType === 'own' && project.userId === userId) {
            try {
              const res = await fetch(
                `/api/projects/solicitudes/count?projectId=${project.id}`
              );
              if (res.ok) {
                const data: { count: number } = await res.json();
                newMap[project.id] = data.count ?? 0;
                console.log(
                  `🔔 Proyecto ${project.id}: ${data.count} solicitudes pendientes`
                );
              } else {
                console.log(
                  `⚠️ Error obteniendo solicitudes para proyecto ${project.id}`
                );
                newMap[project.id] = 0;
              }
            } catch (error) {
              console.error(
                `❌ Error fetch solicitudes proyecto ${project.id}:`,
                error
              );
              newMap[project.id] = 0;
            }
          } else {
            newMap[project.id] = 0;
          }
        })
      );

      console.log('🔔 Mapa final de solicitudes pendientes:', newMap);
      setSolicitudesPendientesMap(newMap);
    };

    fetchSolicitudesPendientes();
  }, [projects, userId]);

  // NUEVO: Cargar la cantidad de inscritos para todos los proyectos
  useEffect(() => {
    const fetchInscritos = async () => {
      if (projects.length === 0 || !userId) return;

      console.log(
        '👥 Obteniendo cantidad de inscritos para proyectos:',
        projects.length
      );
      const newMap: Record<number, number> = {};

      await Promise.all(
        projects.map(async (project) => {
          try {
            const res = await fetch(
              `/api/projects/taken/count?projectId=${project.id}`
            );
            if (res.ok) {
              const data: { count: number } = await res.json();
              newMap[project.id] = data.count ?? 0;
              console.log(`👥 Proyecto ${project.id}: ${data.count} inscritos`);
            } else {
              console.log(
                `⚠️ Error obteniendo inscritos para proyecto ${project.id}`
              );
              newMap[project.id] = 0;
            }
          } catch (error) {
            console.error(
              `❌ Error fetch inscritos proyecto ${project.id}:`,
              error
            );
            newMap[project.id] = 0;
          }
        })
      );

      console.log('👥 Mapa final de inscritos:', newMap);
      setInscritosMap(newMap);
    };

    fetchInscritos();
  }, [projects, userId]);

  // NUEVO: Cargar los integrantes para todos los proyectos
  useEffect(() => {
    const fetchIntegrantes = async () => {
      if (projects.length === 0 || !userId) return;

      console.log('👨‍👩‍👧‍👦 Obteniendo integrantes para proyectos:', projects.length);
      const newMap: Record<number, any[]> = {};

      await Promise.all(
        projects.map(async (project) => {
          try {
            const res = await fetch(
              `/api/projects/taken/list?projectId=${project.id}`
            );
            if (res.ok) {
              const data: unknown = await res.json();
              console.log(`👨‍👩‍👧‍👦 Integrantes raw proyecto ${project.id}:`, data);

              if (Array.isArray(data)) {
                const integrantesConInfo = await Promise.all(
                  data.map(async (item) => {
                    const obj = item as Record<string, unknown>;
                    console.log('👤 Integrante original:', obj);

                    // Obtener el ID del usuario
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
                    }

                    console.log('🔍 Buscando info de usuario para id:', id);

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
                          console.log('✅ Info usuario obtenida:', userInfo);
                        } else {
                          console.log('⚠️ No se encontró usuario para id:', id);
                        }
                      } catch (e) {
                        console.log('❌ Error al buscar usuario:', id, e);
                      }
                    }

                    return {
                      id,
                      nombre: (userInfo.name ??
                        obj?.nombre ??
                        obj?.name ??
                        '') as string,
                      rol: (obj?.rol ?? obj?.role ?? 'Integrante') as string,
                      especialidad: (userInfo.especialidad ??
                        obj?.especialidad ??
                        '') as string,
                      email: (userInfo.email ?? obj?.email ?? '') as string,
                      github: (userInfo.github ?? obj?.github ?? '') as string,
                      linkedin: (userInfo.linkedin ??
                        obj?.linkedin ??
                        '') as string,
                    };
                  })
                );

                console.log(
                  `✅ Integrantes procesados proyecto ${project.id}:`,
                  integrantesConInfo
                );
                newMap[project.id] = integrantesConInfo;
              } else {
                console.log(
                  `⚠️ Respuesta no es array para proyecto ${project.id}`
                );
                newMap[project.id] = [];
              }
            } else {
              console.log(
                `⚠️ Error obteniendo integrantes para proyecto ${project.id}`
              );
              newMap[project.id] = [];
            }
          } catch (error) {
            console.error(
              `❌ Error fetch integrantes proyecto ${project.id}:`,
              error
            );
            newMap[project.id] = [];
          }
        })
      );

      console.log('👨‍👩‍👧‍👦 Mapa final de integrantes:', newMap);
      setIntegrantesMap(newMap);
    };

    fetchIntegrantes();
  }, [projects, userId]);

  // NUEVO: Cargar las categorías para todos los proyectos
  useEffect(() => {
    const fetchCategorias = async () => {
      if (projects.length === 0) return;

      console.log('📂 Obteniendo categorías para proyectos:', projects.length);
      const newMap: Record<number, string> = {};

      // Obtener IDs únicos de categorías
      const categoriasIds = [
        ...new Set(projects.map((p) => p.categoryId).filter(Boolean)),
      ];

      await Promise.all(
        categoriasIds.map(async (categoryId) => {
          try {
            const res = await fetch(
              `/api/projects/categoriesProjects?categoryId=${encodeURIComponent(categoryId)}`
            );
            if (res.ok) {
              const categoria = await res.json();
              const nombreCategoria = Array.isArray(categoria)
                ? categoria[0]?.name
                : categoria?.name;

              if (nombreCategoria) {
                newMap[categoryId] = nombreCategoria;
                console.log(`📂 Categoría ${categoryId}: ${nombreCategoria}`);
              }
            } else {
              console.log(`⚠️ Error obteniendo categoría ${categoryId}`);
            }
          } catch (error) {
            console.error(`❌ Error fetch categoría ${categoryId}:`, error);
          }
        })
      );

      console.log('📂 Mapa final de categorías:', newMap);
      setCategoriasMap(newMap);
    };

    fetchCategorias();
  }, [projects]);

  // Redireccionar si no está autenticado
  React.useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/auth/signin');
    }
  }, [isLoaded, userId, router]);

  React.useEffect(() => {
    if (isLoaded && userId) {
      console.log('Fetching projects for user:', userId);

      fetch('/api/projects/mis-proyectos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para enviar las cookies de Clerk
      })
        .then((res) => {
          console.log('Response status:', res.status);
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data: unknown) => {
          console.log('Received data:', data);

          if (Array.isArray(data)) {
            setProjects(
              data.map((p: Record<string, unknown>) => ({
                // Campos obligatorios
                id: typeof p.id === 'number' ? p.id : 0,
                name: typeof p.name === 'string' ? p.name : '',
                planteamiento:
                  typeof p.planteamiento === 'string' ? p.planteamiento : '',
                justificacion:
                  typeof p.justificacion === 'string' ? p.justificacion : '',
                objetivo_general:
                  typeof p.objetivo_general === 'string'
                    ? p.objetivo_general
                    : '',
                coverImageKey:
                  typeof p.coverImageKey === 'string'
                    ? p.coverImageKey
                    : undefined,
                type_project:
                  typeof p.type_project === 'string' ? p.type_project : '',
                userId: typeof p.userId === 'string' ? p.userId : '',
                categoryId: typeof p.categoryId === 'number' ? p.categoryId : 0,
                isPublic: typeof p.isPublic === 'boolean' ? p.isPublic : false,
                createdAt: typeof p.createdAt === 'string' ? p.createdAt : '',
                updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : '',
                // Virtuales para la UI
                category: typeof p.category === 'string' ? p.category : '',
                tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
                author: typeof p.author === 'string' ? p.author : 'Usuario',
                views: typeof p.views === 'number' ? p.views : 0,
                status:
                  typeof p.status === 'string' ? p.status : 'En Desarrollo',
                date: typeof p.createdAt === 'string' ? p.createdAt : '',
                title: typeof p.name === 'string' ? p.name : '',
                description:
                  typeof p.planteamiento === 'string' ? p.planteamiento : '',
                projectType:
                  typeof p.projectType === 'string'
                    ? (p.projectType as 'own' | 'taken')
                    : 'own',
              }))
            );
          } else {
            console.error('Data is not an array:', data);
            setProjects([]);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching projects:', error);
          setLoading(false);
        });
    } else if (isLoaded && !userId) {
      console.log('No user session found');
      setLoading(false);
    }
  }, [isLoaded, userId]); // Solo depende de isLoaded y userId

  // Opciones para el filtro de tipo de proyecto
  const projectTypeOptions = [
    { value: 'all', label: 'Todos los proyectos', count: projects.length },
    {
      value: 'own',
      label: 'Mis proyectos',
      count: projects.filter((p) => p.projectType === 'own').length,
    },
    {
      value: 'taken',
      label: 'Proyectos tomados',
      count: projects.filter((p) => p.projectType === 'taken').length,
    },
  ];

  // Estado para el filtro de tipo de proyecto
  const [projectTypeFilter, setProjectTypeFilter] = useState<
    'all' | 'own' | 'taken'
  >('all');

  // Calcula categorías dinámicamente según los proyectos cargados
  const categories = [
    { value: 'all', label: 'Todas las categorías', count: projects.length },
    ...Array.from(new Set(projects.map((p) => p.category ?? '')))
      .filter(Boolean)
      .map((cat) => ({
        value: cat,
        label: cat,
        count: projects.filter((p) => p.category === cat).length,
      })),
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Funciones para limpiar filtros y búsqueda
  const clearSearch = () => {
    setSearchTerm('');
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setProjectTypeFilter('all');
  };

  const resetAll = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setProjectTypeFilter('all');
  };

  // Filtra los proyectos según búsqueda y categoría
  const filteredProjects = projects.filter((project) => {
    const matchesCategory =
      selectedCategory === 'all' || project.category === selectedCategory;
    const matchesSearch =
      (project.title ?? '')
        .toLowerCase()
        .includes(searchTerm?.toLowerCase() ?? '') ||
      (project.description ?? '')
        .toLowerCase()
        .includes(searchTerm?.toLowerCase() ?? '') ||
      (project.tags ?? []).some((tag: string) =>
        tag?.toLowerCase().includes(searchTerm?.toLowerCase() ?? '')
      );
    const matchesType =
      projectTypeFilter === 'all' || project.projectType === projectTypeFilter;

    return matchesCategory && matchesSearch && matchesType;
  });

  const handleImageError = (projectId: number) => {
    setImageErrors((prev) => new Set(prev).add(projectId));
  };

  // Función para cargar los detalles completos del proyecto usando el endpoint existente
  const loadProjectDetails = async (projectId: number) => {
    setLoadingProjectDetails(true);
    try {
      const response = await fetch(`/api/projects/${projectId}?details=true`);
      if (response.ok) {
        const details: ProjectDetails = await response.json();
        setEditingProjectDetails(details);
      } else {
        console.error('Error al cargar detalles del proyecto');
        setEditingProjectDetails(null);
      }
    } catch (error) {
      console.error('Error al cargar detalles del proyecto:', error);
      setEditingProjectDetails(null);
    } finally {
      setLoadingProjectDetails(false);
    }
  };

  // Función para manejar la edición del proyecto
  const handleEditProject = async (projectId: number) => {
    setEditingProjectId(projectId);
    await loadProjectDetails(projectId);
  };

  // Función para eliminar un proyecto de la lista
  const handleDeleteProject = (projectId: number) => {
    setProjects((prevProjects) =>
      prevProjects.filter((project) => project.id !== projectId)
    );
  };

  // Función para actualizar un proyecto en la lista
  const handleUpdateProject = (
    projectId: number,
    updatedProjectData: {
      name?: string;
      planteamiento?: string;
      justificacion?: string;
      objetivo_general?: string;
      objetivos_especificos?: string[];
      actividades?: { descripcion: string; meses: number[] }[];
      type_project?: string;
      categoryId?: number;
      coverImageKey?: string;
    }
  ) => {
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            name: updatedProjectData.name ?? project.name,
            planteamiento:
              updatedProjectData.planteamiento ?? project.planteamiento,
            justificacion:
              updatedProjectData.justificacion ?? project.justificacion,
            objetivo_general:
              updatedProjectData.objetivo_general ?? project.objetivo_general,
            type_project:
              updatedProjectData.type_project ?? project.type_project,
            categoryId: updatedProjectData.categoryId ?? project.categoryId,
            coverImageKey:
              updatedProjectData.coverImageKey ?? project.coverImageKey,
            title: updatedProjectData.name ?? project.title,
            description:
              updatedProjectData.planteamiento ?? project.description,
            updatedAt: new Date().toISOString(),
          };
        }
        return project;
      })
    );
  };

  // Cerrar modal de edición
  const handleCloseEditModal = () => {
    setEditingProjectId(null);
    setEditingProjectDetails(null);
  };

  // Calcular el número máximo de meses para el cronograma del proyecto en edición
  const maxMesesEdicion = React.useMemo(() => {
    if (!editingProjectDetails?.actividades?.length) return 12;

    const allMonths = editingProjectDetails.actividades.flatMap(
      (a) => a.meses || []
    );
    return allMonths.length ? Math.max(...allMonths) + 1 : 12;
  }, [editingProjectDetails]);

  // Construir el cronograma para el modal
  const cronogramaEdicion = React.useMemo(() => {
    if (!editingProjectDetails?.actividades) return {};

    const cronograma: Record<string, number[]> = {};
    editingProjectDetails.actividades.forEach((actividad) => {
      cronograma[actividad.descripcion] = actividad.meses || [];
    });
    return cronograma;
  }, [editingProjectDetails]);

  // Mostrar loading mientras se autentica
  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
        <div className="text-xl text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#01142B] bg-gradient-to-br from-slate-900">
      {/* Header superior */}
      <div className="sticky top-0 z-50 bg-[#041C3C] shadow-md">
        <Header />
      </div>
      <main className="container mx-auto px-6 py-8">
        {/* Back Button - sticky below header */}
        <div className="sticky top-[175px] z-40 -mx-6 bg-slate-800/1 px-6 pb-2">
          <Button
            variant="ghost"
            className="group mb-4 rounded-md border border-white bg-slate-800 font-bold text-cyan-400 shadow-lg transition-all duration-200 hover:scale-105 hover:border-cyan-400 hover:bg-cyan-950/60 hover:text-cyan-300 focus:scale-105 active:scale-100"
            onClick={() => router.push('/proyectos')}
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

        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-white">
              Gestión de Proyectos
            </h1>
            <p className="text-slate-400">
              Administra y supervisa todos tus proyectos educativos
            </p>
          </div>

          {/* Filters and Search */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-slate-600 bg-slate-800/50 pr-10 pl-10 text-white placeholder:text-slate-400 focus:border-cyan-400"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 transform p-0 text-slate-400 hover:bg-cyan-400/20 hover:text-cyan-400"
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>

            <Select
              value={projectTypeFilter}
              onValueChange={(value) =>
                setProjectTypeFilter(value as 'all' | 'own' | 'taken')
              }
            >
              <SelectTrigger className="w-full border-slate-600 bg-slate-800/50 text-white md:w-48">
                <SelectValue placeholder="Tipo de proyecto" />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-slate-800 text-white">
                {projectTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full border-slate-600 bg-slate-800/50 text-white md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-slate-800 text-white">
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Botón de limpiar filtros */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-cyan-400 bg-transparent text-cyan-400 hover:bg-cyan-700/20"
              title="Limpiar filtros"
              disabled={
                selectedCategory === 'all' && projectTypeFilter === 'all'
              }
            >
              🗑️
            </Button>

            <Button
              className="bg-cyan-500 text-white hover:bg-cyan-600"
              onClick={() => {
                setPlanteamientoTexto('');
                setJustificacionTexto('');
                setObjetivoGenTexto('');
                setObjetivosEspTexto([]);
                setPlanteamientoOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </div>

          {/* Indicadores de filtros activos */}
          {(searchTerm !== '' ||
            selectedCategory !== 'all' ||
            projectTypeFilter !== 'all') && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">Filtros activos:</span>

              {searchTerm && (
                <Badge
                  variant="outline"
                  className="cursor-pointer border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20"
                  onClick={clearSearch}
                >
                  Búsqueda: &quot;{searchTerm}&quot; ✕
                </Badge>
              )}

              {selectedCategory !== 'all' && (
                <Badge
                  variant="outline"
                  className="cursor-pointer border-teal-400/50 text-teal-300 hover:bg-teal-400/20"
                  onClick={() => setSelectedCategory('all')}
                >
                  Categoría: {selectedCategory} ✕
                </Badge>
              )}

              {projectTypeFilter !== 'all' && (
                <Badge
                  variant="outline"
                  className="cursor-pointer border-purple-400/50 text-purple-300 hover:bg-purple-400/20"
                  onClick={() => setProjectTypeFilter('all')}
                >
                  Tipo:{' '}
                  {projectTypeFilter === 'own'
                    ? 'Mis proyectos'
                    : 'Proyectos tomados'}{' '}
                  ✕
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Limpiar todo
              </Button>
            </div>
          )}

          {/* Projects Grid */}
          {loading ? (
            <div className="py-12 text-center text-white">
              Cargando proyectos...
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <Card
                    key={`${project.projectType}-${project.id}`}
                    className="relative border-slate-700 bg-slate-800/50 transition-all duration-300 hover:border-cyan-400/50"
                  >
                    {/* Burbuja roja de solicitudes pendientes - SOLO para proyectos propios */}
                    {project.projectType === 'own' &&
                      project.userId === userId &&
                      solicitudesPendientesMap[project.id] > 0 && (
                        <div
                          className="absolute -top-2 -right-2 z-10 flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg"
                          title={`${solicitudesPendientesMap[project.id]} solicitudes pendientes`}
                        >
                          {solicitudesPendientesMap[project.id]}
                        </div>
                      )}

                    <CardHeader className="pb-4">
                      {/* Imagen del proyecto */}
                      <div className="relative mb-4 h-48 overflow-hidden rounded-lg">
                        {project.coverImageKey &&
                        !imageErrors.has(project.id) ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`}
                            alt={project.title ?? 'Proyecto'}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={() => {
                              console.error(
                                'Error cargando imagen del proyecto:',
                                project.title,
                                'ID:',
                                project.id
                              );
                              handleImageError(project.id);
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-700">
                            <div className="text-center text-slate-400">
                              <ImageIcon className="mx-auto mb-2 h-12 w-12" />
                              <p className="text-sm">
                                {imageErrors.has(project.id) &&
                                project.coverImageKey
                                  ? 'Error al cargar imagen'
                                  : 'Sin imagen'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start justify-between">
                        <CardTitle className="mb-2 line-clamp-2 text-xl text-white">
                          {project.title}
                        </CardTitle>
                        {/* Mostrar botones solo si el proyecto es propio */}
                        {project.projectType === 'own' &&
                          project.userId === userId && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-cyan-400 hover:bg-slate-700/50 hover:text-cyan-300"
                                onClick={() => handleEditProject(project.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:bg-slate-700/50 hover:text-red-300"
                                onClick={() => setDeletingProjectId(project.id)}
                              >
                                Eliminar
                              </Button>
                            </div>
                          )}
                      </div>
                      <p className="line-clamp-3 text-sm text-slate-400">
                        {project.description}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className={
                            project.projectType === 'own'
                              ? 'border-cyan-400/30 bg-slate-700 text-cyan-400'
                              : 'border-purple-400/30 bg-slate-700 text-purple-400'
                          }
                        >
                          {project.projectType === 'own' ? 'Propio' : 'Tomado'}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={
                            project.isPublic
                              ? 'border-green-400/30 bg-slate-700 text-green-400'
                              : 'border-orange-400/30 bg-slate-700 text-orange-400'
                          }
                        >
                          {project.isPublic ? 'Publico' : 'Privado'}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="border-blue-400/30 bg-slate-700 text-blue-400"
                        >
                          {project.status}
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Progreso</span>
                          <span className="text-cyan-400">
                            {Math.floor(Math.random() * 100)}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-700">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
                            style={{
                              width: `${Math.floor(Math.random() * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Project Details */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-slate-400">
                            <button
                              type="button"
                              onClick={() =>
                                setIntegrantesModalOpen(project.id)
                              }
                              className="flex items-center gap-1 rounded bg-[#1F3246] px-2 py-1 text-xs text-purple-300 hover:scale-105"
                            >
                              {inscritosMap[project.id] ?? 0}{' '}
                              <Users className="inline h-4 w-4 text-purple-300" />{' '}
                              Integrantes
                            </button>
                            {/* Modal para ver integrantes */}
                            {integrantesModalOpen === project.id && (
                              <ModalIntegrantesProyectoInfo
                                isOpen={true}
                                onClose={() => setIntegrantesModalOpen(null)}
                                proyecto={{
                                  id: project.id, // Añadir el ID del proyecto
                                  titulo: project.name ?? '',
                                  rama:
                                    categoriasMap[project.categoryId] ??
                                    project.category ??
                                    'Sin categoría',
                                  especialidades:
                                    integrantesMap[project.id]?.length ?? 0,
                                  participacion: project.isPublic
                                    ? 'Público'
                                    : 'Privado',
                                }}
                              />
                            )}
                          </div>
                          <div className="flex items-center text-slate-400">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>
                              {project.date
                                ? new Date(project.date).toLocaleDateString(
                                    'es-ES'
                                  )
                                : ''}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-slate-700 pt-3">
                          <div className="text-sm">
                            <span className="text-slate-400">Tipo: </span>
                            <span className="font-medium text-cyan-400">
                              {project.type_project}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-slate-400">Categoría: </span>
                            <span className="font-medium text-cyan-400">
                              {project.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 bg-cyan-500 text-white hover:bg-cyan-600"
                          onClick={() =>
                            (window.location.href = `/proyectos/DetallesProyectos/${project.id}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Proyecto
                        </Button>
                        {/* Mostrar botón de renunciar solo si es tomado */}
                        {project.projectType === 'taken' && (
                          <Button
                            variant="outline"
                            className="border-orange-500 bg-transparent text-orange-400 hover:bg-orange-500/10"
                            onClick={async () => {
                              const mensaje = prompt(
                                'Motivo de la renuncia (opcional):'
                              );

                              if (mensaje === null) {
                                return; // Usuario canceló
                              }

                              try {
                                const res = await fetch(
                                  '/api/projects/participation-requests',
                                  {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      userId,
                                      projectId: project.id,
                                      requestType: 'resignation',
                                      requestMessage: mensaje || null,
                                    }),
                                  }
                                );

                                if (res.ok) {
                                  alert(
                                    'Solicitud de renuncia enviada exitosamente. El responsable del proyecto la revisará.'
                                  );
                                  // Opcional: actualizar el estado del proyecto para mostrar "Renuncia Pendiente"
                                } else {
                                  const errorData = await res.json();
                                  alert(
                                    errorData.error ||
                                      'No se pudo enviar la solicitud de renuncia'
                                  );
                                }
                              } catch (error) {
                                console.error('Error:', error);
                                alert(
                                  'No se pudo enviar la solicitud de renuncia'
                                );
                              }
                            }}
                          >
                            Solicitar Renuncia
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Empty State
                <div className="col-span-full py-16 text-center">
                  <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-800">
                    <Plus className="h-12 w-12 text-slate-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-white">
                    No hay proyectos aún
                  </h3>
                  <p className="mb-6 text-slate-400">
                    {projectTypeFilter === 'own'
                      ? 'No tienes proyectos propios registrados.'
                      : projectTypeFilter === 'taken'
                        ? 'No has tomado ningún proyecto.'
                        : 'Comienza creando tu primer proyecto educativo'}
                  </p>
                  <Button
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                    onClick={() => {
                      setPlanteamientoTexto('');
                      setJustificacionTexto('');
                      setObjetivoGenTexto('');
                      setObjetivosEspTexto([]);
                      setPlanteamientoOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primer Proyecto
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Modales */}
          <ModalPlanteamiento
            isOpen={planteamientoOpen}
            onClose={() => setPlanteamientoOpen(false)}
            onConfirm={handleConfirmarPlanteamiento}
            texto={planteamientoTexto}
            setTexto={setPlanteamientoTexto}
          />
          <ModalJustificacion
            isOpen={justificacionOpen}
            onClose={() => setJustificacionOpen(false)}
            onAnterior={handleAnteriorJustificacion}
            onConfirm={handleConfirmarJustificacion}
            texto={justificacionTexto}
            setTexto={setJustificacionTexto}
          />
          <ModalObjetivoGen
            isOpen={objetivoGenOpen}
            onClose={() => setObjetivoGenOpen(false)}
            onAnterior={handleAnteriorObjetivoGen}
            onConfirm={handleConfirmarObjetivoGen}
            texto={objetivoGenTexto}
            setTexto={setObjetivoGenTexto}
          />
          <ModalObjetivosEsp
            isOpen={ObjetivosEspOpen}
            onClose={() => setObjetivosEspOpen(false)}
            onAnterior={handleAnteriorObjetivosEsp}
            onConfirm={handleConfirmarObjetivosEsp}
            texto={ObjetivosEspTexto}
            setTexto={setObjetivosEspTexto}
            objetivoGen={objetivoGenTexto}
            horasPorDiaProyecto={horasPorDiaProyecto}
            setHorasPorDiaProyecto={setHorasPorDiaProyecto}
            tiempoEstimadoProyecto={tiempoEstimadoProyecto}
            setTiempoEstimadoProyecto={setTiempoEstimadoProyecto}
          />
          <ModalResumen
            isOpen={ResumenOpen}
            onClose={() => setResumenOpen(false)}
            planteamiento={planteamientoTexto}
            justificacion={justificacionTexto}
            objetivoGen={objetivoGenTexto}
            objetivosEsp={ObjetivosEspTexto}
            actividad={[]} // Ya no se usa, pero el prop es requerido
            setObjetivosEsp={setObjetivosEspTexto}
            setActividades={() => {}} // Ya no se usa, pero el prop es requerido
            cronograma={undefined}
            categoriaId={undefined}
            numMeses={undefined}
            responsablesPorActividad={responsablesPorActividad}
            horasPorActividad={horasPorActividad}
            horasPorDiaProyecto={horasPorDiaProyecto}
            setHorasPorDiaProyecto={setHorasPorDiaProyecto}
            tiempoEstimadoProyecto={tiempoEstimadoProyecto}
            setTiempoEstimadoProyecto={setTiempoEstimadoProyecto}
          />
          <ModalGenerarProyecto
            isOpen={modalGenerarOpen}
            onClose={() => setModalGenerarOpen(false)}
            onProyectoGenerado={(data) => {
              setProyectoGenerado(data);
              setModalGenerarOpen(false);
              setModalResumenGeneradoOpen(true); // Abre el modal resumen con los datos generados
            }}
            resetOnOpen={modalGenerarOpen}
            objetivoGen={objetivoGenTexto}
            currentUser={{
              name: user?.fullName || user?.firstName || 'Usuario',
            }} // Pasar el usuario logueado
          />

          {/* Modal de confirmación de eliminación */}
          <ModalConfirmacionEliminacion
            isOpen={deletingProjectId !== null}
            onClose={() => setDeletingProjectId(null)}
            projectId={deletingProjectId ?? 0}
            onProjectDeleted={handleDeleteProject}
          />

          {/* Modal de edición de proyecto */}
          {editingProjectId && editingProjectDetails && (
            <ModalResumen
              isOpen={editingProjectId !== null}
              onClose={handleCloseEditModal}
              titulo={editingProjectDetails.name}
              planteamiento={editingProjectDetails.planteamiento}
              justificacion={editingProjectDetails.justificacion}
              objetivoGen={editingProjectDetails.objetivo_general}
              objetivosEsp={
                // Adaptar los objetivos específicos para el resumen de edición
                Array.isArray(editingProjectDetails.objetivos_especificos)
                  ? editingProjectDetails.objetivos_especificos.map(
                      (title, idx) => ({
                        id: String(idx) + '-' + Date.now(),
                        title,
                        activities: [],
                      })
                    )
                  : []
              }
              actividad={
                editingProjectDetails.actividades?.map((a) => a.descripcion) ??
                []
              }
              cronograma={cronogramaEdicion}
              categoriaId={editingProjectDetails.categoryId}
              numMeses={maxMesesEdicion}
              setActividades={() => {}}
              setObjetivosEsp={() => {}}
              projectId={editingProjectId}
              coverImageKey={editingProjectDetails.coverImageKey}
              tipoProyecto={editingProjectDetails.type_project}
              onUpdateProject={(updatedData) => {
                handleUpdateProject(editingProjectId, updatedData);
                handleCloseEditModal();
              }}
              responsablesPorActividad={responsablesPorActividad}
              horasPorActividad={horasPorActividad}
              horasPorDiaProyecto={horasPorDiaProyecto}
              setHorasPorDiaProyecto={setHorasPorDiaProyecto}
              tiempoEstimadoProyecto={tiempoEstimadoProyecto}
              setTiempoEstimadoProyecto={setTiempoEstimadoProyecto}
            />
          )}

          {/* Modal Resumen para proyecto generado por IA */}
          {modalResumenGeneradoOpen && proyectoGenerado && (
            <ModalResumen
              isOpen={modalResumenGeneradoOpen}
              onClose={() => setModalResumenGeneradoOpen(false)}
              titulo={proyectoGenerado.project_name ?? ''}
              planteamiento={proyectoGenerado.project_description ?? ''}
              justificacion={proyectoGenerado.justification ?? ''}
              objetivoGen={proyectoGenerado.general_objective ?? ''}
              objetivosEsp={
                Array.isArray(proyectoGenerado.specific_objectives)
                  ? proyectoGenerado.specific_objectives.map(
                      (title: string, idx: number) => ({
                        id: String(idx) + '-' + Date.now(),
                        title,
                        activities: [],
                      })
                    )
                  : []
              }
              actividad={
                Array.isArray(proyectoGenerado.tasks)
                  ? proyectoGenerado.tasks.map((t: any) => t.task_name)
                  : []
              }
              cronograma={
                Array.isArray(proyectoGenerado.tasks)
                  ? proyectoGenerado.tasks.reduce(
                      (acc: any, t: any, idx: number) => {
                        acc[t.task_name] = [idx];
                        return acc;
                      },
                      {}
                    )
                  : {}
              }
              categoriaId={proyectoGenerado.categoryId ?? undefined}
              numMeses={proyectoGenerado.numMeses ?? 1}
              setObjetivosEsp={() => {}}
              setActividades={() => {}}
              coverImageKey={undefined}
              tipoProyecto={proyectoGenerado.project_type ?? ''}
              fechaInicio={proyectoGenerado.fechaInicio ?? ''}
              fechaFin={proyectoGenerado.fechaFin ?? ''}
              tipoVisualizacion={'meses'}
              responsablesPorActividad={responsablesPorActividad}
              horasPorActividad={horasPorActividad}
            />
          )}

          {/* Loading overlay para cuando se cargan los detalles */}
          {loadingProjectDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="rounded-lg bg-slate-800 p-6 text-white">
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-cyan-400" />
                  <span>Cargando detalles del proyecto...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
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
