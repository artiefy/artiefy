'use client';

import React, { useEffect, useMemo, useState } from 'react';

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
  responsablesPorActividad?: Record<string, string>;
  horasPorActividad?: Record<string, number>;
  setHorasPorActividad?: (value: Record<string, number>) => void; // <-- Nuevo setter
  horasPorDiaProyecto?: number; // <-- Recibe el prop
  setHorasPorDiaProyecto?: (value: number) => void; // <-- Recibe el setter
  tiempoEstimadoProyecto?: number; // <-- Nuevo prop
  setTiempoEstimadoProyecto?: (value: number) => void; // <-- Nuevo setter
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
  setObjetivosEsp: _setObjetivosEsp, // unused
  setActividades: _setActividades, // unused
  projectId,
  coverImageKey: _coverImageKeyProp, // unused
  onUpdateProject: _onUpdateProject, // unused
  fechaInicio: fechaInicioProp,
  fechaFin: fechaFinProp,
  actividades: actividadesProp = [],
  responsablesPorActividad: responsablesPorActividadProp = {},
  horasPorActividad: horasPorActividadProp = {},
  setHorasPorActividad,
  horasPorDiaProyecto: horasPorDiaProyectoProp,
  setHorasPorDiaProyecto,
  setTiempoEstimadoProyecto,
}) => {
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

  // Calcular el total de horas dinámicamente
  const totalHorasActividadesCalculado = useMemo(() => {
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
  const [cronogramaState, setCronograma] =
    useState<Record<string, number[]>>(cronograma);
  const [fechaInicio, setFechaInicio] = useState<string>(fechaInicioProp ?? '');
  const [fechaFin, setFechaFin] = useState<string>(fechaFinProp ?? '');

  // Estado para controlar si la fecha final ha sido editada manualmente
  const [fechaFinEditadaManualmente, setFechaFinEditadaManualmente] =
    useState<boolean>(false);

  // Estado para controlar si la fecha inicial ha sido editada manualmente
  const [fechaInicioEditadaManualmente, setFechaInicioEditadaManualmente] =
    useState<boolean>(false);

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

  // Nueva función para contar días laborables entre dos fechas (inclusive)
  const contarDiasLaborables = (inicio: string, fin: string): number => {
    if (!inicio || !fin) return 0;
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    if (fechaInicio > fechaFin) return 0;
    let count = 0;
    const current = new Date(fechaInicio);
    while (current <= fechaFin) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++; // lunes a viernes
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  // Calcular el total de horas del proyecto SOLO considerando días laborables
  const totalDiasLaborables =
    fechaInicio && fechaFin ? contarDiasLaborables(fechaInicio, fechaFin) : 0;
  const totalHorasProyecto =
    totalDiasLaborables > 0 ? totalDiasLaborables * horasPorDiaValue : 0;

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
      console.log(
        `Distribuyendo ${horasPorActividadDistribuidas} horas por actividad para ${totalActividades} actividades`
      );
      const nuevasHoras: Record<string, number> = {};
      objetivosEspEditado.forEach((obj) => {
        obj.activities.forEach((_, actIdx) => {
          const actividadKey = `${obj.id}_${actIdx}`;
          // Solo asignar horas automáticas si no tiene horas ya asignadas
          if (!horasPorActividadFinal[actividadKey]) {
            nuevasHoras[actividadKey] = horasPorActividadDistribuidas;
          }
        });
      });

      // Actualizar solo si hay actividades sin asignación previa
      if (Object.keys(nuevasHoras).length > 0) {
        console.log('Asignando horas automáticamente:', nuevasHoras);
        if (typeof setHorasPorActividad === 'function') {
          setHorasPorActividad({
            ...horasPorActividadFinal,
            ...nuevasHoras,
          });
        } else {
          setHorasPorActividadLocal((prev) => ({ ...prev, ...nuevasHoras }));
        }
      }
    }
  }, [
    totalActividades,
    horasPorActividadDistribuidas,
    objetivosEspEditado,
    horasPorActividadFinal,
    setHorasPorActividad,
  ]);

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
    }
  }, [isOpen, titulo, planteamiento, justificacion, objetivoGen]);

  // Sincronizar fecha y cronograma al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setFechaInicio(fechaInicioProp ?? '');
      setFechaFin(fechaFinProp ?? '');
      setCronograma(cronograma);
    }
  }, [isOpen, fechaInicioProp, fechaFinProp, cronograma]);

  // Sincronizar responsables y horas de actividades en modo edición
  useEffect(() => {
    if (isEditMode && isOpen && Array.isArray(actividadesProp)) {
      const nuevosResponsables: Record<string, string> = {};
      const nuevasHoras: Record<string, number> = {};

      actividadesProp.forEach((act, idx) => {
        if (act.objetivoId) {
          const objIdx = objetivosEsp.findIndex(
            (obj) => obj.id === act.objetivoId
          );
          if (objIdx !== -1) {
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

      setResponsablesPorActividadLocal(nuevosResponsables);

      // Actualizar horas usando la función correcta
      if (typeof setHorasPorActividad === 'function') {
        setHorasPorActividad(nuevasHoras);
      } else {
        setHorasPorActividadLocal(nuevasHoras);
      }
    }
  }, [isEditMode, isOpen, actividadesProp, objetivosEsp, setHorasPorActividad]);

  // Función para calcular la fecha final basada en horas totales y horas por día
  const calcularFechaFinal = (
    fechaInicio: string,
    totalHoras: number,
    horasPorDia: number
  ): string => {
    if (!fechaInicio || totalHoras <= 0 || horasPorDia <= 0) return '';

    const diasNecesarios = Math.ceil(totalHoras / horasPorDia);

    // Contar días laborables necesarios empezando desde la fecha inicial
    let diasContados = 0;
    const fechaActual = new Date(fechaInicio);

    while (diasContados < diasNecesarios) {
      const diaSemana = fechaActual.getDay();

      // Si es día laborable (lunes a viernes), contarlo
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasContados++;
      }

      // Si ya contamos todos los días necesarios, no avanzar más
      if (diasContados < diasNecesarios) {
        fechaActual.setDate(fechaActual.getDate() + 1);
      }
    }

    return fechaActual.toISOString().split('T')[0];
  };

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const obtenerFechaActual = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  // Función para manejar cambio manual de fecha inicial
  const handleFechaInicioChange = (nuevaFecha: string) => {
    setFechaInicio(nuevaFecha);
    // Marcar que la fecha inicial ha sido editada manualmente
    const fechaActual = obtenerFechaActual();
    setFechaInicioEditadaManualmente(nuevaFecha !== fechaActual);
    // Resetear el flag de edición manual para permitir recálculo automático
    setFechaFinEditadaManualmente(false);
  };

  // Función para manejar cambio manual de fecha final
  const handleFechaFinChange = (nuevaFecha: string) => {
    setFechaFin(nuevaFecha);
    // Marcar que la fecha final ha sido editada manualmente
    setFechaFinEditadaManualmente(true);
  };

  // Función para volver a la fecha actual
  const volverAFechaActual = () => {
    const fechaActual = obtenerFechaActual();
    setFechaInicio(fechaActual);
    setFechaInicioEditadaManualmente(false);
    setFechaFinEditadaManualmente(false);
  };

  // Función para volver al cálculo automático
  const volverACalculoAutomatico = () => {
    setFechaFinEditadaManualmente(false);
    // Forzar recálculo inmediato
    if (
      fechaInicio &&
      totalHorasActividadesCalculado > 0 &&
      horasPorDiaValue > 0
    ) {
      const nuevaFechaFin = calcularFechaFinal(
        fechaInicio,
        totalHorasActividadesCalculado,
        horasPorDiaValue
      );
      if (nuevaFechaFin) {
        setFechaFin(nuevaFechaFin);
      }
    }
  };

  // Efecto para calcular fecha final automáticamente (solo si no ha sido editada manualmente)
  // MODIFICADO: recalcula también al abrir el modal si hay datos y no fue editada manualmente
  useEffect(() => {
    if (
      isOpen && // <-- Solo cuando el modal está abierto
      !fechaFinEditadaManualmente &&
      fechaInicio &&
      totalHorasActividadesCalculado > 0 &&
      horasPorDiaValue > 0
    ) {
      const nuevaFechaFin = calcularFechaFinal(
        fechaInicio,
        totalHorasActividadesCalculado,
        horasPorDiaValue
      );

      if (nuevaFechaFin && nuevaFechaFin !== fechaFin) {
        setFechaFin(nuevaFechaFin);
      }
    }
  }, [
    isOpen, // <-- Añadido para recalcular al abrir el modal
    fechaInicio,
    fechaFin, // <-- Añadido para cumplir con exhaustive-deps
    totalHorasActividadesCalculado,
    horasPorDiaValue,
    fechaFinEditadaManualmente,
  ]);

  // Limpiar el flag de edición manual cuando se abre el modal en modo crear
  useEffect(() => {
    if (!isEditMode && isOpen) {
      setFechaFinEditadaManualmente(false);
      setFechaInicioEditadaManualmente(false);
    }
  }, [isEditMode, isOpen]);

  // Efecto para establecer fecha inicial automáticamente en modo crear
  useEffect(() => {
    if (!isEditMode && isOpen && !fechaInicio) {
      const fechaActual = obtenerFechaActual();
      console.log('Estableciendo fecha actual como inicial:', fechaActual);
      setFechaInicio(fechaActual);
      setFechaInicioEditadaManualmente(false);
    }
  }, [isEditMode, isOpen, fechaInicio]);

  // --- MES RENDER LOGIC ---
  // El problema es que el cronograma solo muestra columnas para las fechas existentes en el rango,
  // pero si solo hay dos fechas, el segundo día no se muestra hasta que hay una tercera.
  // Solución: Asegúrate de que el array 'meses' (que representa los días laborables) siempre tenga
  // al menos tantos días como el máximo índice asignado en diasPorActividad + 1.

  // Justo antes del render del cronograma, fuerza el tamaño de 'meses' si es necesario:
  const maxDiaAsignado = useMemo(() => {
    if (tipoVisualizacion !== undefined && tipoVisualizacion !== 'dias')
      return 0;
    let max = 0;
    Object.values(diasPorActividad ?? {}).forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((idx: number) => {
          if (idx > max) max = idx;
        });
      }
    });
    return max;
  }, [diasPorActividad, tipoVisualizacion]);

  const meses: string[] = useMemo(() => {
    if (fechaInicio && fechaFin) {
      if (tipoVisualizacion === 'dias') {
        const fechaInicioDate = new Date(fechaInicio);
        const fechaFinDate = new Date(fechaFin);
        const dias: string[] = [];
        const fechaActual = new Date(fechaInicioDate);
        while (fechaActual <= fechaFinDate) {
          const day = fechaActual.getDay();
          if (day !== 0 && day !== 6) {
            dias.push(fechaActual.toLocaleDateString('es-ES'));
          }
          fechaActual.setDate(fechaActual.getDate() + 1);
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
    if (tipoVisualizacion !== undefined && tipoVisualizacion !== 'dias')
      return meses;
    if (meses.length <= maxDiaAsignado) {
      const extendidos = [...meses];
      let lastDate: Date;
      if (meses.length > 0) {
        const [d, m, y] = meses[meses.length - 1].split('/');
        lastDate = new Date(Number(y), Number(m) - 1, Number(d));
      } else {
        lastDate = new Date();
      }
      for (let i = meses.length; i <= maxDiaAsignado; i++) {
        lastDate.setDate(lastDate.getDate() + 1);
        extendidos.push(lastDate.toLocaleDateString('es-ES'));
      }
      return extendidos;
    }
    return meses;
  }, [meses, maxDiaAsignado, tipoVisualizacion]);

  // --- END MES RENDER LOGIC ---

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
    setObjetivosEspEditado((prev) => [...prev, nuevoObj]);
    setNuevoObjetivo('');
  };

  // Eliminar objetivo
  const handleEliminarObjetivo = (index: number) => {
    setObjetivosEspEditado((prev) => {
      const nuevosObjetivos = [...prev];
      nuevosObjetivos.splice(index, 1);
      return nuevosObjetivos;
    });
  };

  // Agregar actividad
  const handleAgregarActividad = (objetivoId: string) => {
    const descripcion = nuevaActividadPorObjetivo[objetivoId]?.trim();
    if (!descripcion) return;
    setObjetivosEspEditado((prev) =>
      prev.map((obj) => {
        if (obj.id === objetivoId) {
          return {
            ...obj,
            activities: [...obj.activities, descripcion],
          };
        }
        return obj;
      })
    );
    setNuevaActividadPorObjetivo((prev) => ({ ...prev, [objetivoId]: '' }));
  };

  // Eliminar actividad
  const handleEliminarActividad = (
    objetivoId: string,
    actividadIndex: number
  ) => {
    setObjetivosEspEditado((prev) =>
      prev.map((obj) => {
        if (obj.id === objetivoId) {
          const nuevasActividades = [...obj.activities];
          nuevasActividades.splice(actividadIndex, 1);
          return {
            ...obj,
            activities: nuevasActividades,
          };
        }
        return obj;
      })
    );
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
      const dias: Record<string, number[]> = {};
      objetivosEspEditado.forEach((obj) => {
        obj.activities.forEach((_, actIdx) => {
          const actividadKey = `${obj.id}_${actIdx}`;
          dias[actividadKey] = [];
          for (let i = 0; i < duracionDias; i++) {
            dias[actividadKey].push(i);
          }
        });
      });
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
  ]);

  // Función vacía temporal para evitar error si no está definida
  const handleGuardarProyecto = () => {
    // Implementa la lógica de guardado aquí si es necesario
    // Por ahora solo muestra un alert para evitar error de compilación
    alert('Funcionalidad de guardar proyecto no implementada.');
  };

  // Fix: agregar key a cada option en los select
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
            <span className="text-xs font-semibold text-cyan-300 sm:text-sm">
              horas
            </span>
          </div>
          {/* Fechas responsive */}
          <div className="col-span-1">
            <label className="mb-1 block text-sm font-medium text-cyan-300 sm:text-base">
              Fecha de Inicio del Proyecto
              {fechaInicioEditadaManualmente && (
                <span className="ml-2 text-xs text-orange-300">
                  (Editada manualmente)
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => handleFechaInicioChange(e.target.value)}
                className="w-full rounded bg-gray-400 p-2 text-black"
                required
                title={
                  fechaInicioEditadaManualmente
                    ? "Fecha editada manualmente. Usa el botón 'Hoy' para volver a la fecha actual"
                    : 'Fecha inicial del proyecto. Se establece automáticamente como hoy'
                }
              />
              {fechaInicioEditadaManualmente && (
                <button
                  type="button"
                  onClick={volverAFechaActual}
                  className="flex-shrink-0 rounded bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700 sm:text-sm"
                  title="Volver a la fecha actual"
                >
                  Hoy
                </button>
              )}
            </div>
          </div>

          <div className="col-span-1">
            <label className="mb-1 block text-sm font-medium text-cyan-300 sm:text-base">
              Fecha de Fin del Proyecto
              {!fechaFinEditadaManualmente && (
                <span className="ml-2 text-xs text-gray-300">
                  (Calculada automáticamente)
                </span>
              )}
              {fechaFinEditadaManualmente && (
                <span className="ml-2 text-xs text-orange-300">
                  (Editada manualmente)
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => handleFechaFinChange(e.target.value)}
                min={fechaInicio}
                className="w-full rounded bg-gray-400 p-2 text-black"
                required
                title={
                  fechaFinEditadaManualmente
                    ? "Fecha editada manualmente. Usa el botón 'Auto' para volver al cálculo automático"
                    : 'Esta fecha se calcula automáticamente. Puedes editarla manualmente si lo deseas'
                }
              />
              {fechaFinEditadaManualmente && (
                <button
                  type="button"
                  onClick={volverACalculoAutomatico}
                  className="flex-shrink-0 rounded bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700 sm:text-sm"
                  title="Volver al cálculo automático"
                >
                  Auto
                </button>
              )}
            </div>
          </div>

          {/* Horas por día responsive con información adicional */}
          {fechaInicio && fechaFin && (
            <>
              <div className="col-span-1 flex items-center">
                <span className="text-sm font-semibold text-cyan-200 sm:text-base">
                  Total de horas: {totalHorasProyecto}
                </span>
              </div>
              <div className="col-span-1 flex items-center">
                <span className="text-sm font-semibold text-green-300 sm:text-base">
                  Días laborables necesarios:{' '}
                  {Math.ceil(totalHorasActividadesCalculado / horasPorDiaValue)}
                  {fechaFinEditadaManualmente && (
                    <span className="ml-2 text-xs text-orange-300">
                      (Fecha manual activa)
                    </span>
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
                            responsablesPorActividadLocal[actividadKey] || '';
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
                              <span className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 break-words hyphens-auto text-gray-200 sm:pr-2">
                                {act}
                              </span>
                              {/* Responsable */}
                              <span className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 break-words hyphens-auto text-gray-200 sm:pr-2">
                                {responsableObj ? responsableObj.name : ''}
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
                  : ' por Horas'}
            </h3>
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
                  {objetivosEspEditado.map((obj) =>
                    obj.activities.map((act, idx) => {
                      const actividadKey = `${obj.id}_${idx}`;
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
                            {act}
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
                        {periodo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {objetivosEspEditado.map((obj) =>
                    obj.activities.map((act, idx) => {
                      const actividadKey = `${obj.id}_${idx}`;
                      return (
                        <tr key={actividadKey}>
                          <td
                            className="sticky left-0 z-10 border bg-white px-2 py-2 font-medium break-words"
                            style={{ minWidth: 180 }}
                          >
                            {act}
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
