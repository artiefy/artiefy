'use client';

import React, { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

import { useUser } from '@clerk/nextjs'; // Añade este import
import DatePicker from 'react-datepicker';
import { FaArrowLeft, FaRegCalendarAlt, FaRegClock } from 'react-icons/fa';

import { typeProjects } from '~/server/actions/project/typeProject';
import { type Category } from '~/types';

import 'react-datepicker/dist/react-datepicker.css';

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
  cronograma?: Record<string, number[]>;
  categoriaId?: number;
  numMeses?: number;
  setObjetivosEsp: (value: SpecificObjective[]) => void;
  setActividades: (value: string[]) => void;
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
  responsablesPorActividad?: Record<string, string>;
  horasPorActividad?: Record<string, number>;
  setHorasPorActividad?: (value: Record<string, number>) => void; // <-- Nuevo setter
  horasPorDiaProyecto?: number; // <-- Recibe el prop
  setHorasPorDiaProyecto?: (value: number) => void; // <-- Recibe el setter
  tiempoEstimadoProyecto?: number; // <-- Nuevo prop
  setTiempoEstimadoProyecto?: (value: number) => void; // <-- Nuevo setter
  onAnterior?: () => void; // <-- Nueva prop opcional para volver atrás
  setPlanteamiento?: (value: string) => void; // <-- Nuevo prop
  setJustificacion?: (value: string) => void; // <-- Nuevo prop
  setObjetivoGen?: (value: string) => void; // <-- Nuevo prop
}

