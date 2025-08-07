'use client';

import React, { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { typeProjects } from '~/server/actions/project/typeProject';
import { type Category } from '~/types';

interface UpdatedProjectData {
  name?: string;
  planteamiento?: string;
  justificacion?: string;
  objetivo_general?: string;
  objetivos_especificos?: string[];
  actividades?: { descripcion: string; meses: number[] }[];
  type_project?: string;
  categoryId?: number;
  coverImageKey?: string;
  fechaInicio?: string;
  fechaFin?: string;
  tipoVisualizacion?: 'meses' | 'dias' | 'horas'; // <-- Agrega 'horas' aquí
}

// Añade la interfaz SpecificObjective
interface SpecificObjective {
  id: string;
  title: string;
  activities: string[];
}

interface ModalResumenProps {
  isOpen: boolean;
  onClose: () => void;
  titulo?: string;
  planteamiento: string;
  justificacion: string;
  objetivoGen: string;
  objetivosEsp: SpecificObjective[];
  actividad: string[]; // Puedes ignorar este prop, ya que ahora las actividades están por objetivo
  cronograma?: Record<string, number[]>;
  categoriaId?: number;
  numMeses?: number;
  setObjetivosEsp: (value: SpecificObjective[]) => void;
  setActividades: (value: string[]) => void; // Puedes ignorar este prop
  projectId?: number;
  coverImageKey?: string;
  tipoProyecto?: string;
  onUpdateProject?: (updatedProject: UpdatedProjectData) => void;
  fechaInicio?: string;
  fechaFin?: string;
  tipoVisualizacion?: 'meses' | 'dias' | 'horas';
  actividades?: {
    descripcion: string;
    meses: number[];
    objetivoId?: string;
    responsibleUserId?: string;
    hoursPerDay?: number;
  }[];
  responsablesPorActividad?: { [key: string]: string };
  horasPorActividad?: { [key: string]: number };
  horasPorDiaProyecto?: number; // <-- Recibe el prop
  setHorasPorDiaProyecto?: (value: number) => void; // <-- Recibe el setter
  tiempoEstimadoProyecto?: number; // <-- Nuevo prop
  setTiempoEstimadoProyecto?: (value: number) => void; // <-- Nuevo prop
}

const ModalResumen: React.FC<ModalResumenProps> = ({
  isOpen,
  onClose,
  titulo = '',
  planteamiento,
  justificacion,
  objetivoGen,
  objetivosEsp,
  actividad,
  cronograma = {},
  categoriaId,
  numMeses: numMesesProp,
  setObjetivosEsp,
  setActividades,
  projectId,
  coverImageKey: coverImageKeyProp,
  tipoProyecto: tipoProyectoProp,
  onUpdateProject,
  fechaInicio: fechaInicioProp,
  fechaFin: fechaFinProp,
  tipoVisualizacion: tipoVisualizacionProp,
  actividades: actividadesProp = [],
  responsablesPorActividad: responsablesPorActividadProp = {},
  horasPorActividad: horasPorActividadProp = {},
  horasPorDiaProyecto: horasPorDiaProyectoProp, // <-- Recibe el prop
  setHorasPorDiaProyecto, // <-- Recibe el setter
  tiempoEstimadoProyecto: tiempoEstimadoProyectoProp, // <-- Nuevo prop
  setTiempoEstimadoProyecto, // <-- Nuevo setter
}) => {
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [categoria, setCategoria] = useState<string>('');
  const [tituloState, setTitulo] = useState(titulo);
  const [planteamientoEditado, setPlanteamientoEditado] =
    useState(planteamiento);
  const [justificacionEditada, setJustificacionEditada] =
    useState(justificacion);
  const [objetivoGenEditado, setObjetivoGenEditado] = useState(objetivoGen);
  const [objetivosEspEditado, setObjetivosEspEditado] =
    useState<SpecificObjective[]>(objetivosEsp);
  const [nuevoObjetivo, setNuevoObjetivo] = useState('');
  const [nuevaActividadPorObjetivo, setNuevaActividadPorObjetivo] = useState<{
    [id: string]: string;
  }>({});
  const [cronogramaState, setCronograma] =
    useState<Record<string, number[]>>(cronograma);
  const [fechaInicio, setFechaInicio] = useState<string>(fechaInicioProp ?? '');
  const [fechaFin, setFechaFin] = useState<string>(fechaFinProp ?? '');
  const [numMeses, setNumMeses] = useState<number>(numMesesProp ?? 1);
  const [duracionDias, setDuracionDias] = useState<number>(0);
  const [tipoVisualizacion, setTipoVisualizacion] = useState<
    'meses' | 'dias' | 'horas'
  >((tipoVisualizacionProp as 'meses' | 'dias' | 'horas') ?? 'meses');
  const [tipoProyecto, setTipoProyecto] = useState<string>(''); // Por defecto vacío
  const [imagenProyecto, setImagenProyecto] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [planGenerado, setPlanGenerado] = useState<any>(null); // Nuevo estado para la respuesta
  const isEditMode = !!projectId; // <-- AÑADE ESTA LÍNEA
  //const router = useRouter();

  const cronogramaRef = useRef<Record<string, number[]>>(cronograma);
  const tituloRef = useRef<string>(titulo);

  // Agrega un estado para responsables y horas por actividad
  const [responsablesPorActividad, setResponsablesPorActividad] = useState<{
    [key: string]: string;
  }>(responsablesPorActividadProp);
  const [horasPorActividad, setHorasPorActividad] = useState<{
    [key: string]: number;
  }>(horasPorActividadProp);
  const [usuarios, setUsuarios] = useState<{ id: string; name: string }[]>([]);

  // Add handleTextAreaChange function for auto-resize
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    // Resetear la altura para recalcular correctamente
    textarea.style.height = 'auto';

    // Calcular la altura mínima basada en el contenido
    const scrollHeight = textarea.scrollHeight;
    const minHeight = 40; // Altura mínima en píxeles
    const maxHeight = 100; // Altura máxima en píxeles

    // Aplicar la altura calculada con límites
    if (scrollHeight <= minHeight) {
      textarea.style.height = `${minHeight}px`;
    } else if (scrollHeight >= maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto'; // Mostrar scroll si excede el máximo
    } else {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = 'hidden'; // Ocultar scroll si está dentro del rango
    }
  };

  // Función para inicializar la altura de textareas existentes
  const initializeTextAreaHeight = (element: HTMLTextAreaElement) => {
    if (element && element.value) {
      const event = {
        target: element,
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleTextAreaChange(event);
    }
  };

  // useEffect para inicializar alturas cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      // Pequeño delay para asegurar que los elementos estén renderizados
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
          if (textarea instanceof HTMLTextAreaElement) {
            initializeTextAreaHeight(textarea);
          }
        });
      }, 100);
    }
  }, [
    isOpen,
    tituloState,
    planteamientoEditado,
    justificacionEditada,
    objetivoGenEditado,
    objetivosEspEditado,
  ]);

  // Nuevo estado para la cantidad de horas por día en el proyecto
  const [horasPorDiaProyectoState, setHorasPorDiaProyectoState] =
    useState<number>(horasPorDiaProyectoProp ?? 6); // Valor por defecto 6

  // Si el prop cambia, sincroniza el estado local solo si no hay setter (modo no controlado)
  useEffect(() => {
    if (
      typeof horasPorDiaProyectoProp === 'number' &&
      !setHorasPorDiaProyecto
    ) {
      setHorasPorDiaProyectoState(horasPorDiaProyectoProp);
    }
  }, [horasPorDiaProyectoProp, setHorasPorDiaProyecto]);

  // Decide el valor y el setter a usar
  const horasPorDiaValue =
    typeof horasPorDiaProyectoProp === 'number' && setHorasPorDiaProyecto
      ? horasPorDiaProyectoProp
      : horasPorDiaProyectoState;
  const handleHorasPorDiaChange = (val: number) => {
    if (setHorasPorDiaProyecto) {
      setHorasPorDiaProyecto(val);
    } else {
      setHorasPorDiaProyectoState(val);
    }
  };

  // Nuevo estado para el tiempo estimado si no es controlado
  const [tiempoEstimadoProyectoState, setTiempoEstimadoProyectoState] =
    useState<number>(tiempoEstimadoProyectoProp ?? 0);

  // Si el prop cambia, sincroniza el estado local solo si no hay setter (modo no controlado)
  useEffect(() => {
    if (
      typeof tiempoEstimadoProyectoProp === 'number' &&
      !setTiempoEstimadoProyecto
    ) {
      setTiempoEstimadoProyectoState(tiempoEstimadoProyectoProp);
    }
  }, [tiempoEstimadoProyectoProp, setTiempoEstimadoProyecto]);

  // Decide el valor y el setter a usar
  const tiempoEstimadoValue =
    typeof tiempoEstimadoProyectoProp === 'number' && setTiempoEstimadoProyecto
      ? tiempoEstimadoProyectoProp
      : tiempoEstimadoProyectoState;
  const handleTiempoEstimadoChange = (val: number) => {
    if (setTiempoEstimadoProyecto) {
      setTiempoEstimadoProyecto(val);
    } else {
      setTiempoEstimadoProyectoState(val);
    }
  };

  // Calcular el total de horas del proyecto
  const totalHorasProyecto =
    duracionDias > 0 ? duracionDias * horasPorDiaValue : 0;

  // Calcular la cantidad total de actividades (sumando todas las actividades de todos los objetivos)
  const totalActividades = objetivosEspEditado.reduce(
    (acc, obj) => acc + obj.activities.length,
    0
  );

  // Calcular las horas por actividad (distribución equitativa)
  const horasPorActividadDistribuidas =
    totalActividades > 0
      ? Math.floor(totalHorasProyecto / totalActividades)
      : 0;

  // Sincronizar automáticamente las horas por actividad distribuidas
  useEffect(() => {
    if (totalActividades > 0 && horasPorActividadDistribuidas > 0) {
      const nuevasHoras: { [key: string]: number } = {};
      objetivosEspEditado.forEach((obj) => {
        obj.activities.forEach((_, actIdx) => {
          const actividadKey = `${obj.id}_${actIdx}`;
          nuevasHoras[actividadKey] = horasPorActividadDistribuidas;
        });
      });
      setHorasPorActividad(nuevasHoras);
    }
    // Solo actualizar cuando cambian las actividades o el cálculo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalActividades, horasPorActividadDistribuidas, objetivosEspEditado]);

  useEffect(() => {
    // Cargar todos los usuarios existentes para el selector de responsables
    const fetchUsuarios = async () => {
      try {
        const res = await fetch('/api/projects/UsersResponsable');
        const data = await res.json();
        // Normaliza el array para asegurar que tenga id y name
        const usuariosFormateados = Array.isArray(data)
          ? data.map((u: any) => ({
              id: u.id ?? '',
              name: u.name && u.name.trim() !== '' ? u.name : (u.email ?? ''),
            }))
          : [];
        setUsuarios(usuariosFormateados);
      } catch (error) {
        setUsuarios([]);
      }
    };
    fetchUsuarios();
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch('/api/super-admin/categories');
        const data = (await res.json()) as Category[];
        setCategorias(data);
      } catch (error) {
        console.error('Error al cargar las categorías:', error);
      }
    };
    void fetchCategorias();
  }, []);

  useEffect(() => setPlanteamientoEditado(planteamiento), [planteamiento]);
  useEffect(() => setJustificacionEditada(justificacion), [justificacion]);
  useEffect(() => setObjetivoGenEditado(objetivoGen), [objetivoGen]);
  useEffect(() => setObjetivosEspEditado(objetivosEsp), [objetivosEsp]);
  // useEffect(() => setActividadEditada(actividad), [actividad]); // Elimina esta línea

  // Función para calcular los meses entre dos fechas
  const calcularMesesEntreFechas = (inicio: string, fin: string): string[] => {
    if (!inicio || !fin) return [];

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    if (fechaInicio > fechaFin) return [];

    const meses: string[] = [];
    const fechaActual = new Date(fechaInicio);

    while (fechaActual <= fechaFin) {
      meses.push(
        fechaActual
          .toLocaleString('es-ES', { month: 'long', year: 'numeric' })
          .toUpperCase()
      );
      fechaActual.setMonth(fechaActual.getMonth() + 1);
    }

    return meses;
  };

  // Función para calcular los días entre dos fechas (devuelve array de fechas)
  const calcularDiasEntreFechas = (inicio: string, fin: string): string[] => {
    if (!inicio || !fin) return [];

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    if (fechaInicio > fechaFin) return [];

    const dias: string[] = [];
    const fechaActual = new Date(fechaInicio);

    while (fechaActual <= fechaFin) {
      dias.push(fechaActual.toLocaleDateString('es-ES'));
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    return dias;
  };

  // Función para calcular la duración en días (número)
  const calcularDuracionDias = (inicio: string, fin: string): number => {
    if (!inicio || !fin) return 0;

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    if (fechaInicio > fechaFin) return 0;

    const diferenciaTiempo = fechaFin.getTime() - fechaInicio.getTime();
    const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)) + 1;

    return diferenciaDias;
  };

  // Función para formatear la duración
  const formatearDuracion = (dias: number): string => {
    if (dias === 0) return '';

    if (dias < 30) {
      return `${dias} día${dias !== 1 ? 's' : ''}`;
    } else {
      const meses = Math.floor(dias / 30);
      const diasRestantes = dias % 30;

      if (diasRestantes === 0) {
        return `${meses} mes${meses !== 1 ? 'es' : ''}`;
      } else {
        return `${meses} mes${meses !== 1 ? 'es' : ''} y ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`;
      }
    }
  };

  // Función para detectar el tipo de cronograma cuando estamos en modo edición
  const detectarTipoCronograma = React.useMemo(() => {
    if (!isEditMode || !cronograma || Object.keys(cronograma).length === 0) {
      return { tipo: 'meses', maxUnidades: numMeses };
    }

    const allValues = Object.values(cronograma).flat();
    if (!allValues.length) return { tipo: 'meses', maxUnidades: numMeses };

    const maxValue = Math.max(...allValues);
    const esProbablementeDias = maxValue >= 10;

    let maxUnidades = maxValue + 1;
    if (esProbablementeDias) {
      maxUnidades = Math.max(maxUnidades, 24);
    }

    return {
      tipo: esProbablementeDias ? 'dias' : 'meses',
      maxUnidades,
    };
  }, [isEditMode, cronograma, numMeses]);

  // Generar cronograma basado en fechas o en detección automática
  const generarCronogramaAutomatico = React.useMemo(() => {
    // Asegura que tipoVisualizacion siempre sea 'meses' o 'dias'
    const tipo =
      tipoVisualizacion === 'dias'
        ? 'dias'
        : tipoVisualizacion === 'meses'
          ? 'meses'
          : 'meses';

    if (fechaInicio && fechaFin) {
      const mesesCalculados = calcularMesesEntreFechas(fechaInicio, fechaFin);
      const diasCalculados = calcularDiasEntreFechas(fechaInicio, fechaFin);

      return {
        meses: tipo === 'meses' ? mesesCalculados : diasCalculados,
        unidades:
          tipo === 'meses' ? mesesCalculados.length : diasCalculados.length,
      };
    } else if (isEditMode && cronograma && Object.keys(cronograma).length > 0) {
      const detected = detectarTipoCronograma;
      const unidades = Array.from({ length: detected.maxUnidades }, (_, i) => {
        if (detected.tipo === 'dias') {
          const fecha = new Date();
          fecha.setDate(fecha.getDate() + i);
          return fecha.toLocaleDateString('es-ES');
        } else {
          const fecha = new Date();
          fecha.setMonth(fecha.getMonth() + i);
          return fecha
            .toLocaleString('es-ES', { month: 'long', year: 'numeric' })
            .toUpperCase();
        }
      });

      return {
        meses: unidades,
        unidades: detected.maxUnidades,
      };
    } else {
      return {
        meses: Array.from({ length: numMeses }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() + i);
          return date.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
        }),
        unidades: numMeses,
      };
    }
  }, [
    fechaInicio,
    fechaFin,
    tipoVisualizacion,
    isEditMode,
    cronograma,
    numMeses,
    detectarTipoCronograma,
  ]);

  // Actualizar el cálculo de períodos según la visualización seleccionada
  const periodosVisualizacion: string[] = generarCronogramaAutomatico.meses;

  // Mantener compatibilidad con el código existente
  const meses: string[] = periodosVisualizacion;

  // Calcular array de horas para el cronograma por horas
  const horasPorDia = 24;
  const periodosHoras: string[] =
    fechaInicio && fechaFin && tipoVisualizacion === 'horas'
      ? Array.from({ length: duracionDias * horasPorDia }, (_, i) => {
          const fecha = new Date(fechaInicio);
          fecha.setHours(0, 0, 0, 0);
          fecha.setDate(fecha.getDate() + Math.floor(i / horasPorDia));
          const hora = i % horasPorDia;
          return (
            fecha.toLocaleDateString('es-ES') +
            ' ' +
            hora.toString().padStart(2, '0') +
            ':00'
          );
        })
      : [];

  // Actualizar numMeses cuando cambien las fechas
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const fechaInicioObj = new Date(fechaInicio);
      const fechaFinObj = new Date(fechaFin);

      if (fechaInicioObj <= fechaFinObj) {
        const mesesCalculados = calcularMesesEntreFechas(fechaInicio, fechaFin);
        const diasCalculados = calcularDuracionDias(fechaInicio, fechaFin);
        setNumMeses(mesesCalculados.length);
        setDuracionDias(diasCalculados);
      }
    }
  }, [fechaInicio, fechaFin]);

  // Cambiar automáticamente a visualización por días si la duración es menor a 28 días
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const dias = calcularDuracionDias(fechaInicio, fechaFin);
      if (dias > 0 && dias < 28 && tipoVisualizacion !== 'dias') {
        setTipoVisualizacion('dias');
      }
    }
    // No forzar a "meses" si es >= 28, el usuario puede cambiarlo manualmente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicio, fechaFin]);

  const toggleMesActividad = (actividad: string, mesIndex: number) => {
    setCronograma((prev) => {
      const meses = prev[actividad] || [];
      const nuevos = meses.includes(mesIndex)
        ? meses.filter((m) => m !== mesIndex)
        : [...meses, mesIndex];

      const nuevoCronograma = { ...prev, [actividad]: nuevos };
      // Actualizar también la referencia
      cronogramaRef.current = nuevoCronograma;
      return nuevoCronograma;
    });
  };

  const renumerarObjetivos = (objetivos: SpecificObjective[]) => {
    return objetivos.map((obj, idx) => ({
      ...obj,
      title: `OE ${idx + 1}. ${obj.title.replace(/^OE \d+\.\s*/, '')}`,
      activities: obj.activities.map(
        (act, actIdx) =>
          // Extraer solo el texto puro de la actividad, sin importar el OE/ACT anterior
          `OE ${idx + 1}. ACT ${actIdx + 1}. ${act.replace(/^OE \d+\. ACT \d+\.\s*/, '')}`
      ),
    }));
  };

  // Asegúrate de definir las funciones de manejo de objetivos y actividades antes del return
  const handleAgregarObjetivo = () => {
    if (nuevoObjetivo.trim()) {
      const nextNumber = objetivosEspEditado.length + 1;
      const newObj: SpecificObjective = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        title: `OE ${nextNumber}. ${nuevoObjetivo.trim()}`,
        activities: [],
      };
      const nuevos = renumerarObjetivos([...objetivosEspEditado, newObj]);
      setObjetivosEspEditado(nuevos);
      setObjetivosEsp(nuevos);
      setNuevoObjetivo('');
    }
  };

  const handleEditarObjetivo = (index: number, value: string) => {
    const copia = [...objetivosEspEditado];
    copia[index] = { ...copia[index], title: value };
    setObjetivosEspEditado(copia);
    setObjetivosEsp(copia);
  };

  const handleEliminarObjetivo = (index: number) => {
    const copia = objetivosEspEditado.filter((_, i) => i !== index);
    const renumerados = renumerarObjetivos(copia);
    setObjetivosEspEditado(renumerados);
    setObjetivosEsp(renumerados);
  };

  const handleAgregarActividad = (objectiveId: string) => {
    const actividad = nuevaActividadPorObjetivo[objectiveId]?.trim();
    if (actividad) {
      const nuevos = objetivosEspEditado.map((obj, idx) =>
        obj.id === objectiveId
          ? {
              ...obj,
              activities: [...obj.activities, actividad],
            }
          : obj
      );
      const renumerados = renumerarObjetivos(nuevos);
      setObjetivosEspEditado(renumerados);
      setObjetivosEsp(renumerados);
      setNuevaActividadPorObjetivo((prev) => ({ ...prev, [objectiveId]: '' }));
      // Opcional: inicializa responsable y horas para la nueva actividad
      const nuevaActividadIdx =
        renumerados.find((o) => o.id === objectiveId)?.activities.length ?? 1;
      const actividadKey = `${objectiveId}_${nuevaActividadIdx - 1}`;
      setResponsablesPorActividad((prev) => ({ ...prev, [actividadKey]: '' }));
      setHorasPorActividad((prev) => ({ ...prev, [actividadKey]: 1 }));
    }
  };

  const handleEditarActividad = (
    objectiveId: string,
    idx: number,
    value: string
  ) => {
    const nuevos = objetivosEspEditado.map((obj) =>
      obj.id === objectiveId
        ? {
            ...obj,
            activities: obj.activities.map((act, i) =>
              i === idx ? value : act
            ),
          }
        : obj
    );
    setObjetivosEspEditado(nuevos);
    setObjetivosEsp(nuevos);
  };

  const handleEliminarActividad = (objectiveId: string, idx: number) => {
    const nuevos = objetivosEspEditado.map((obj, objIdx) =>
      obj.id === objectiveId
        ? {
            ...obj,
            activities: obj.activities.filter((_, i) => i !== idx),
          }
        : obj
    );
    // Renumerar después de eliminar
    const renumerados = renumerarObjetivos(nuevos);
    setObjetivosEspEditado(renumerados);
    setObjetivosEsp(renumerados);
  };

  // Al guardar, transforma los datos para el backend
  const handleGuardarProyecto = async () => {
    if (
      !tituloState ||
      !categoria ||
      !planteamientoEditado ||
      !justificacionEditada ||
      !objetivoGenEditado ||
      !fechaInicio ||
      !fechaFin
    ) {
      alert(
        'Por favor completa todos los campos requeridos, incluyendo las fechas del proyecto.'
      );
      return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    // Mapear actividades con los nombres correctos del schema
    const actividadesMapped = objetivosEspEditado.flatMap((obj) =>
      obj.activities
        .map((descripcion, idx) => {
          const desc =
            typeof descripcion === 'string' ? descripcion.trim() : '';

          // Solo incluir actividades válidas
          if (!desc || desc === 'default') return null;

          const actividadKey = `${obj.id}_${idx}`;
          const responsableId = responsablesPorActividad[actividadKey];
          const horas = horasPorActividad[actividadKey];

          console.log(`Mapeando actividad ${actividadKey}:`, {
            descripcion: desc,
            responsableId,
            horas,
          });

          return {
            descripcion: desc,
            meses: Array.isArray(cronogramaState[desc])
              ? cronogramaState[desc]
              : [],
            objetivoId: obj.id,
            responsibleUserId:
              responsableId && responsableId.trim() !== ''
                ? responsableId
                : undefined, // Campo correcto del schema
            hoursPerDay: typeof horas === 'number' && horas > 0 ? horas : 1, // Campo correcto del schema
          };
        })
        .filter(
          (actividad): actividad is NonNullable<typeof actividad> =>
            actividad !== null
        )
    );

    console.log('Actividades mapeadas para enviar:', actividadesMapped);

    let coverImageKey: string | undefined = coverImageKeyProp;

    try {
      if (imagenProyecto) {
        // 1. Solicita presigned POST a /api/upload
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: imagenProyecto.type,
            fileSize: imagenProyecto.size,
            fileName: imagenProyecto.name,
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error(
            `Error al iniciar la carga: ${uploadResponse.statusText}`
          );
        }

        const uploadData = (await uploadResponse.json()) as {
          url: string;
          fields: Record<string, string>;
          key: string;
          fileName: string;
          coverImageKey: string;
        };

        const {
          url,
          fields,
          key,
          coverImageKey: responseCoverImageKey,
        } = uploadData;
        coverImageKey = responseCoverImageKey ?? key;

        // 2. Sube la imagen a S3 usando el presigned POST
        const formData = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          if (typeof v === 'string') {
            formData.append(k, v);
          }
        });
        formData.append('file', imagenProyecto);

        const s3Upload = await fetch(url, {
          method: 'POST',
          body: formData,
        });

        if (!s3Upload.ok) {
          throw new Error('Error al subir la imagen a S3');
        }
      }

      // Construir el objeto del proyecto con todos los campos necesarios
      const proyecto = {
        name: tituloState,
        categoryId: parseInt(categoria),
        planteamiento: planteamientoEditado,
        justificacion: justificacionEditada,
        objetivo_general: objetivoGenEditado,
        objetivos_especificos: objetivosEspEditado.map((obj) => ({
          id: obj.id,
          title: obj.title,
        })), // <-- Enviar como array de objetos
        actividades: actividadesMapped,
        type_project: tipoProyecto,
        coverImageKey,
        fechaInicio, // Mantener como está para no afectar el funcionamiento
        fechaFin, // Mantener como está para no afectar el funcionamiento
        tipoVisualizacion, // Mantener como está para no afectar el funcionamiento
        isPublic: false,
      };

      console.log(
        'Proyecto completo a enviar:',
        JSON.stringify(proyecto, null, 2)
      );

      setIsUpdating(true);

      if (isEditMode) {
        // ACTUALIZAR PROYECTO EXISTENTE
        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(proyecto),
        });

        if (!response.ok) throw new Error('Error al actualizar el proyecto');

        // Llamar callback para actualizar el estado del componente padre con los datos actuales
        if (onUpdateProject) {
          onUpdateProject({
            name: tituloState,
            planteamiento: planteamientoEditado,
            justificacion: justificacionEditada,
            objetivo_general: objetivoGenEditado,
            objetivos_especificos: objetivosEspEditado.map((obj) => obj.title),
            actividades: actividadesMapped,
            type_project: tipoProyecto,
            categoryId: parseInt(categoria),
            coverImageKey,
            fechaInicio,
            fechaFin,
            tipoVisualizacion,
          });
        }

        onClose();
      } else {
        // CREAR NUEVO PROYECTO
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(proyecto),
        });

        interface ProyectoResponse {
          id?: number;
        }
        const data: ProyectoResponse = await response.json();

        if (!response.ok) throw new Error('Error al guardar el proyecto');

        if (data.id) {
          window.location.href = `/proyectos/DetallesProyectos/${data.id}`;
        } else {
          onClose();
        }
      }
    } catch (error) {
      console.error('Error al guardar el proyecto:', error);
      alert('Hubo un problema al guardar el proyecto');
    } finally {
      setIsUpdating(false);
    }
  };

  // Previsualización de la imagen seleccionada
  useEffect(() => {
    if (imagenProyecto) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImagen(reader.result as string);
      reader.readAsDataURL(imagenProyecto);
    } else {
      setPreviewImagen(null);
    }
  }, [imagenProyecto]);

  // Calcular la URL de la imagen existente usando useMemo
  const imagenExistente = React.useMemo(() => {
    if (!isEditMode || !coverImageKeyProp) return null;
    const s3Url = process.env.NEXT_PUBLIC_AWS_S3_URL;
    if (!s3Url) {
      console.warn('NEXT_PUBLIC_AWS_S3_URL no está configurada');
      return null;
    }
    const fullUrl = `${s3Url}/${coverImageKeyProp}`;
    console.log('Imagen existente URL:', fullUrl);
    return fullUrl;
  }, [isEditMode, coverImageKeyProp]);

  // Sincronizar el tipo de proyecto en modo edición
  useEffect(() => {
    if (isEditMode && tipoProyectoProp && isOpen) {
      setTipoProyecto(tipoProyectoProp);
    }
  }, [isEditMode, tipoProyectoProp, isOpen]);

  // Sincroniza la categoría seleccionada si viene de edición
  useEffect(() => {
    if (categoriaId !== undefined && categoriaId !== null && isOpen) {
      setCategoria(String(categoriaId));
    }
  }, [categoriaId, isOpen]);

  useEffect(() => {
    if (typeof numMesesProp === 'number' && numMesesProp > 0) {
      setNumMeses(numMesesProp);
    }
  }, [numMesesProp]);

  // Sincronizar el título solo cuando se abre el modal en modo edición
  useEffect(() => {
    if (isEditMode && isOpen && titulo) {
      setTitulo(titulo);
    } else if (!isEditMode && isOpen) {
      // En modo crear, limpiar el título
      setTitulo('');
    }
  }, [isEditMode, isOpen, titulo]);

  // Limpiar campos específicos cuando está en modo crear
  useEffect(() => {
    if (!isEditMode && isOpen) {
      // Limpiar campos que no vienen de otros modales
      setCategoria('');
      setNumMeses(1);
      setTipoProyecto(typeProjects[0]?.value || '');
      setImagenProyecto(null);
      setPreviewImagen(null);
      setFechaInicio('');
      setFechaFin('');
      setTipoVisualizacion('meses');
    }
  }, [isEditMode, isOpen]);

  // Sincronizar cronograma con props de forma segura
  useEffect(() => {
    if (isOpen && Object.keys(cronograma).length > 0) {
      cronogramaRef.current = cronograma;
      setCronograma(cronograma);
    }
  }, [isOpen, cronograma]);

  // Sincronizar título de forma segura
  useEffect(() => {
    if (isOpen && titulo !== tituloRef.current) {
      tituloRef.current = titulo;
      setTitulo(titulo);
    }
  }, [isOpen, titulo]);

  // Sincronizar fechas en modo edición
  useEffect(() => {
    if (isEditMode && isOpen) {
      if (fechaInicioProp) {
        // Si la fecha viene en formato ISO, extrae solo la parte de la fecha
        const fInicio =
          fechaInicioProp.length > 10 && fechaInicioProp.includes('T')
            ? fechaInicioProp.split('T')[0]
            : fechaInicioProp;
        setFechaInicio(fInicio);
      }
      if (fechaFinProp) {
        const fFin =
          fechaFinProp.length > 10 && fechaFinProp.includes('T')
            ? fechaFinProp.split('T')[0]
            : fechaFinProp;
        setFechaFin(fFin);
      }
    }
  }, [isEditMode, isOpen, fechaInicioProp, fechaFinProp]);

  // Sincronizar responsables y horas de actividades en modo edición
  useEffect(() => {
    if (isEditMode && isOpen && Array.isArray(actividadesProp)) {
      const nuevosResponsables: { [key: string]: string } = {};
      const nuevasHoras: { [key: string]: number } = {};

      actividadesProp.forEach((act, idx) => {
        if (act.objetivoId) {
          // Buscar el índice de la actividad dentro del objetivo correspondiente
          const objIdx = objetivosEsp.findIndex(
            (obj) => obj.id === act.objetivoId
          );
          if (objIdx !== -1) {
            // Buscar el índice real de la actividad dentro del objetivo
            const actIdx = objetivosEsp[objIdx].activities.findIndex(
              (a) => a.trim() === act.descripcion.trim()
            );
            const actividadKey = `${act.objetivoId}_${actIdx !== -1 ? actIdx : idx}`;
            if (act.responsibleUserId) {
              nuevosResponsables[actividadKey] = act.responsibleUserId;
            }
            if (typeof act.hoursPerDay === 'number') {
              nuevasHoras[actividadKey] = act.hoursPerDay;
            }
          }
        }
      });

      setResponsablesPorActividad(nuevosResponsables);
      setHorasPorActividad(nuevasHoras);
    }
  }, [isEditMode, isOpen, actividadesProp, objetivosEsp]);

  // Elimina uno de los useEffect duplicados que sincronizan actividades en modo edición.
  // Solo deja el siguiente (el que compara antes de setear para evitar bucles infinitos):
  useEffect(() => {
    if (
      isEditMode &&
      isOpen &&
      Array.isArray(actividadesProp) &&
      actividadesProp.length > 0
    ) {
      // 1. Reconstruir los objetivos y actividades para el formulario
      const objetivosMap: { [id: string]: SpecificObjective } = {};
      actividadesProp.forEach((act) => {
        if (!act.objetivoId) return;
        if (!objetivosMap[act.objetivoId]) {
          // Busca el título del objetivo en los objetivos originales
          const objetivo = objetivosEsp.find((o) => o.id === act.objetivoId);
          objetivosMap[act.objetivoId] = {
            id: act.objetivoId,
            title: objetivo ? objetivo.title : '',
            activities: [],
          };
        }
        objetivosMap[act.objetivoId].activities.push(act.descripcion);
      });
      // Si no hay actividades, mantener los objetivos originales
      const nuevosObjetivos =
        Object.values(objetivosMap).length > 0
          ? Object.values(objetivosMap)
          : objetivosEsp;

      setObjetivosEspEditado((prev) => {
        const prevStr = JSON.stringify(prev);
        const nextStr = JSON.stringify(nuevosObjetivos);
        return prevStr !== nextStr ? nuevosObjetivos : prev;
      });

      // 2. Sincronizar responsables y horas
      const nuevosResponsables: { [key: string]: string } = {};
      const nuevasHoras: { [key: string]: number } = {};
      actividadesProp.forEach((act) => {
        if (!act.objetivoId) return;
        const objIdx = nuevosObjetivos.findIndex(
          (o) => o.id === act.objetivoId
        );
        if (objIdx !== -1) {
          const actIdx = nuevosObjetivos[objIdx].activities.findIndex(
            (a) => a.trim() === act.descripcion.trim()
          );
          const actividadKey = `${act.objetivoId}_${actIdx !== -1 ? actIdx : 0}`;
          if (act.responsibleUserId) {
            nuevosResponsables[actividadKey] = act.responsibleUserId;
          }
          if (typeof act.hoursPerDay === 'number') {
            nuevasHoras[actividadKey] = act.hoursPerDay;
          }
        }
      });
      setResponsablesPorActividad((prev) => {
        const prevStr = JSON.stringify(prev);
        const nextStr = JSON.stringify(nuevosResponsables);
        return prevStr !== nextStr ? nuevosResponsables : prev;
      });
      setHorasPorActividad((prev) => {
        const prevStr = JSON.stringify(prev);
        const nextStr = JSON.stringify(nuevasHoras);
        return prevStr !== nextStr ? nuevasHoras : prev;
      });

      // 3. Sincronizar cronograma
      const nuevoCronograma: Record<string, number[]> = {};
      actividadesProp.forEach((act) => {
        if (act.descripcion && Array.isArray(act.meses)) {
          nuevoCronograma[act.descripcion] = act.meses;
        }
      });
      setCronograma((prev) => {
        const prevStr = JSON.stringify(prev);
        const nextStr = JSON.stringify(nuevoCronograma);
        return prevStr !== nextStr ? nuevoCronograma : prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, isOpen, actividadesProp]);

  // Función para generar el plan del proyecto
  const handleGenerarPlanProyecto = async () => {
    const data = {
      project_type: tipoProyecto,
      industry: categorias.find((c) => c.id === Number(categoria))?.name || '',
      project_objectives: objetivoGenEditado,
      team_members: '', // Puedes agregar lógica para obtener miembros
      project_requirements: planteamientoEditado,
    };

    try {
      const response = await fetch('/api/plan_project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      setPlanGenerado(result);

      // Si la respuesta tiene milestones, actualiza objetivos y actividades
      if (result && Array.isArray(result.milestones)) {
        // Extrae milestone_name como objetivos específicos
        const nuevosObjetivos = result.milestones
          .map((m: any) => m.milestone_name)
          .filter((name: string) => !!name);

        // Extrae todas las tareas de todos los milestones
        const nuevasActividades = result.milestones
          .flatMap((m: any) => (Array.isArray(m.tasks) ? m.tasks : []))
          .filter((task: string) => !!task);

        setObjetivosEsp(nuevosObjetivos);
        setObjetivosEspEditado(nuevosObjetivos);
        setActividades(nuevasActividades);
      }
    } catch (error) {
      alert('Error al generar el plan de proyecto');
    }
  };

  const handleAbrirPlanEnNuevaPagina = () => {
    if (!planGenerado) return;
    // Intenta abrir la ventana antes de cualquier lógica para evitar bloqueos de popup
    const win = window.open('about:blank', '_blank');
    if (!win) {
      alert(
        'No se pudo abrir la nueva página. Permite popups en tu navegador.'
      );
      return;
    }
    // Espera a que la ventana esté lista antes de escribir el contenido
    setTimeout(() => {
      const html = `
      <html>
        <head>
          <title>Plan Generado por IA</title>
          <style>
            body { background: #0F2940; color: #fff; font-family: sans-serif; padding: 2rem; }
            pre { background: #222; color: #fff; padding: 1rem; border-radius: 8px; }
            h1 { color: #00bcd4; }
          </style>
        </head>
        <body>
          <h1>Plan Generado por IA</h1>
          <pre>${escapeHtml(JSON.stringify(planGenerado, null, 2))}</pre>
        </body>
      </html>
    `;
      win.document.open();
      win.document.write(html);
      win.document.close();
    }, 0);
  };

  function escapeHtml(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
    >
      <div className="relative h-full max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-[#0F2940] p-3 text-white shadow-lg sm:p-6">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-xl font-bold text-white hover:text-red-500 sm:top-3 sm:right-4 sm:text-2xl"
        >
          ✕
        </button>

        {/* Espacio para la imagen del proyecto */}
        <div className="mb-4 flex flex-col items-center sm:mb-6">
          <div className="mb-2 flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg bg-gray-200 sm:h-40 sm:w-40">
            {previewImagen ? (
              <Image
                src={previewImagen}
                alt="Imagen del proyecto"
                width={160}
                height={160}
                className="h-full w-full object-cover"
                style={{ objectFit: 'cover' }}
              />
            ) : imagenExistente ? (
              <Image
                src={imagenExistente}
                alt="Imagen del proyecto"
                width={160}
                height={160}
                className="h-full w-full object-cover"
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            ) : (
              <span className="text-gray-500">Sin imagen</span>
            )}
          </div>
          <label className="cursor-pointer rounded bg-cyan-700 px-3 py-1 text-sm text-white hover:bg-cyan-800 sm:px-4 sm:py-2 sm:text-base">
            {isEditMode ? 'Cambiar imagen' : 'Seleccionar imagen'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImagenProyecto(file);
                }
              }}
            />
          </label>
        </div>

        <br />
        <br />
        <textarea
          value={tituloState}
          onChange={(e) => {
            setTitulo(e.target.value);
            handleTextAreaChange(e);
          }}
          rows={1}
          className="mb-4 w-full resize-none overflow-hidden rounded border p-2 text-center text-xl font-semibold text-cyan-300 sm:mb-6 sm:text-2xl md:text-3xl"
          placeholder="Título del Proyecto"
        />

        <form className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <div className="col-span-1 lg:col-span-2">
            <label className="text-sm text-cyan-300 sm:text-base">
              Planteamiento del problema
            </label>
            <textarea
              value={planteamientoEditado}
              onChange={(e) => {
                setPlanteamientoEditado(e.target.value);
                handleTextAreaChange(e);
              }}
              rows={1}
              className="mt-1 w-full resize-none overflow-hidden rounded border bg-gray-400 p-2 text-black"
              placeholder="Describe el planteamiento del problema"
            />
          </div>

          <div className="col-span-1 lg:col-span-2">
            <label className="text-sm text-cyan-300 sm:text-base">
              Justificación
            </label>
            <textarea
              value={justificacionEditada}
              onChange={(e) => {
                setJustificacionEditada(e.target.value);
                handleTextAreaChange(e);
              }}
              rows={1}
              className="mt-1 w-full resize-none overflow-hidden rounded border bg-gray-400 p-2 text-black"
              placeholder="Justifica la necesidad del proyecto"
            />
          </div>

          <div className="col-span-1 lg:col-span-2">
            <label className="text-sm text-cyan-300 sm:text-base">
              Objetivo General
            </label>
            <textarea
              value={objetivoGenEditado}
              onChange={(e) => {
                setObjetivoGenEditado(e.target.value);
                handleTextAreaChange(e);
              }}
              rows={1}
              className="mt-1 w-full resize-none overflow-hidden rounded border bg-gray-400 p-2 text-black"
              placeholder="Define el objetivo general del proyecto"
            />
          </div>

          <div className="col-span-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label
              className="text-sm font-medium text-cyan-300 sm:text-base"
              htmlFor="horasPorDiaProyecto"
            >
              Horas por día de trabajo:
            </label>
            <input
              id="horasPorDiaProyecto"
              type="number"
              min={1}
              max={24}
              value={horasPorDiaValue}
              onChange={(e) => {
                const num = Number(e.target.value);
                if (!isNaN(num) && num >= 1 && num <= 24) {
                  handleHorasPorDiaChange(num);
                }
              }}
              className="rounded bg-gray-400 p-1 text-black"
            />
          </div>
          {/* Izquierda: Horas totales del proyecto*/}
          <div className="col-span-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label
              className="text-sm font-medium text-cyan-300 sm:text-base"
              htmlFor="horasPorProyecto"
            >
              Tiempo estimado del proyecto:
            </label>
            <input
              id="horasPorProyecto"
              type="number"
              min={0}
              value={tiempoEstimadoValue}
              onChange={(e) => {
                const num = Number(e.target.value);
                if (!isNaN(num) && num >= 0) {
                  handleTiempoEstimadoChange(num);
                }
              }}
              className="rounded bg-gray-400 p-1 text-black"
            />
          </div>
          {/* Fechas responsive */}
          <div className="col-span-1">
            <label className="mb-1 block text-sm font-medium text-cyan-300 sm:text-base">
              Fecha de Inicio del Proyecto
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded bg-gray-400 p-2 text-black"
              required
            />
          </div>

          <div className="col-span-1">
            <label className="mb-1 block text-sm font-medium text-cyan-300 sm:text-base">
              Fecha de Fin del Proyecto
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              min={fechaInicio}
              className="w-full rounded bg-gray-400 p-2 text-black"
              required
            />
          </div>

          {/* Horas por día responsive */}
          {fechaInicio && fechaFin && (
            <>
              <div className="col-span-1 flex items-center">
                <span className="text-sm font-semibold text-cyan-200 sm:text-base">
                  Total de horas: {totalHorasProyecto}
                </span>
              </div>
            </>
          )}

          {/* Objetivos específicos */}
          <div className="col-span-1 lg:col-span-2">
            <label className="text-sm text-cyan-300 sm:text-base">
              Objetivos Específicos
            </label>
            {/* Lista de objetivos responsive */}
            <div className="m-2 mb-2 gap-2">
              <ul className="mb-2 space-y-4">
                {objetivosEspEditado.map((obj, idx) => (
                  <li key={obj.id}>
                    <div className="mb-2 rounded-lg border border-slate-600 bg-slate-700/50 p-3 sm:p-4">
                      {/* Header objetivo */}
                      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 text-sm font-semibold break-words hyphens-auto text-cyan-300 sm:pr-2 sm:text-lg">
                          {obj.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleEliminarObjetivo(idx)}
                          className="h-7 w-7 flex-shrink-0 self-end rounded bg-red-600 p-0 text-white hover:bg-red-700 sm:h-8 sm:w-8 sm:self-start"
                        >
                          <span className="text-xs sm:text-sm">✕</span>
                        </button>
                      </div>
                      {/* Agregar actividad */}
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                        <textarea
                          value={nuevaActividadPorObjetivo[obj.id] || ''}
                          onChange={(e) => {
                            setNuevaActividadPorObjetivo((prev) => ({
                              ...prev,
                              [obj.id]: e.target.value,
                            }));
                            handleTextAreaChange(e);
                          }}
                          rows={1}
                          className="w-full resize-none overflow-hidden rounded border-none bg-gray-500 p-2 text-xs break-words text-white placeholder:text-gray-300 sm:text-sm"
                          placeholder="Nueva actividad para este objetivo..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAgregarActividad(obj.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAgregarActividad(obj.id)}
                          className="w-full flex-shrink-0 rounded bg-green-600 px-3 py-2 text-xl font-semibold text-white hover:bg-green-700 sm:w-auto sm:px-4 sm:text-2xl"
                        >
                          +
                        </button>
                      </div>
                      {/* Lista de actividades */}
                      <div className="space-y-2">
                        {obj.activities.length > 0 && (
                          <div className="mb-2 text-xs text-gray-300 sm:text-sm">
                            Actividades ({obj.activities.length}):
                          </div>
                        )}
                        {obj.activities.map((act, actIdx) => {
                          const actividadKey = `${obj.id}_${actIdx}`;
                          const responsableId =
                            responsablesPorActividad[actividadKey] || '';
                          const responsableObj = usuarios.find(
                            (u) => u.id === responsableId
                          );
                          return (
                            <div
                              key={actIdx}
                              className="flex flex-col gap-2 rounded bg-slate-600/50 p-2 text-xs sm:flex-row sm:items-start sm:text-sm"
                            >
                              <span className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 break-words hyphens-auto text-gray-200 sm:pr-2">
                                {act}
                              </span>
                              {/* Responsable */}
                              <span className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 break-words hyphens-auto text-gray-200 sm:pr-2">
                                {responsableObj ? responsableObj.name : ''}
                              </span>
                              {/* Horas */}
                              <input
                                type="number"
                                min={1}
                                value={
                                  horasPorActividad[actividadKey] ||
                                  horasPorActividadDistribuidas
                                }
                                onChange={(e) =>
                                  setHorasPorActividad((prev) => ({
                                    ...prev,
                                    [actividadKey]: Number(e.target.value),
                                  }))
                                }
                                className="w-16 rounded bg-gray-300 p-1 text-xs text-black sm:text-sm"
                                placeholder="Horas"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleEliminarActividad(obj.id, actIdx)
                                }
                                className="h-5 w-5 flex-shrink-0 self-end rounded bg-red-600 p-0 text-white hover:bg-red-700 sm:h-6 sm:w-6 sm:self-start"
                              >
                                <span className="text-xs sm:text-sm">✕</span>
                              </button>
                            </div>
                          );
                        })}
                        {obj.activities.length === 0 && (
                          <div className="text-xs text-gray-400 italic sm:text-sm">
                            No hay actividades agregadas para este objetivo
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Selectores responsive */}
          <div className="flex flex-col">
            <label className="text-sm text-cyan-300 sm:text-base">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 rounded border bg-gray-400 p-2 text-black"
              required
            >
              <option value="" className="text-gray-500">
                -- Seleccione una Categoría --
              </option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-cyan-300 sm:text-base">
              Tipo de Proyecto
            </label>
            <select
              value={tipoProyecto}
              onChange={(e) => setTipoProyecto(e.target.value)}
              className="mt-1 rounded border bg-gray-400 p-2 text-black"
              required
            >
              {typeProjects.map((tp) => (
                <option
                  key={tp.value}
                  value={tp.value}
                  disabled={tp.value === ''}
                >
                  {tp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Información de duración responsive */}
          {fechaInicio && fechaFin && (
            <div className="col-span-1 mb-4 lg:col-span-2">
              <span className="block text-xs text-gray-300 sm:text-sm">
                Duración: {formatearDuracion(duracionDias)} ({duracionDias} días
                en total)
              </span>
              <span className="block text-xs text-gray-400">
                Cronograma:{' '}
                {tipoVisualizacion === 'meses'
                  ? `${calcularMesesEntreFechas(fechaInicio, fechaFin).length} mes${calcularMesesEntreFechas(fechaInicio, fechaFin).length !== 1 ? 'es' : ''}`
                  : `${duracionDias} día${duracionDias !== 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          {/* Selector de visualización responsive */}
          {fechaInicio && fechaFin && (
            <div className="col-span-1 mb-4 lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-cyan-300 sm:text-base">
                Visualización del Cronograma
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                {duracionDias >= 28 && (
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="meses"
                      checked={tipoVisualizacion === 'meses'}
                      onChange={(e) =>
                        setTipoVisualizacion(
                          e.target.value as 'meses' | 'dias' | 'horas'
                        )
                      }
                      className="text-cyan-500"
                    />
                    <span className="text-sm sm:text-base">Por Meses</span>
                  </label>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="dias"
                    checked={tipoVisualizacion === 'dias'}
                    onChange={(e) =>
                      setTipoVisualizacion(
                        e.target.value as 'meses' | 'dias' | 'horas'
                      )
                    }
                    className="text-cyan-500"
                  />
                  <span className="text-sm sm:text-base">Por Días</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="horas"
                    checked={tipoVisualizacion === 'horas'}
                    onChange={(e) =>
                      setTipoVisualizacion(
                        e.target.value as 'meses' | 'dias' | 'horas'
                      )
                    }
                    className="text-cyan-500"
                  />
                  <span className="text-sm sm:text-base">Por Horas</span>
                </label>
              </div>
            </div>
          )}
        </form>

        {/* Cronograma responsive */}
        {fechaInicio && fechaFin && duracionDias > 0 && (
          <div className="mt-4 overflow-x-auto sm:mt-6">
            <h3 className="mb-2 text-base font-semibold text-cyan-300 sm:text-lg">
              Cronograma{' '}
              {tipoVisualizacion === 'meses'
                ? 'por Meses'
                : tipoVisualizacion === 'dias'
                  ? 'por Días'
                  : 'por Horas'}
            </h3>
            {(
              tipoVisualizacion === 'horas'
                ? totalActividades > 0
                : meses.length > 0
            ) ? (
              <div className="max-h-64 overflow-y-auto">
                {tipoVisualizacion === 'horas' ? (
                  <table className="w-full table-auto border-collapse text-sm text-black">
                    <thead className="sticky top-0 z-10 bg-gray-300">
                      <tr>
                        <th
                          className="sticky left-0 z-10 border bg-gray-300 px-2 py-2 text-left break-words"
                          style={{ minWidth: 180 }}
                        >
                          Actividad
                        </th>
                        <th className="border px-2 py-2 text-left break-words">
                          Total de Horas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {objetivosEspEditado.map((obj) => (
                        <React.Fragment key={obj.id}>
                          {obj.activities.map((act, idx) => {
                            const actividadKey = `${obj.id}_${idx}`;
                            const responsableId =
                              responsablesPorActividad[actividadKey] || '';
                            const responsableObj = usuarios.find(
                              (u) => u.id === responsableId
                            );
                            const horasActividad =
                              horasPorActividad[actividadKey] ||
                              horasPorActividadDistribuidas;
                            return (
                              <tr key={idx}>
                                <td
                                  className="sticky left-0 z-10 border bg-white px-2 py-2 font-medium break-words"
                                  style={{ minWidth: 180 }}
                                >
                                  {act}
                                  {responsableObj && (
                                    <div className="text-xs font-semibold text-cyan-700">
                                      Responsable: {responsableObj.name}
                                    </div>
                                  )}
                                </td>
                                <td className="border bg-cyan-100 px-2 py-2 text-center font-bold">
                                  {horasActividad}
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full table-auto border-collapse text-sm text-black">
                    <thead className="sticky top-0 z-10 bg-gray-300">
                      <tr>
                        <th
                          className="sticky left-0 z-10 border bg-gray-300 px-2 py-2 text-left break-words"
                          style={{ minWidth: 180 }}
                        >
                          Actividad
                        </th>
                        {meses.map((periodo, i) => (
                          <th
                            key={i}
                            className="border px-2 py-2 text-left break-words whitespace-normal"
                            style={{
                              minWidth:
                                tipoVisualizacion === 'dias' ? '80px' : '120px',
                            }}
                          >
                            {periodo}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {objetivosEspEditado.map((obj) => (
                        <React.Fragment key={obj.id}>
                          {obj.activities.map((act, idx) => {
                            const actividadKey = `${obj.id}_${idx}`;
                            const responsableId =
                              responsablesPorActividad[actividadKey] || '';
                            const responsableObj = usuarios.find(
                              (u) => u.id === responsableId
                            );
                            return (
                              <tr key={idx}>
                                <td
                                  className="sticky left-0 z-10 border bg-white px-2 py-2 font-medium break-words"
                                  style={{ minWidth: 180 }}
                                >
                                  {act}
                                  {responsableObj && (
                                    <div className="text-xs font-semibold text-cyan-700">
                                      Responsable: {responsableObj.name}
                                    </div>
                                  )}
                                </td>
                                {meses.map((_, i) => (
                                  <td
                                    key={i}
                                    onClick={() => toggleMesActividad(act, i)}
                                    className={`cursor-pointer border px-2 py-2 ${
                                      cronogramaState[act]?.includes(i)
                                        ? 'bg-cyan-300 font-bold text-white'
                                        : 'bg-white'
                                    }`}
                                  />
                                ))}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <p className="text-gray-300">
                Selecciona las fechas de inicio y fin para ver el cronograma
              </p>
            )}
          </div>
        )}

        {/* Botones responsive */}
        <div className="mt-4 flex flex-col justify-center gap-3 sm:mt-6 sm:flex-row sm:gap-4">
          <button
            onClick={handleGuardarProyecto}
            className="rounded bg-green-700 px-4 py-2 text-base font-bold text-white hover:bg-green-600 sm:px-6 sm:text-lg"
            disabled={isUpdating}
          >
            {isEditMode ? 'Actualizar Proyecto' : 'Crear Proyecto'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-red-700 px-4 py-2 text-base font-bold text-white hover:bg-red-600 sm:px-6 sm:text-lg"
            disabled={isUpdating}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalResumen;