const ModalResumen: React.FC<ModalResumenProps> = ({
  isOpen,
  onClose,
  titulo = '',
  planteamiento,
  justificacion,
  objetivoGen,
  objetivosEsp,
  cronograma = {},
  numMeses: _numMesesProp, // <-- Cambia aquí para evitar warning de unused var
  tipoProyecto: _tipoProyectoProp,
  tipoVisualizacion: tipoVisualizacionProp,
  tiempoEstimadoProyecto: _tiempoEstimadoProyectoProp,
  setObjetivosEsp: setObjetivosEspProp,
  setActividades: _setActividades, // unused
  projectId,
  coverImageKey: _coverImageKeyProp, // unused
  onUpdateProject: _onUpdateProject, // unused
  fechaInicio: fechaInicioProp,
  fechaFin: fechaFinProp,
  actividades: _actividadesProp = [],
  responsablesPorActividad: responsablesPorActividadProp = {},
  horasPorActividad: horasPorActividadProp = {},
  setHorasPorActividad,
  horasPorDiaProyecto: horasPorDiaProyectoProp,
  setHorasPorDiaProyecto,
  setTiempoEstimadoProyecto,
  onAnterior, // <-- Recibe la prop
  setPlanteamiento,
  setJustificacion,
  setObjetivoGen,
}) => {
  const { user } = useUser(); // Obtén el usuario logueado

  // Solo mantener un estado local para horas por actividad
  const [horasPorActividadLocal, setHorasPorActividadLocal] = useState<
    Record<string, number>
  >({});
  const [duracionDias, setDuracionDias] = useState<number>(0);
  const [diasPorActividad, setDiasPorActividad] = useState<
    Record<string, number[]>
  >({});

  // Define horasPorActividadFinal al inicio para evitar errores de uso antes de declaración
  const horasPorActividadFinal =
    typeof setHorasPorActividad === 'function'
      ? horasPorActividadProp
      : horasPorActividadLocal;

  // Modo edición: true si hay projectId
  const isEditMode = !!projectId;

  // ELIMINAR TODOS LOS ESTADOS DUPLICADOS DE HORAS
  // const [responsablesPorActividad, setResponsablesPorActividad] = useState<{
  //   [key: string]: string;
  // }>(responsablesPorActividadProp);
  // const [horasPorActividad, setHorasPorActividad] = useState<{
  //   [key: string]: number;
  // }>(horasPorActividadProp);

  // Solo mantener un estado local para horas por actividad
  // const [horasPorActividadLocal, setHorasPorActividadLocal] = useState<
  //   Record<string, number>
  // >({});

  // Estado para responsables
  const [responsablesPorActividadLocal, setResponsablesPorActividadLocal] =
    useState<Record<string, string>>(responsablesPorActividadProp);

  // Estado para tipo de visualización
  const [tipoVisualizacion, setTipoVisualizacion] = useState<
    'meses' | 'dias' | 'horas'
  >(
    typeof tipoVisualizacionProp === 'string' ? tipoVisualizacionProp : 'meses'
  );

  // --- NUEVO: Cambiar visualización por defecto según duración ---
  useEffect(() => {
    if (!isOpen) return;
    if (duracionDias < 28 && tipoVisualizacion !== 'dias') {
      setTipoVisualizacion('dias');
    } else if (duracionDias >= 28 && tipoVisualizacion !== 'meses') {
      setTipoVisualizacion('meses');
    }
    // Solo cambia si la duración y visualización no coinciden
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duracionDias, isOpen]);

  // Add missing state for isUpdating, previewImagen, setImagenProyecto, tipoProyecto, setTipoProyecto
  const [isUpdating, _setIsUpdating] = useState(false);
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  const [imagenProyecto, setImagenProyecto] = useState<File | null>(null);
  const [tipoProyecto, setTipoProyecto] = useState<string>(
    _tipoProyectoProp ?? ''
  );

  // Sync previewImagen when imagenProyecto changes
  useEffect(() => {
    if (imagenProyecto) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImagen(reader.result as string);
      reader.readAsDataURL(imagenProyecto);
    } else {
      setPreviewImagen(null);
    }
  }, [imagenProyecto]);

  // Función de cambio SIMPLIFICADA
  const handleHorasCambio = (actividadKey: string, value: number) => {
    console.log(`Cambiando horas ${actividadKey} a ${value}`);

    if (typeof setHorasPorActividad === 'function') {
      // Modo controlado - usar setter del padre
      setHorasPorActividad({
        ...horasPorActividadFinal,
        [actividadKey]: value,
      });
    } else {
      // Modo no controlado - usar estado local
      setHorasPorActividadLocal((prev) => ({
        ...prev,
        [actividadKey]: value,
      }));
    }
  };

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
  // Estado para controlar si la fecha inicial ha sido editada manualmente
  const [fechaInicioEditadaManualmente, setFechaInicioEditadaManualmente] =
    useState<boolean>(false);
  // Estado para controlar si la fecha final ha sido editada manualmente
  const [fechaFinEditadaManualmente, setFechaFinEditadaManualmente] =
    useState<boolean>(false);
  const [fechaInicioDomingoError, setFechaInicioDomingoError] = useState(false);

  // Calcular el total de horas dinámicamente
  const totalHorasActividadesCalculado = useMemo(() => {
    if (!objetivosEspEditado || objetivosEspEditado.length === 0) {
      // No mostrar logs ni calcular si no hay objetivos
      return 0;
    }
    console.log('=== CALCULANDO TOTAL DE HORAS ===');
    console.log('Objetivos:', objetivosEspEditado);
    console.log('Horas finales:', horasPorActividadFinal);

    let total = 0;
    objetivosEspEditado.forEach((obj) => {
      obj.activities.forEach((_, actIdx) => {
        const actividadKey = `${obj.id}_${actIdx}`;
        const horas = horasPorActividadFinal[actividadKey];
        const horasValidas = typeof horas === 'number' && horas > 0 ? horas : 1;
        total += horasValidas;
        console.log(`${actividadKey}: ${horasValidas}h (acumulado: ${total}h)`);
      });
    });

    console.log('Total calculado:', total);
    return total;
  }, [objetivosEspEditado, horasPorActividadFinal]);

  // Actualizar tiempo estimado automáticamente
  useEffect(() => {
    if (
      totalHorasActividadesCalculado > 0 &&
      typeof setTiempoEstimadoProyecto === 'function'
    ) {
      setTiempoEstimadoProyecto(totalHorasActividadesCalculado);
    }
  }, [totalHorasActividadesCalculado, setTiempoEstimadoProyecto]);

  // Sincronización cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      console.log('=== MODAL RESUMEN ABIERTO ===');
      console.log('Objetivos recibidos:', objetivosEsp);
      console.log('Horas props:', horasPorActividadProp);

      // Sincronizar objetivos
      if (objetivosEsp && objetivosEsp.length > 0) {
        setObjetivosEspEditado(objetivosEsp);
      }

      // Forzar sincronización de horas si hay datos
      if (
        horasPorActividadProp &&
        Object.keys(horasPorActividadProp).length > 0
      ) {
        console.log('Forzando sincronización de horas al abrir modal');
        setHorasPorActividadLocal(horasPorActividadProp);
      }
    }
  }, [isOpen, objetivosEsp, horasPorActividadProp]);
  const [nuevoObjetivo, setNuevoObjetivo] = useState('');
  const [nuevaActividadPorObjetivo, setNuevaActividadPorObjetivo] = useState<
    Record<string, string>
  >({});
  const [cronogramaState /* setCronograma */] =
    useState<Record<string, number[]>>(cronograma);
  const [fechaInicio, setFechaInicio] = useState<string>(
    fechaInicioProp && fechaInicioProp.trim() !== ''
      ? fechaInicioProp
      : getTodayDateString()
  );
  const [fechaFin, setFechaFin] = useState<string>(fechaFinProp ?? '');

  // Solo sincroniza la fecha de inicio cuando cambia el prop desde el padre
  useEffect(() => {
    console.log(
      '[ModalResumen] fechaInicioProp desde el padre:',
      fechaInicioProp
    );
    if (fechaInicioProp && fechaInicioProp.trim() !== '') {
      // Si la fecha de inicio recibida es domingo, ajusta al lunes siguiente
      const date = new Date(fechaInicioProp);
      if (date.getDay() === 0) {
        date.setDate(date.getDate() + 1);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        setFechaInicio(`${yyyy}-${mm}-${dd}`);
      } else {
        setFechaInicio(fechaInicioProp);
      }
    } else {
      setFechaInicio(getTodayDateString());
    }
  }, [fechaInicioProp]);

  // Al abrir el modal, asegura que la fecha de inicio nunca sea domingo
  useEffect(() => {
    if (isOpen) {
      // Si la fecha de inicio actual es domingo, ajusta al lunes siguiente
      if (fechaInicio) {
        const date = new Date(fechaInicio);
        if (date.getDay() === 0) {
          date.setDate(date.getDate() + 1);
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          setFechaInicio(`${yyyy}-${mm}-${dd}`);
        }
      }
    }
    // Solo depende de isOpen y fechaInicio para evitar loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Remove unused states
  // const [numMeses, setNumMeses] = useState<number>(numMesesProp ?? 1);
  // const [duracionDias, setDuracionDias] = useState<number>(0);
  // const [imagenProyecto, setImagenProyecto] = useState<File | null>(null);
  // const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  // const [isUpdating, setIsUpdating] = useState(false);
  // const cronogramaRef = useRef<Record<string, number[]>>(cronograma);
  // const tituloRef = useRef<string>(titulo);

  // Agrega un estado para responsables y horas por actividad
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

  // useEffect para inicializar alturas cuando se abra el modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
          if (textarea instanceof HTMLTextAreaElement) {
            // Inline initializeTextAreaHeight logic
            if (textarea?.value) {
              textarea.style.height = 'auto';
              const scrollHeight = textarea.scrollHeight;
              const minHeight = 40;
              const maxHeight = 100;
              if (scrollHeight <= minHeight) {
                textarea.style.height = `${minHeight}px`;
              } else if (scrollHeight >= maxHeight) {
                textarea.style.height = `${maxHeight}px`;
                textarea.style.overflowY = 'auto';
              } else {
                textarea.style.height = `${scrollHeight}px`;
                textarea.style.overflowY = 'hidden';
              }
            }
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
      !setHorasPorDiaProyecto &&
      horasPorDiaProyectoProp !== horasPorDiaProyectoState
    ) {
      setHorasPorDiaProyectoState(horasPorDiaProyectoProp);
    }
  }, [
    horasPorDiaProyectoProp,
    setHorasPorDiaProyecto,
    horasPorDiaProyectoState,
  ]);

  // Decide el valor y el setter a usar
  const horasPorDiaValue =
    typeof horasPorDiaProyectoProp === 'number' && setHorasPorDiaProyecto
      ? horasPorDiaProyectoProp
      : horasPorDiaProyectoState;
  const handleHorasPorDiaChange = (val: number) => {
    if (setHorasPorDiaProyecto) {
      setHorasPorDiaProyecto(val); // <-- Propaga cambio global
    } else {
      setHorasPorDiaProyectoState(val);
    }
  };

  // Estado local para tiempo estimado si no es controlado
  // const [tiempoEstimadoProyectoState, setTiempoEstimadoProyectoState] =
  //   useState<number>(tiempoEstimadoProyectoProp ?? 0);

  // Si el prop cambia, sincroniza el estado local solo si no hay setter (modo no controlado)
  useEffect(() => {
    if (
      typeof _tiempoEstimadoProyectoProp === 'number' &&
      !setTiempoEstimadoProyecto
    ) {
      // setTiempoEstimadoProyectoState(_tiempoEstimadoProyectoProp);
      // No action needed if not using local state
    }
  }, [_tiempoEstimadoProyectoProp, setTiempoEstimadoProyecto]);

  // Corrige el error de variable no definida y prefer-const en el cálculo de la fecha de fin automática:
  useEffect(() => {
    // Corrige el cálculo de la fecha de fin: solo calcula automáticamente si la fecha de fin NO ha sido editada manualmente Y existen actividades
    // Verifica si hay al menos una actividad en los objetivos específicos
    const hayActividades =
      Array.isArray(objetivosEspEditado) &&
      objetivosEspEditado.some(
        (obj) => Array.isArray(obj.activities) && obj.activities.length > 0
      );

    if (
      !fechaInicio ||
      !totalHorasActividadesCalculado ||
      !horasPorDiaValue ||
      fechaFinEditadaManualmente || // Solo no calcular si la fecha de fin fue editada manualmente
      !hayActividades
    )
      return;

    // Calcula la cantidad de días necesarios (redondea hacia arriba)
    const diasNecesarios = Math.ceil(
      totalHorasActividadesCalculado / horasPorDiaValue
    );

    // Calcula la fecha de fin sumando días laborables (lunes a sábado)
    let diasAgregados = 0;
    // Usar la fecha seleccionada por el usuario como punto de partida
    const [yyyy, mm, dd] = fechaInicio.split('-');
    const fecha = new Date(Number(yyyy), Number(mm) - 1, Number(dd));

    // Si la fecha de inicio es domingo, avanza al lunes siguiente
    if (fecha.getDay() === 0) {
      fecha.setDate(fecha.getDate() + 1);
    }

    while (diasAgregados < diasNecesarios) {
      const day = fecha.getDay();
      if (day !== 0) {
        // lunes a sábado
        diasAgregados++;
      }
      if (diasAgregados < diasNecesarios) {
        fecha.setDate(fecha.getDate() + 1);
        // Si cae en domingo, saltar al lunes
        if (fecha.getDay() === 0) {
          fecha.setDate(fecha.getDate() + 1);
        }
      }
    }
    // Si el último día cae en domingo, avanza al lunes siguiente
    if (fecha.getDay() === 0) {
      fecha.setDate(fecha.getDate() + 1);
    }
    // Formatea la fecha a YYYY-MM-DD
    const yyyyFin = fecha.getFullYear();
    const mmFin = String(fecha.getMonth() + 1).padStart(2, '0');
    const ddFin = String(fecha.getDate()).padStart(2, '0');
    const nuevaFechaFin = `${yyyyFin}-${mmFin}-${ddFin}`;

    // Solo actualiza si es diferente para evitar loops infinitos
    if (fechaFin !== nuevaFechaFin) {
      setFechaFin(nuevaFechaFin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fechaInicio,
    totalHorasActividadesCalculado,
    horasPorDiaValue,
    fechaFinEditadaManualmente,
    objetivosEspEditado, // para detectar cambios en actividades
  ]);

  // Elimina la función no usada para evitar el warning de ESLint
  // function handleFechaFinChange(nuevaFecha: string) {
  //   setFechaFin(nuevaFecha);
  //   setFechaFinEditadaManualmente(true);
  // }

  // Si la fecha de inicio es mayor a la de fin, intercambiarlas
  useEffect(() => {
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
      setFechaFin(fechaInicio);
    }
  }, [fechaInicio, fechaFin]);

  // Fix unsafe member access for users in fetchUsuarios
  useEffect(() => {
    // Cargar todos los usuarios existentes para el selector de responsables
    const fetchUsuarios = async () => {
      try {
        const res = await fetch('/api/projects/UsersResponsable');
        const data = await res.json();
        // Safe type check for user objects
        const usuariosFormateados = Array.isArray(data)
          ? data.map((u: unknown) => {
              if (
                u &&
                typeof u === 'object' &&
                'id' in u &&
                ('name' in u || 'email' in u)
              ) {
                return {
                  id: (u as { id: string }).id ?? '',
                  name:
                    typeof (u as { name: string }).name === 'string' &&
                    (u as { name: string }).name.trim() !== ''
                      ? (u as { name: string }).name
                      : ((u as { email?: string }).email ?? ''),
                };
              }
              return { id: '', name: '' };
            })
          : [];
        setUsuarios(usuariosFormateados);
      } catch {
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

  // Fix: remove setTiempoEstimadoProyectoState usage
  useEffect(() => {
    if (
      totalHorasActividadesCalculado > 0 &&
      typeof setTiempoEstimadoProyecto === 'function'
    ) {
      setTiempoEstimadoProyecto(totalHorasActividadesCalculado);
    }
  }, [totalHorasActividadesCalculado, setTiempoEstimadoProyecto]);

  // Sincronizar objetivos y horas al abrir el modal en modo edición
  useEffect(() => {
    if (isEditMode && isOpen) {
      if (objetivosEsp && objetivosEsp.length > 0) {
        setObjetivosEspEditado(objetivosEsp);
      }
      if (
        horasPorActividadProp &&
        Object.keys(horasPorActividadProp).length > 0
      ) {
        setHorasPorActividadLocal(horasPorActividadProp);
      }
    }
  }, [isOpen, objetivosEsp, horasPorActividadProp, isEditMode]);

  // Sincronizar campos de texto al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setTitulo(titulo);
      setPlanteamientoEditado(planteamiento);
      setJustificacionEditada(justificacion);
      setObjetivoGenEditado(objetivoGen);
      setObjetivosEspEditado(objetivosEsp);
    }
  }, [isOpen, titulo, planteamiento, justificacion, objetivoGen, objetivosEsp]);

  // Cuando se edite planteamiento, justificación, objetivo general u objetivos específicos, propaga el cambio al estado global
  useEffect(() => {
    if (setPlanteamiento) setPlanteamiento(planteamientoEditado);
  }, [planteamientoEditado, setPlanteamiento]);

  useEffect(() => {
    if (setJustificacion) setJustificacion(justificacionEditada);
  }, [justificacionEditada, setJustificacion]);

  useEffect(() => {
    if (setObjetivoGen) setObjetivoGen(objetivoGenEditado);
  }, [objetivoGenEditado, setObjetivoGen]);

  useEffect(() => {
    if (setObjetivosEspProp) setObjetivosEspProp(objetivosEspEditado);
  }, [objetivosEspEditado, setObjetivosEspProp]);

  // Calcular duración en días y establecer estado inicial
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const diff =
        Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      setDuracionDias(diff > 0 ? diff : 0);
    } else {
      setDuracionDias(0);
    }
  }, [fechaInicio, fechaFin]);

  // --- MES RENDER LOGIC ---
  // El problema es que el cronograma solo muestra columnas para las fechas existentes en el rango,
  // pero si solo hay dos fechas, el segundo día no se muestra hasta que hay una tercera.
  // Solución: Asegúrate de que el array 'meses' (que representa los días laborables) siempre tenga
  // al menos tantos días como el máximo índice asignado en diasPorActividad + 1.

  // Justo antes del render del cronograma, fuerza el tamaño de 'meses' si es necesario:
  // Eliminar maxDiaAsignado porque ya no se usa y causa warning de eslint
  // const maxDiaAsignado = useMemo(() => {
  //   if (tipoVisualizacion !== undefined && tipoVisualizacion !== 'dias')
  //     return 0;
  //   let max = 0;
  //   Object.values(diasPorActividad ?? {}).forEach((arr) => {
  //     if (Array.isArray(arr)) {
  //       arr.forEach((idx: number) => {
  //         if (idx > max) max = idx;
  //       });
  //     }
  //   });
  //   return max;
  // }, [diasPorActividad, tipoVisualizacion]);

  const meses: string[] = useMemo(() => {
    if (fechaInicio && fechaFin) {
      if (tipoVisualizacion === 'dias') {
        // Mostrar todos los días laborales (lunes a sábado)
        const fechaInicioDate = new Date(fechaInicio + 'T00:00:00');
        const fechaFinDate = new Date(fechaFin + 'T00:00:00');
        const dias: string[] = [];
        const fechaActual = new Date(fechaInicioDate);
        while (fechaActual.getTime() <= fechaFinDate.getTime()) {
          const day = fechaActual.getDay();
          if (day !== 0) {
            // 0 = domingo, incluye lunes a sábado
            dias.push(
              `${fechaActual.getFullYear()}-${String(
                fechaActual.getMonth() + 1
              ).padStart(
                2,
                '0'
              )}-${String(fechaActual.getDate()).padStart(2, '0')}`
            );
          }
          fechaActual.setDate(fechaActual.getDate() + 1);
          fechaActual.setHours(0, 0, 0, 0);
        }
        return dias;
      } else {
        const fechaInicioDate = new Date(fechaInicio);
        const fechaFinDate = new Date(fechaFin);
        const mesesArr: string[] = [];
        const fechaActual = new Date(fechaInicioDate);
        while (fechaActual <= fechaFinDate) {
          mesesArr.push(
            fechaActual
              .toLocaleString('es-ES', { month: 'long', year: 'numeric' })
              .toUpperCase()
          );
          fechaActual.setMonth(fechaActual.getMonth() + 1);
        }
        return mesesArr;
      }
    }
    return [];
  }, [fechaInicio, fechaFin, tipoVisualizacion]);

  const mesesRender: string[] = useMemo(() => {
    // Para visualización por días, solo mostrar hasta la fecha de fin (no extender artificialmente)
    if (tipoVisualizacion !== undefined && tipoVisualizacion !== 'dias')
      return meses;
    return meses;
  }, [meses, tipoVisualizacion]);

  // Fix: imagenExistente definition (move above render)
  const imagenExistente = useMemo(() => {
    if (!projectId || !_coverImageKeyProp) return null;
    const s3Url = process.env.NEXT_PUBLIC_AWS_S3_URL;
    if (!s3Url) return null;
    return `${s3Url}/${_coverImageKeyProp}`;
  }, [projectId, _coverImageKeyProp]);

  // Agregar objetivo
  const handleAgregarObjetivo = () => {
    if (!nuevoObjetivo.trim()) return;
    const nuevoObj: SpecificObjective = {
      id: Date.now().toString(),
      title: nuevoObjetivo.trim(),
      activities: [],
    };
    setObjetivosEspEditado((prev) => {
      const nuevos = [...prev, nuevoObj];
      if (setObjetivosEspProp) setObjetivosEspProp(nuevos);
      return nuevos;
    });
    setNuevoObjetivo('');
  };

  // Eliminar objetivo
  const handleEliminarObjetivo = (index: number) => {
    setObjetivosEspEditado((prev) => {
      const nuevos = [...prev];
      nuevos.splice(index, 1);
      if (setObjetivosEspProp) setObjetivosEspProp(nuevos);
      return nuevos;
    });
  };

  // Agregar actividad
  const handleAgregarActividad = (objetivoId: string) => {
    const descripcion = nuevaActividadPorObjetivo[objetivoId]?.trim();
    if (!descripcion) return;
    setObjetivosEspEditado((prev) => {
      const nuevos = prev.map((obj) => {
        if (obj.id === objetivoId) {
          return {
            ...obj,
            activities: [...obj.activities, descripcion],
          };
        }
        return obj;
      });
      if (setObjetivosEspProp) setObjetivosEspProp(nuevos);
      return nuevos;
    });
    // Asigna responsable logueado si no existe
    const actIdx =
      objetivosEspEditado.find((obj) => obj.id === objetivoId)?.activities
        .length ?? 0;
    const actividadKey = `${objetivoId}_${actIdx}`;
    setResponsablesPorActividadLocal((prev) => ({
      ...prev,
      [actividadKey]: user?.id ?? '',
    }));
    setNuevaActividadPorObjetivo((prev) => ({ ...prev, [objetivoId]: '' }));
  };

  // Eliminar actividad
  const handleEliminarActividad = (
    objetivoId: string,
    actividadIndex: number
  ) => {
    setObjetivosEspEditado((prev) => {
      const nuevos = prev.map((obj) => {
        if (obj.id === objetivoId) {
          const nuevasActividades = [...obj.activities];
          nuevasActividades.splice(actividadIndex, 1);
          return {
            ...obj,
            activities: nuevasActividades,
          };
        }
        return obj;
      });
      if (setObjetivosEspProp) setObjetivosEspProp(nuevos);
      return nuevos;
    });
  };

  // Formatear duración
  const formatearDuracion = (dias: number) => {
    const semanas = Math.floor(dias / 7);
    const diasRestantes = dias % 7;
    return `${semanas > 0 ? `${semanas} sem.` : ''} ${diasRestantes} día${
      diasRestantes !== 1 ? 's' : ''
    }`.trim();
  };

  // Calcular meses entre fechas
  const calcularMesesEntreFechas = (inicio: string, fin: string): string[] => {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const meses: string[] = [];

    const fechaActual = new Date(fechaInicio);
    while (fechaActual <= fechaFin) {
      meses.push(fechaActual.toLocaleString('es-ES', { month: 'long' }));
      fechaActual.setMonth(fechaActual.getMonth() + 1);
    }

    return meses;
  };

  // --- Calculate duracionDias when fechaInicio or fechaFin changes ---
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const diff =
        Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      setDuracionDias(diff > 0 ? diff : 0);
    } else {
      setDuracionDias(0);
    }
  }, [fechaInicio, fechaFin]);

  // --- Calculate diasPorActividad for "dias" visualization ---
  useEffect(() => {
    if (tipoVisualizacion === 'dias' && fechaInicio && fechaFin) {
      // NUEVO: Distribuir actividades por responsable, ocupando huecos de horas sobrantes
      const dias: Record<string, number[]> = {};
      // Map: responsableId -> array de horas ocupadas por día (índice de día)
      const horasPorDiaPorResponsable: Record<string, number[]> = {};

      // Construir lista de actividades con responsable
      const actividadesList: {
        actividadKey: string;
        horas: number;
        responsableId: string;
      }[] = [];
      objetivosEspEditado.forEach((obj) => {
        obj.activities.forEach((_, actIdx) => {
          const actividadKey = `${obj.id}_${actIdx}`;
          const horasActividad =
            typeof horasPorActividadFinal[actividadKey] === 'number' &&
            horasPorActividadFinal[actividadKey] > 0
              ? horasPorActividadFinal[actividadKey]
              : 1;
          const responsableId =
            responsablesPorActividadProp[actividadKey] ||
            responsablesPorActividadLocal[actividadKey] ||
            'default';
          actividadesList.push({
            actividadKey,
            horas: horasActividad,
            responsableId,
          });
        });
      });

      // LOG: Mostrar actividades y responsables
      console.log('--- Asignación de actividades a responsables ---');
      actividadesList.forEach(({ actividadKey, horas, responsableId }) => {
        console.log(
          `Actividad: ${actividadKey}, Horas: ${horas}, Responsable: ${responsableId}`
        );
      });

      // Para cada responsable, distribuir sus actividades en los días
      // Inicializar matriz de horas ocupadas por día para cada responsable
      actividadesList.forEach(({ actividadKey, horas, responsableId }) => {
        if (!horasPorDiaPorResponsable[responsableId]) {
          horasPorDiaPorResponsable[responsableId] =
            Array(duracionDias).fill(0);
        }
        // Buscar el primer día con hueco suficiente, si no, usar el siguiente día disponible
        let horasRestantes = horas;
        let dia = 0;
        dias[actividadKey] = [];
        while (horasRestantes > 0 && dia < duracionDias) {
          const horasOcupadas = horasPorDiaPorResponsable[responsableId][dia];
          const horasDisponibles = horasPorDiaValue - horasOcupadas;
          if (horasDisponibles > 0) {
            const horasAsignar = Math.min(horasDisponibles, horasRestantes);
            // Marcar este día para la actividad
            dias[actividadKey].push(dia);
            // Sumar horas ocupadas
            horasPorDiaPorResponsable[responsableId][dia] += horasAsignar;
            horasRestantes -= horasAsignar;
            // LOG: Mostrar asignación de horas por día
            console.log(
              `Asignando ${horasAsignar}h de ${actividadKey} a responsable ${responsableId} en día ${dia} (ocupado: ${horasPorDiaPorResponsable[responsableId][dia]}/${horasPorDiaValue})`
            );
          }
          // Si no se llenó la actividad, pasar al siguiente día
          if (horasRestantes > 0) {
            dia++;
          }
        }
      });

      // LOG: Mostrar resumen de ocupación por responsable
      Object.entries(horasPorDiaPorResponsable).forEach(
        ([responsableId, horasArray]) => {
          console.log(
            `Responsable ${responsableId} - Horas ocupadas por día: [${horasArray.join(', ')}]`
          );
        }
      );

      setDiasPorActividad(dias);
    } else {
      setDiasPorActividad({});
    }
  }, [
    tipoVisualizacion,
    fechaInicio,
    fechaFin,
    objetivosEspEditado,
    duracionDias,
    horasPorActividadFinal,
    horasPorDiaValue,
    responsablesPorActividadProp,
    responsablesPorActividadLocal,
  ]);

  // Función para guardar el proyecto en la BD
  const handleGuardarProyecto = async () => {
    try {
      // Validar campos requeridos
      if (
        !tituloState ||
        !planteamientoEditado ||
        !justificacionEditada ||
        !objetivoGenEditado ||
        !tipoProyecto ||
        !categoria
      ) {
        alert('Por favor, completa todos los campos requeridos.');
        return;
      }

      // Mapear objetivos_especificos y actividades
      const objetivos_especificos = objetivosEspEditado.map((obj) => ({
        id: obj?.id,
        title: obj.title,
      }));

      // Mapear actividades
      const actividades: {
        descripcion: string;
        meses: number[];
        objetivoId?: string;
        responsibleUserId?: string;
        hoursPerDay?: number;
      }[] = [];
      objetivosEspEditado.forEach((obj) => {
        obj.activities.forEach((act, actIdx) => {
          const actividadKey = `${obj?.id}_${actIdx}`;
          actividades.push({
            descripcion: act,
            meses: [], // Puedes mapear el cronograma si lo necesitas
            objetivoId: obj?.id,
            responsibleUserId: responsablesPorActividadLocal[actividadKey],
            hoursPerDay: horasPorActividadFinal[actividadKey] || 1,
          });
        });
      });

      // Construir el body para el backend
      const body = {
        name: tituloState,
        planteamiento: planteamientoEditado,
        justificacion: justificacionEditada,
        objetivo_general: objetivoGenEditado,
        objetivos_especificos,
        actividades,
        type_project: tipoProyecto,
        categoryId: Number(categoria),
        coverImageKey: undefined, // Puedes manejar la imagen si lo necesitas
        fechaInicio,
        fechaFin,
        tipoVisualizacion,
        isPublic: false,
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Proyecto guardado correctamente.');
        onClose();
        // Redirigir a la vista de detalle del proyecto recién creado
        if (typeof data === 'object' && data !== null && 'id' in data) {
          window.location.href = `/proyectos/DetallesProyectos/${(data as { id: string | number }).id}`;
        } else {
          window.location.reload();
        }
      } else {
        // Corrige acceso inseguro a .error
        alert(
          typeof data === 'object' &&
            data &&
            'error' in data &&
            typeof (data as { error?: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Error al guardar el proyecto.'
        );
      }
    } catch (_error) {
      alert('Error al guardar el proyecto.');
    }
  };

  // Utilidad para obtener la fecha actual en formato YYYY-MM-DD, ajustando si es domingo
  function getTodayDateString() {
    const today = new Date();
    // Si hoy es domingo, avanzar al lunes siguiente
    if (today.getDay() === 0) {
      today.setDate(today.getDate() + 1);
    }
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Si la fecha de inicio es mayor a la de fin, intercambiarlas
  useEffect(() => {
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
      setFechaFin(fechaInicio);
    }
  }, [fechaInicio, fechaFin]);

  // Si la fecha de inicio es mayor a la de fin, intercambiarlas
  useEffect(() => {
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
      setFechaFin(fechaInicio);
    }
  }, [fechaInicio, fechaFin]);

  // Añade esta función utilitaria antes del return principal (por ejemplo, después de los hooks y antes de if (!isOpen) return null;)
  function limpiarNumeracionObjetivo(texto: string) {
    // Elimina todos los prefijos tipo "OE x. ACT y. " y "OE x. " al inicio, incluso si hay varios y en cualquier orden
    let t = texto;
    // Elimina todos los "OE x. ACT y. " y "OE x. " repetidos al inicio
    t = t.replace(/^((OE\s*\d+\.\s*ACT\s*\d+\.\s*)|(OE\s*\d+\.\s*))+/, '');
    return t.trim();
  }

  function limpiarNumeracionActividad(texto: string) {
    // Elimina todos los prefijos tipo "OE x. ACT y. " y "OE x. " al inicio, incluso si hay varios y en cualquier orden
    let t = texto;
    // Elimina todos los "OE x. ACT y. " y "OE x. " repetidos al inicio
    t = t.replace(/^((OE\s*\d+\.\s*ACT\s*\d+\.\s*)|(OE\s*\d+\.\s*))+/, '');
    return t.trim();
  }

  // Utilidad para convertir yyyy-mm-dd a Date
  function parseYMDToDate(str: string): Date | null {
    if (!str) return null;
    const [yyyy, mm, dd] = str.split('-');
    if (!yyyy || !mm || !dd) return null;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    // Si cae en domingo, sumar 1 día para que sea lunes
    if (date.getDay() === 0) {
      date.setDate(date.getDate() + 1);
    }
    return date;
  }

  // Utilidad para convertir Date a yyyy-mm-dd
  function formatDateYMD(date: Date): string {
    const d = new Date(date);
    // Si cae en domingo, sumar 1 día para que sea lunes
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Utilidad para comparar si dos fechas (Date) son el mismo día (sin horas)
  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // Agrega este estado después de la declaración de totalHorasActividadesCalculado
  const [totalHorasInput, setTotalHorasInput] = useState<number>(
    totalHorasActividadesCalculado
  );
  // Nuevo estado para detectar edición manual
  const [totalHorasEditadoManualmente, setTotalHorasEditadoManualmente] =
    useState(false);

  // Agrega este estado después de la declaración de totalHorasEditadoManualmente
  const [horasOriginalesBackup, setHorasOriginalesBackup] = useState<Record<
    string,
    number
  > | null>(null);

  // Cuando el usuario edita manualmente el total, guarda el backup si aún no existe
  useEffect(() => {
    if (totalHorasEditadoManualmente && horasOriginalesBackup === null) {
      // Guarda el estado actual de horas por actividad antes de la edición manual
      setHorasOriginalesBackup({ ...horasPorActividadFinal });
    }
    // Si se desactiva la edición manual, limpia el backup
    if (!totalHorasEditadoManualmente && horasOriginalesBackup !== null) {
      setHorasOriginalesBackup(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalHorasEditadoManualmente]);

  // Sincroniza el valor inicial cuando cambian las horas calculadas
  useEffect(() => {
    if (!totalHorasEditadoManualmente) {
      setTotalHorasInput(totalHorasActividadesCalculado);
    }
  }, [totalHorasActividadesCalculado, totalHorasEditadoManualmente]);

  // --- Distribuir horas proporcionalmente cuando se edita manualmente el total ---
  useEffect(() => {
    if (!totalHorasEditadoManualmente) return;
    // Solo distribuir si hay actividades
    const actividadKeys: string[] = [];
    objetivosEspEditado.forEach((obj) => {
      obj.activities.forEach((_, actIdx) => {
        actividadKeys.push(`${obj.id}_${actIdx}`);
      });
    });
    if (actividadKeys.length === 0) return;

    // Distribución equitativa: todas las actividades reciben la misma cantidad, el resto se reparte de a 1
    const totalTarget = Math.max(
      actividadKeys.length,
      Math.round(totalHorasInput)
    );
    const base = Math.floor(totalTarget / actividadKeys.length);
    let resto = totalTarget - base * actividadKeys.length;

    const nuevasHoras: Record<string, number> = {};
    actividadKeys.forEach((k, _idx) => {
      nuevasHoras[k] = base + (resto > 0 ? 1 : 0);
      if (resto > 0) resto--;
    });

    // Actualizar el estado de horas por actividad
    if (typeof setHorasPorActividad === 'function') {
      setHorasPorActividad(nuevasHoras);
    } else {
      setHorasPorActividadLocal(nuevasHoras);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalHorasInput, totalHorasEditadoManualmente]);

  if (!isOpen) return null;

  return (
    <>
      {/* Estilo para el contorno del día actual */}
      <style>
        {`
          .datepicker-today-outline {
            outline: 2px solid #10b981 !important;
            outline-offset: 1px;
            border-radius: 50% !important;
          }
        `}
      </style>
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
                  if (setPlanteamiento) setPlanteamiento(e.target.value); // <-- Propaga cambio
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
                  if (setJustificacion) setJustificacion(e.target.value); // <-- Propaga cambio
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
                  if (setObjetivoGen) setObjetivoGen(e.target.value); // <-- Propaga cambio
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
              <FaRegClock className="inline-block text-cyan-300" />
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
                value={totalHorasActividadesCalculado}
                readOnly
                className="rounded bg-gray-400 p-1 text-black"
                style={{
                  width: `${String(totalHorasActividadesCalculado).length + 3}ch`,
                  minWidth: '4ch',
                  textAlign: 'center',
                  border: '2px solid #10b981',
                  fontWeight: 'bold',
                }}
              />
              {/* <span className="text-xs font-semibold text-cyan-300 sm:text-sm">
                horas
              </span> */}

              <FaRegClock className="inline-block text-cyan-300" />
            </div>
            {/* Fechas responsive */}
            <div className="col-span-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label className="mb-1 block text-sm font-medium text-cyan-300 sm:text-base">
                Fecha de Inicio del Proyecto:
                {/* Solo mostrar el texto si la fecha es distinta a la actual */}
                {fechaInicioEditadaManualmente &&
                  fechaInicio !== getTodayDateString() && (
                    <span className="ml-2 text-xs text-orange-300">
                      (Editada manualmente)
                    </span>
                  )}
              </label>
              {/* Cambia aquí: fuerza el contenedor a w-full */}
              <DatePicker
                selected={fechaInicio ? parseYMDToDate(fechaInicio) : null}
                onChange={(date: Date | null) => {
                  if (!date) return;
                  if (date instanceof Date && !isNaN(date.getTime())) {
                    if (date.getDay() === 0) return;
                    const ymd = formatDateYMD(date);
                    setFechaInicio(ymd);
                    setFechaInicioEditadaManualmente(
                      ymd !== getTodayDateString()
                    );
                    setFechaInicioDomingoError(false);
                    // Si la fecha de fin NO ha sido editada manualmente, recalcula la fecha de fin automáticamente
                    if (!fechaFinEditadaManualmente) {
                      // El cálculo automático ya se realiza en el useEffect anterior, así que no es necesario duplicar aquí
                    }
                  }
                }}
                filterDate={(date: Date) => date.getDay() !== 0}
                dateFormat="dd / MM / yyyy"
                minDate={new Date(getTodayDateString())}
                className={`w-20 rounded bg-gray-400 p-2 text-black ${fechaInicioDomingoError ? 'border-2 border-red-500' : ''}`}
                placeholderText="Selecciona la fecha de inicio"
                required
                customInput={
                  // Cambia aquí: fuerza el input personalizado a w-full
                  <CustomDateInput
                    className={`w-full rounded bg-gray-400 p-2 pr-10 text-black ${fechaInicioDomingoError ? 'border-2 border-red-500' : ''}`}
                  />
                }
                dayClassName={(date) => {
                  // Solo resalta si la seleccionada NO es la actual
                  const today = new Date(getTodayDateString());
                  const selected = fechaInicio
                    ? parseYMDToDate(fechaInicio)
                    : null;
                  if (
                    date instanceof Date &&
                    today instanceof Date &&
                    (selected === null || selected instanceof Date)
                  ) {
                    if (
                      selected &&
                      isSameDay(date as Date, today as Date) &&
                      !isSameDay(date as Date, selected as Date)
                    ) {
                      return 'datepicker-today-outline';
                    }
                    if (!selected && isSameDay(date as Date, today as Date)) {
                      return 'datepicker-today-outline';
                    }
                  }
                  return '';
                }}
              />
              {/* Solo mostrar el botón si la fecha es distinta a la actual */}
              {fechaInicioEditadaManualmente &&
                fechaInicio !== getTodayDateString() && (
                  <button
                    type="button"
                    onClick={() => {
                      setFechaInicio(getTodayDateString());
                      setFechaInicioEditadaManualmente(false);
                    }}
                    className="flex-shrink-0 rounded bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700 sm:text-sm"
                    title="Restablecer a la fecha actual"
                  >
                    Hoy
                  </button>
                )}
              {fechaInicioDomingoError && (
                <span className="text-xs text-red-400">
                  No puedes seleccionar un domingo como fecha de inicio.
                </span>
              )}
            </div>

            <div className="col-span-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label className="mb-1 block text-sm font-medium text-cyan-300 sm:text-base">
                Fecha de Fin del Proyecto:
                {/* Mostrar si la fecha fue editada manualmente */}
                {fechaFinEditadaManualmente && (
                  <span className="ml-2 text-xs text-orange-300">
                    (Editada manualmente)
                  </span>
                )}
              </label>
              {/* Cambia aquí: fuerza el contenedor a w-full */}
              <DatePicker
                selected={fechaFin ? parseYMDToDate(fechaFin) : null}
                onChange={(date: Date | null) => {
                  if (!date) return;
                  if (date instanceof Date && !isNaN(date.getTime())) {
                    const ymd = formatDateYMD(date);
                    setFechaFin(ymd);
                    setFechaFinEditadaManualmente(true);
                  }
                }}
                dateFormat="dd / MM / yyyy"
                minDate={
                  fechaInicio
                    ? (parseYMDToDate(fechaInicio) ?? undefined)
                    : undefined
                }
                filterDate={(date: Date) => date.getDay() !== 0} // <-- Deshabilita domingos
                className="w-full rounded bg-gray-400 p-2 text-black"
                placeholderText="DD / MM / YYYY"
                required
                customInput={
                  // Cambia aquí: fuerza el input personalizado a w-full
                  <CustomDateInput className="w-full rounded bg-gray-400 p-2 pr-10 text-black" />
                }
                dayClassName={(date) => {
                  const today = new Date(getTodayDateString());
                  const selected = fechaFin ? parseYMDToDate(fechaFin) : null;
                  if (
                    date instanceof Date &&
                    today instanceof Date &&
                    (selected === null || selected instanceof Date)
                  ) {
                    if (
                      selected &&
                      isSameDay(date as Date, today as Date) &&
                      !isSameDay(date as Date, selected as Date)
                    ) {
                      return 'datepicker-today-outline';
                    }
                    if (!selected && isSameDay(date as Date, today as Date)) {
                      return 'datepicker-today-outline';
                    }
                  }
                  return '';
                }}
              />
              {/* Botón para volver a calcular automáticamente la fecha fin */}
              {fechaFinEditadaManualmente && (
                <button
                  type="button"
                  onClick={() => {
                    setFechaFinEditadaManualmente(false);
                  }}
                  className="flex-shrink-0 rounded bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700 sm:text-sm"
                  title="Recalcular automáticamente la fecha de fin"
                >
                  Auto
                </button>
              )}
            </div>

            {/* Horas por día responsive con información adicional */}
            {fechaInicio && fechaFin && (
              <>
                <div className="col-span-1 flex items-center gap-2">
                  <span className="ml-2 text-sm font-semibold text-cyan-200 sm:text-base">
                    Total de horas:
                  </span>
                  {/* Cambia el span por un input editable */}
                  <input
                    type="number"
                    min={0}
                    value={totalHorasInput}
                    onChange={(e) => {
                      setTotalHorasInput(Number(e.target.value));
                      setTotalHorasEditadoManualmente(true);
                    }}
                    className="rounded bg-gray-400 p-1 text-sm font-semibold text-black sm:text-base"
                    style={{
                      width: `${String(totalHorasInput).length + 3}ch`,
                      minWidth: '4ch',
                      textAlign: 'center',
                    }}
                  />
                  <FaRegClock className="inline-block text-cyan-200" />
                  {totalHorasEditadoManualmente && (
                    <>
                      <span className="ml-2 text-xs text-orange-300">
                        (Editado manualmente)
                      </span>
                      <button
                        type="button"
                        className="ml-2 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                        onClick={() => {
                          // Restaurar las horas originales y desactivar edición manual
                          if (horasOriginalesBackup) {
                            if (typeof setHorasPorActividad === 'function') {
                              setHorasPorActividad(horasOriginalesBackup);
                            } else {
                              setHorasPorActividadLocal(horasOriginalesBackup);
                            }
                          }
                          setTotalHorasEditadoManualmente(false);
                        }}
                        title="Restaurar horas originales"
                      >
                        Restaurar
                      </button>
                    </>
                  )}
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-sm font-semibold text-green-300 sm:text-base">
                    Días laborables necesarios:{' '}
                    {Math.ceil(
                      totalHorasActividadesCalculado / horasPorDiaValue
                    )}
                  </span>
                </div>
              </>
            )}

            {/* Objetivos específicos */}
            <div className="col-span-1 lg:col-span-2">
              <label className="text-sm text-cyan-300 sm:text-base">
                Objetivos Específicos
              </label>

              {/* Sección para agregar nuevo objetivo */}
              <div className="mb-4 rounded-lg border border-slate-600 bg-slate-700/50 p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <textarea
                    value={nuevoObjetivo}
                    onChange={(e) => {
                      setNuevoObjetivo(e.target.value);
                      handleTextAreaChange(e);
                    }}
                    rows={1}
                    className="w-full resize-none overflow-hidden rounded border-none bg-gray-500 p-2 text-xs break-words text-white placeholder:text-gray-300 sm:text-sm"
                    placeholder="Agregar nuevo objetivo específico..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAgregarObjetivo();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAgregarObjetivo}
                    className="w-full flex-shrink-0 rounded bg-green-600 px-3 py-2 text-xl font-semibold text-white hover:bg-blue-700 sm:w-auto sm:px-4 sm:text-2xl"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Lista de objetivos responsive */}
              <div className="m-2 mb-2 gap-2">
                <ul className="mb-2 space-y-4">
                  {objetivosEspEditado.map((obj, idx) => (
                    <li key={obj.id}>
                      <div className="mb-2 rounded-lg border border-slate-600 bg-slate-700/50 p-3 sm:p-4">
                        {/* Header objetivo */}
                        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
                          <h3 className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 text-sm font-semibold break-words hyphens-auto text-cyan-300 sm:pr-2 sm:text-lg">
                            {/* Añade la numeración aquí */}
                            {`OE ${idx + 1}. ${limpiarNumeracionObjetivo(obj.title)}`}
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
                            className="w-full flex-shrink-0 rounded bg-green-600 px-3 py-2 text-xl font-semibold text-white hover:bg-blue-700 sm:w-auto sm:px-4 sm:text-2xl"
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
                          {obj.activities.map((act, _idx) => {
                            const actIdx = _idx; // Use _idx to avoid eslint unused var warning
                            const actividadKey = `${obj.id}_${actIdx}`;
                            const responsableId =
                              responsablesPorActividadProp[actividadKey] ||
                              responsablesPorActividadLocal[actividadKey] ||
                              '';
                            const responsableObj = usuarios?.find(
                              (u) => u.id === responsableId
                            );

                            // Obtener horas de forma simple
                            const horasActividad =
                              horasPorActividadFinal[actividadKey] || 1;
                            return (
                              <div
                                key={actIdx}
                                className="flex flex-col gap-2 rounded bg-slate-600/50 p-2 text-xs sm:flex-row sm:items-start sm:text-sm"
                              >
                                {/* Añade la numeración aquí */}
                                <span className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 break-words hyphens-auto text-gray-200 sm:pr-2">
                                  {`OE ${idx + 1}. ACT ${actIdx + 1}. ${limpiarNumeracionActividad(
                                    act
                                  )}`}
                                </span>
                                {/* Responsable */}
                                <span className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 break-words hyphens-auto text-gray-200 sm:pr-2">
                                  {responsableObj
                                    ? responsableObj.name
                                    : (user?.fullName ??
                                      user?.firstName ??
                                      'Usuario')}
                                </span>
                                {/* Input de horas SIMPLIFICADO */}
                                <input
                                  type="number"
                                  min={1}
                                  value={horasActividad}
                                  onChange={(e) => {
                                    const newValue = Number(e.target.value);
                                    if (!isNaN(newValue) && newValue >= 1) {
                                      handleHorasCambio(actividadKey, newValue);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const value = Number(e.target.value);
                                    if (value < 1 || isNaN(value)) {
                                      handleHorasCambio(actividadKey, 1);
                                    }
                                  }}
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
                <option value="" className="text-gray-500">
                  -- Seleccione un tipo de proyecto --
                </option>
                {typeProjects.map((tp) => (
                  <option key={tp.value} value={tp.value}>
                    {tp?.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Información de duración responsive */}
            {fechaInicio && fechaFin && (
              <div className="col-span-1 mb-4 lg:col-span-2">
                <span className="block text-xs text-gray-300 sm:text-sm">
                  Duración: {formatearDuracion(duracionDias)} ({duracionDias}{' '}
                  días en total)
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
          <h3 className="mb-2 text-base font-semibold text-cyan-300 sm:text-lg">
            Cronograma{' '}
            {tipoVisualizacion === 'meses'
              ? 'por Meses'
              : tipoVisualizacion === 'dias'
                ? 'por Días'
                : ' por Horas'}
          </h3>
          {fechaInicio && fechaFin && duracionDias > 0 && (
            <div className="mt-4 overflow-x-auto sm:mt-6">
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
                    {objetivosEspEditado.map((obj, objIdx) =>
                      obj.activities.map((act, actIdx) => {
                        const actividadKey = `${obj.id}_${actIdx}`;
                        const horasActividad =
                          typeof horasPorActividadFinal[actividadKey] ===
                            'number' && horasPorActividadFinal[actividadKey] > 0
                            ? horasPorActividadFinal[actividadKey]
                            : 1;
                        return (
                          <tr key={actividadKey}>
                            <td
                              className="sticky left-0 z-10 border bg-white px-2 py-2 font-medium break-words"
                              style={{ minWidth: 250, maxWidth: 300 }}
                            >
                              {/* Añade la numeración aquí */}
                              {`OE ${objIdx + 1}. ACT ${actIdx + 1}. ${limpiarNumeracionActividad(
                                act
                              )}`}
                            </td>
                            <td className="border bg-cyan-100 px-2 py-2 text-center font-bold">
                              {horasActividad}
                            </td>
                          </tr>
                        );
                      })
                    )}
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
                      {/* Cambia aquí: */}
                      {mesesRender.map((periodo, i) => (
                        <th
                          key={i}
                          className="border px-2 py-2 text-left break-words whitespace-normal"
                          style={{
                            minWidth:
                              tipoVisualizacion === 'dias' ? '80px' : '120px',
                          }}
                        >
                          {tipoVisualizacion === 'dias'
                            ? (() => {
                                // periodo es yyyy-mm-dd, mostrar como dd/MM/yyyy con ceros a la izquierda
                                const [yyyy, mm, dd] = periodo.split('-');
                                if (yyyy && mm && dd) {
                                  return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
                                }
                                return periodo;
                              })()
                            : periodo}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {objetivosEspEditado.map((obj, objIdx) =>
                      obj.activities.map((act, actIdx) => {
                        const actividadKey = `${obj.id}_${actIdx}`;
                        return (
                          <tr key={actividadKey}>
                            <td
                              className="sticky left-0 z-10 border bg-white px-2 py-2 font-medium break-words"
                              style={{ minWidth: 180 }}
                            >
                              {/* Añade la numeración aquí */}
                              {`OE ${objIdx + 1}. ACT ${actIdx + 1}. ${limpiarNumeracionActividad(
                                act
                              )}`}
                            </td>
                            {/* Cambia aquí: */}
                            {mesesRender.map((_, i) => (
                              <td
                                key={i}
                                className={`border px-2 py-2 text-center ${
                                  tipoVisualizacion === 'dias' &&
                                  diasPorActividad[actividadKey]?.includes(i)
                                    ? 'bg-cyan-300 font-bold text-white'
                                    : cronogramaState[act]?.includes(i)
                                      ? 'bg-cyan-300 font-bold text-white'
                                      : 'bg-white'
                                }`}
                              >
                                {tipoVisualizacion === 'dias' &&
                                diasPorActividad[actividadKey]?.includes(i)
                                  ? '✔️'
                                  : ''}
                                {tipoVisualizacion !== 'dias' &&
                                cronogramaState[act]?.includes(i)
                                  ? '✔️'
                                  : ''}
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Botones responsive */}
          <div className="mt-4 flex flex-col justify-between gap-3 p-3 sm:mt-6 sm:flex-row sm:gap-4">
            {/* Nuevo botón para volver a Objetivos Específicos */}
            {onAnterior && (
              <button
                type="button"
                onClick={onAnterior}
                className="group flex w-full items-center justify-center gap-2 rounded px-4 py-2 font-semibold text-cyan-300 hover:underline sm:w-auto"
              >
                {/* Ícono de flecha izquierda */}
                <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
                Objetivos Específicos
              </button>
            )}
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
    </>
  );
};

const CustomDateInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ value, onClick, placeholder, className }, ref) => (
  // Cambia aquí: fuerza el div y el input a w-full
  <div className="relative w-full">
    <input
      type="text"
      ref={ref}
      value={value && value !== '' ? value : ''}
      onClick={onClick}
      placeholder={placeholder}
      className={className ?? 'w-full rounded bg-gray-400 p-2 pr-10 text-black'}
      readOnly
      style={{ cursor: 'pointer', width: '100%' }}
    />
    <FaRegCalendarAlt
      className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-cyan-700"
      size={16}
    />
  </div>
));
export default ModalResumen;
