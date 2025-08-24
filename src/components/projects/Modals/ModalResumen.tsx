'use client';

import React, { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

import { useUser } from '@clerk/nextjs'; // Añade este import
import { Image as ImageIcon, UploadCloud, Video } from 'lucide-react';
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
  coverVideoKey?: string; // <-- Nuevo campo
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
  coverVideoKey?: string; // <-- Nuevo prop
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
  onAnterior?: (data?: {
    planteamiento?: string;
    justificacion?: string;
    objetivoGen?: string;
    objetivosEsp?: SpecificObjective[];
  }) => void; // <-- Cambia la firma para aceptar datos
  // NUEVO: setters para sincronizar cambios al volver atrás
  setPlanteamiento?: (value: string) => void;
  setJustificacion?: (value: string) => void;
  setObjetivoGen?: (value: string) => void;
  setObjetivosEspProp?: (value: SpecificObjective[]) => void;
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
  setObjetivosEsp: _setObjetivosEspProp,
  setActividades: _setActividades, // unused
  projectId,
  coverImageKey: _coverImageKeyProp, // unused
  coverVideoKey: _coverVideoKeyProp, // unused
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
  setObjetivosEspProp,
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
  const [isUpdating, setIsUpdating] = useState(false); // Cambia _setIsUpdating a setIsUpdating
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [tipoProyecto, setTipoProyecto] = useState<string>(
    _tipoProyectoProp ?? ''
  );
  const [progress, setProgress] = useState(0); // Nuevo estado para progreso
  // Estado para saber si está creando o actualizando
  const [statusText, setStatusText] = useState<string>('');

  // Estado para drag & drop y archivos seleccionados (imagen/video)
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isDragOverImage, setIsDragOverImage] = useState(false);
  const [isDragOverVideo, setIsDragOverVideo] = useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  // Actualiza previewImagen y previewVideo según selectedImage/selectedVideo
  useEffect(() => {
    if (!selectedImage) {
      setPreviewImagen(null);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImagen(reader.result as string);
      reader.readAsDataURL(selectedImage);
    }
  }, [selectedImage]);
  useEffect(() => {
    if (!selectedVideo) {
      setPreviewVideo(null);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewVideo(reader.result as string);
      reader.readAsDataURL(selectedVideo);
    }
  }, [selectedVideo]);

  // Helpers para obtener la URL de preview de imagen/video cargados
  const coverImageUrl =
    _coverImageKeyProp && !_coverImageKeyProp.startsWith('blob:')
      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${_coverImageKeyProp}`
      : undefined;
  const coverVideoUrl =
    _coverVideoKeyProp && !_coverVideoKeyProp.startsWith('blob:')
      ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${_coverVideoKeyProp}`
      : undefined;

  // Permitir solo un archivo de cada tipo
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
      }
    }
  };
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedVideo(file);
      }
    }
  };
  const handleDragOverImage = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverImage(true);
  };
  const handleDragLeaveImage = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverImage(false);
  };
  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverImage(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
      }
    }
  };
  const handleDragOverVideo = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverVideo(true);
  };
  const handleDragLeaveVideo = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverVideo(false);
  };
  const handleDropVideo = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverVideo(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedVideo(file);
      }
    }
  };
  function removeFile(type: 'image' | 'video') {
    if (type === 'image') setSelectedImage(null);
    if (type === 'video') setSelectedVideo(null);
  }

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
  const [tituloState, setTitulo] = useState(() => titulo);
  const [planteamientoEditado, setPlanteamientoEditado] = useState(
    () => planteamiento
  );
  const [justificacionEditada, setJustificacionEditada] = useState(
    () => justificacion
  );
  const [objetivoGenEditado, setObjetivoGenEditado] = useState(
    () => objetivoGen
  );
  const [objetivosEspEditado, setObjetivosEspEditado] = useState<
    SpecificObjective[]
  >(() => objetivosEsp);
  // Estado para controlar si la fecha inicial ha sido editada manualmente
  const [fechaInicioEditadaManualmente, setFechaInicioEditadaManualmente] =
    useState<boolean>(false);
  // Estado para controlar si la fecha final ha sido editada manualmente
  const [fechaFinEditadaManualmente, setFechaFinEditadaManualmente] =
    useState<boolean>(false);
  const [fechaInicioDomingoError, setFechaInicioDomingoError] = useState(false);
  // Agrega este estado después de la declaración de totalHorasActividadesCalculado
  const [totalHorasInput, setTotalHorasInput] = useState<number>(
    0 // Inicializa en 0, se sincroniza abajo
  );
  // Nuevo estado para detectar edición manual
  const [totalHorasEditadoManualmente, setTotalHorasEditadoManualmente] =
    useState(false);

  // Agrega este estado después de la declaración de totalHorasEditadoManualmente
  const [horasOriginalesBackup, setHorasOriginalesBackup] = useState<Record<
    string,
    number
  > | null>(null);

  // Calcula el total de horas dinámicamente SOLO si no está editado manualmente
  const totalHorasActividadesCalculado = React.useMemo(() => {
    if (totalHorasEditadoManualmente) {
      // Si está editado manualmente, devuelve la suma de horasOriginalesBackup si existe
      if (horasOriginalesBackup) {
        return Object.values(horasOriginalesBackup).reduce(
          (acc, val) => acc + (typeof val === 'number' && val > 0 ? val : 1),
          0
        );
      }
      // Si no hay backup, devuelve el input actual
      return totalHorasInput;
    }
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
  }, [
    objetivosEspEditado,
    horasPorActividadFinal,
    totalHorasEditadoManualmente,
    totalHorasInput,
    horasOriginalesBackup,
  ]);

  // Actualizar tiempo estimado automáticamente
  useEffect(() => {
    if (
      totalHorasActividadesCalculado > 0 &&
      typeof setTiempoEstimadoProyecto === 'function'
    ) {
      setTiempoEstimadoProyecto(totalHorasActividadesCalculado);
    }
  }, [totalHorasActividadesCalculado, setTiempoEstimadoProyecto]);

  // Sincronización cuando se abre el modal (tanto para modo edición como creación)
  useEffect(() => {
    if (isOpen) {
      setTitulo(titulo);
      setPlanteamientoEditado(planteamiento);
      setJustificacionEditada(justificacion);
      setObjetivoGenEditado(objetivoGen);
      setObjetivosEspEditado(objetivosEsp);

      // Forzar sincronización de horas si hay datos
      if (
        horasPorActividadProp &&
        Object.keys(horasPorActividadProp).length > 0
      ) {
        setHorasPorActividadLocal(horasPorActividadProp);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
      !horasPorDiaValue ||
      fechaFinEditadaManualmente || // Solo no calcular si la fecha de fin fue editada manualmente
      !hayActividades
    )
      return;

    // Usa el total de horas manual si está editado manualmente, si no el calculado
    const totalHorasParaCalculo = totalHorasEditadoManualmente
      ? totalHorasInput
      : totalHorasActividadesCalculado;

    if (!totalHorasParaCalculo) return;

    // Calcula la cantidad de días necesarios (redondea hacia arriba)
    const diasNecesarios = Math.ceil(totalHorasParaCalculo / horasPorDiaValue);

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
  }, [
    fechaInicio,
    totalHorasActividadesCalculado,
    horasPorDiaValue,
    fechaFinEditadaManualmente,
    objetivosEspEditado, // para detectar cambios en actividades
    fechaFin, // <-- Añadido para cumplir con react-hooks/exhaustive-deps
    totalHorasEditadoManualmente,
    totalHorasInput,
  ]);

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
      if (objetivosEsp?.length > 0) {
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

  // Agregar objetivo
  const handleAgregarObjetivo = () => {
    if (!nuevoObjetivo.trim()) return;
    const nuevoObj: SpecificObjective = {
      id: Date.now().toString(),
      title: nuevoObjetivo.trim(),
      activities: [],
    };
    setObjetivosEspEditado((prev) => {
      const nuevos = Array.isArray(prev) ? [...prev, nuevoObj] : [nuevoObj];
      // Si hay un setter externo (modo edición), propaga el cambio
      if (typeof _setObjetivosEspProp === 'function') {
        _setObjetivosEspProp(nuevos);
      }
      return nuevos;
    });
    setNuevoObjetivo('');
  };

  // Eliminar objetivo
  const handleEliminarObjetivo = (index: number) => {
    setObjetivosEspEditado((prev) => {
      const nuevos = [...prev];
      nuevos.splice(index, 1);
      // Si hay un setter externo (modo edición), propaga el cambio
      if (typeof _setObjetivosEspProp === 'function') {
        _setObjetivosEspProp(nuevos);
      }
      return nuevos;
    });
  };

  // Agregar actividad
  const handleAgregarActividad = (objetivoId: string) => {
    const descripcion = nuevaActividadPorObjetivo[objetivoId]?.trim();
    if (!descripcion) return;
    setObjetivosEspEditado((prev) => {
      // Busca el objetivo y agrega la actividad solo si existe
      const nuevos = prev.map((obj) => {
        if (obj.id === objetivoId) {
          // Solo agrega si no existe ya la actividad (evita duplicados vacíos)
          if (!obj.activities.includes(descripcion)) {
            return {
              ...obj,
              activities: [...obj.activities, descripcion],
            };
          }
        }
        return obj;
      });
      // Si hay un setter externo (modo edición), propaga el cambio
      if (typeof _setObjetivosEspProp === 'function') {
        _setObjetivosEspProp(nuevos);
      }
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
      // Si hay un setter externo (modo edición), propaga el cambio
      if (typeof _setObjetivosEspProp === 'function') {
        _setObjetivosEspProp(nuevos);
      }
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

      // Solo actualiza el estado si el valor realmente cambió para evitar loops infinitos
      setDiasPorActividad((prev) => {
        const prevKeys = Object.keys(prev);
        const newKeys = Object.keys(dias);
        if (
          prevKeys.length === newKeys.length &&
          prevKeys.every(
            (k) =>
              Array.isArray(prev[k]) &&
              Array.isArray(dias[k]) &&
              prev[k].length === dias[k].length &&
              prev[k].every((v, i) => v === dias[k][i])
          )
        ) {
          return prev;
        }
        return dias;
      });
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

  // --- Calcular meses por actividad para visualización por meses ---
  const mesesPorActividad = useMemo(() => {
    if (
      tipoVisualizacion !== 'meses' ||
      !fechaInicio ||
      !fechaFin ||
      !objetivosEspEditado.length
    )
      return {};

    // Generar array de objetos {inicio, fin} para cada mes visible
    const mesesArr: { inicio: Date; fin: Date }[] = [];
    if (mesesRender.length > 0) {
      const fechaActual = new Date(fechaInicio);
      for (const _ of mesesRender) {
        const inicioMes = new Date(
          fechaActual.getFullYear(),
          fechaActual.getMonth(),
          1
        );
        const finMes = new Date(
          fechaActual.getFullYear(),
          fechaActual.getMonth() + 1,
          0
        );
        mesesArr.push({ inicio: inicioMes, fin: finMes });
        fechaActual.setMonth(fechaActual.getMonth() + 1);
      }
    }

    // Para cada actividad, calcular los días laborales desde la fecha de inicio del proyecto
    const res: Record<string, number[]> = {};
    objetivosEspEditado.forEach((obj) => {
      obj.activities.forEach((_, actIdx) => {
        const actividadKey = `${obj.id}_${actIdx}`;
        const horas = horasPorActividadFinal[actividadKey] || 1;
        const horasPorDia = horasPorDiaValue || 1;
        const diasNecesarios = Math.ceil(horas / horasPorDia);

        // Calcular días laborales para esta actividad desde la fecha de inicio del proyecto
        const diasLaborales: Date[] = [];
        let diasAgregados = 0;
        const fechaDia = new Date(fechaInicio);
        while (diasAgregados < diasNecesarios) {
          if (fechaDia.getDay() !== 0) {
            diasLaborales.push(new Date(fechaDia));
            diasAgregados++;
          }
          fechaDia.setDate(fechaDia.getDate() + 1);
        }

        // Guardar meses en los que la actividad está presente
        const mesesActividad: number[] = [];
        mesesArr.forEach((mes, idx) => {
          if (diasLaborales.some((d) => d >= mes.inicio && d <= mes.fin)) {
            mesesActividad.push(idx);
          }
        });
        res[actividadKey] = mesesActividad;
      });
    });

    return res;
  }, [
    tipoVisualizacion,
    fechaInicio,
    fechaFin,
    objetivosEspEditado,
    horasPorActividadFinal,
    horasPorDiaValue,
    mesesRender,
  ]);

  // Función para guardar o actualizar el proyecto en la BD
  const handleGuardarProyecto = async () => {
    try {
      setIsUpdating(true);
      setProgress(0);
      setStatusText(
        isEditMode ? 'Actualizando proyecto...' : 'Creando proyecto...'
      );

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
        setIsUpdating(false);
        setProgress(0);
        return;
      }

      // Mapear objetivos_especificos como array de objetos {id, title}
      const objetivos_especificos = objetivosEspEditado.map((obj, idx) => ({
        id:
          obj.id ||
          `obj_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        title: obj.title,
      }));

      // Mapear actividades correctamente con objetivoId
      const actividades: {
        descripcion: string;
        meses: number[];
        objetivoId?: string;
        responsibleUserId?: string;
        hoursPerDay?: number;
      }[] = [];
      objetivosEspEditado.forEach((obj) => {
        obj.activities.forEach((act, actIdx) => {
          const actividadKey = `${obj.id}_${actIdx}`;
          actividades.push({
            descripcion: act,
            meses: [], // Puedes mapear el cronograma si lo necesitas
            objetivoId: obj.id, // <-- importante para edición
            responsibleUserId: responsablesPorActividadLocal[actividadKey],
            hoursPerDay: horasPorActividadFinal[actividadKey] || 1,
          });
        });
      });

      // --- NUEVO: Subir imagen/video a S3 si hay archivo seleccionado ---
      let uploadedCoverImageKey: string | undefined = _coverImageKeyProp;
      let uploadedCoverVideoKey: string | undefined = _coverVideoKeyProp;

      // Subida de imagen con progreso
      if (selectedImage) {
        setStatusText(
          isEditMode ? 'Actualizando imagen...' : 'Subiendo imagen...'
        );
        setProgress(10);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: selectedImage.type,
            fileSize: selectedImage.size,
            fileName: selectedImage.name,
          }),
        });
        interface UploadData {
          url: string;
          fields?: Record<string, string>;
          key: string;
          fileName: string;
          uploadType: 'simple' | 'put';
          contentType: string;
          coverImageKey?: string;
          error?: string;
        }
        const uploadData = (await uploadRes.json()) as Partial<UploadData>;
        if (!uploadRes.ok) {
          alert(uploadData.error ?? 'Error al preparar la carga');
          return;
        }
        if (
          uploadData.uploadType === 'simple' &&
          uploadData.url &&
          uploadData.fields
        ) {
          const formData = new FormData();
          Object.entries(uploadData.fields).forEach(([k, v]) =>
            formData.append(k, v)
          );
          formData.append('file', selectedImage);

          // Usar XMLHttpRequest para progreso
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', uploadData.url!);
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                setProgress(10 + Math.round((e.loaded / e.total) * 30));
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setProgress(40);
                resolve();
              } else {
                alert('Error al subir el archivo a S3');
                setIsUpdating(false);
                setProgress(0);
                reject(new Error('Error al subir el archivo a S3'));
              }
            };
            xhr.onerror = () => {
              alert('Error al subir el archivo a S3');
              setIsUpdating(false);
              setProgress(0);
              reject(new Error('Error al subir el archivo a S3'));
            };
            xhr.send(formData);
          });
        } else if (uploadData.uploadType === 'put' && uploadData.url) {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadData.url!);
            xhr.setRequestHeader('Content-Type', selectedImage.type);
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                setProgress(10 + Math.round((e.loaded / e.total) * 30));
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setProgress(40);
                resolve();
              } else {
                alert('Error al subir el archivo a S3');
                setIsUpdating(false);
                setProgress(0);
                reject(new Error('Error al subir el archivo a S3'));
              }
            };
            xhr.onerror = () => {
              alert('Error al subir el archivo a S3');
              setIsUpdating(false);
              setProgress(0);
              reject(new Error('Error al subir el archivo a S3'));
            };
            xhr.send(selectedImage);
          });
        }
        uploadedCoverImageKey = uploadData.key;
      }

      // Subida de video con progreso
      if (selectedVideo) {
        setStatusText(
          isEditMode ? 'Actualizando video...' : 'Subiendo video...'
        );
        setProgress(45);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: selectedVideo.type,
            fileSize: selectedVideo.size,
            fileName: selectedVideo.name,
          }),
        });
        interface UploadData {
          url: string;
          fields?: Record<string, string>;
          key: string;
          fileName: string;
          uploadType: 'simple' | 'put';
          contentType: string;
          coverVideoKey?: string;
          error?: string;
        }
        const uploadData = (await uploadRes.json()) as Partial<UploadData>;
        if (!uploadRes.ok) {
          alert(uploadData.error ?? 'Error al preparar la carga');
          return;
        }
        if (
          uploadData.uploadType === 'simple' &&
          uploadData.url &&
          uploadData.fields
        ) {
          const formData = new FormData();
          Object.entries(uploadData.fields).forEach(([k, v]) =>
            formData.append(k, v)
          );
          formData.append('file', selectedVideo);

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', uploadData.url!);
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                setProgress(45 + Math.round((e.loaded / e.total) * 30));
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setProgress(75);
                resolve();
              } else {
                alert('Error al subir el archivo a S3');
                setIsUpdating(false);
                setProgress(0);
                reject(new Error('Error al subir el archivo a S3'));
              }
            };
            xhr.onerror = () => {
              alert('Error al subir el archivo a S3');
              setIsUpdating(false);
              setProgress(0);
              reject(new Error('Error al subir el archivo a S3'));
            };
            xhr.send(formData);
          });
        } else if (uploadData.uploadType === 'put' && uploadData.url) {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadData.url!);
            xhr.setRequestHeader('Content-Type', selectedVideo.type);
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                setProgress(45 + Math.round((e.loaded / e.total) * 30));
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setProgress(75);
                resolve();
              } else {
                alert('Error al subir el archivo a S3');
                setIsUpdating(false);
                setProgress(0);
                reject(new Error('Error al subir el archivo a S3'));
              }
            };
            xhr.onerror = () => {
              alert('Error al subir el archivo a S3');
              setIsUpdating(false);
              setProgress(0);
              reject(new Error('Error al subir el archivo a S3'));
            };
            xhr.send(selectedVideo);
          });
        }
        uploadedCoverVideoKey = uploadData.key;
      }

      setProgress(80);
      setStatusText(
        isEditMode ? 'Actualizando proyecto...' : 'Creando proyecto...'
      );

      // Construir el body para el backend
      const tiempoEstimadoHoras = totalHorasEditadoManualmente
        ? horasOriginalesBackup
          ? Object.values(horasOriginalesBackup).reduce(
              (acc, val) =>
                acc + (typeof val === 'number' && val > 0 ? val : 1),
              0
            )
          : totalHorasInput
        : totalHorasActividadesCalculado;

      const body = {
        name: tituloState,
        planteamiento: planteamientoEditado,
        justificacion: justificacionEditada,
        objetivo_general: objetivoGenEditado,
        objetivos_especificos, // <-- ahora es array de objetos {id, title}
        actividades,
        type_project: tipoProyecto,
        categoryId: Number(categoria),
        coverImageKey: uploadedCoverImageKey,
        coverVideoKey: uploadedCoverVideoKey,
        fechaInicio,
        fechaFin,
        tipoVisualizacion,
        horasPorDia: horasPorDiaValue, // NUEVO
        totalHoras: totalHorasInput, // NUEVO
        tiempoEstimado: Math.ceil(
          tiempoEstimadoHoras / (horasPorDiaValue || 1)
        ), // NUEVO: días estimados
        isPublic: false,
      };

      // Define un tipo para la respuesta de la API
      type ApiResponse =
        | { id: string | number }
        | { error: string }
        | Record<string, unknown>;

      let res: Response, data: ApiResponse;
      if (isEditMode && projectId) {
        // --- MODO EDICIÓN: actualizar proyecto existente ---
        setStatusText('Actualizando proyecto...');
        res = await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        setProgress(95);
        data = await res.json();
        if (res.ok) {
          setProgress(100);
          setStatusText('Proyecto actualizado correctamente.');
          setTimeout(() => {
            alert('Proyecto actualizado correctamente.');
            setIsUpdating(false);
            setProgress(0);
            onClose();
            window.location.href = `/proyectos/DetallesProyectos/${projectId}`;
          }, 500);
        } else {
          setIsUpdating(false);
          setProgress(0);
          alert(
            typeof data === 'object' &&
              data &&
              'error' in data &&
              typeof (data as { error?: unknown }).error === 'string'
              ? (data as { error: string }).error
              : 'Error al actualizar el proyecto.'
          );
        }
      } else {
        // --- MODO CREACIÓN: crear nuevo proyecto ---
        setStatusText('Creando proyecto...');
        res = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        setProgress(95);
        data = await res.json();
        if (res.ok) {
          setProgress(100);
          setStatusText('Proyecto creado correctamente.');
          setTimeout(() => {
            alert('Proyecto guardado correctamente.');
            setIsUpdating(false);
            setProgress(0);
            onClose();
            if (typeof data === 'object' && data !== null && 'id' in data) {
              window.location.href = `/proyectos/DetallesProyectos/${(data as { id: string | number }).id}`;
            } else {
              window.location.reload();
            }
          }, 500);
        } else {
          setIsUpdating(false);
          setProgress(0);
          alert(
            typeof data === 'object' &&
              data &&
              'error' in data &&
              typeof (data as { error?: unknown }).error === 'string'
              ? (data as { error: string }).error
              : 'Error al guardar el proyecto.'
          );
        }
      }
    } catch (_error) {
      setIsUpdating(false);
      setProgress(0);
      setStatusText('');
      alert(
        isEditMode
          ? 'Error al actualizar el proyecto.'
          : 'Error al guardar el proyecto.'
      );
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
  }, [
    totalHorasEditadoManualmente,
    horasOriginalesBackup,
    horasPorActividadFinal,
  ]); // <-- Añadidos

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
  }, [
    totalHorasInput,
    totalHorasEditadoManualmente,
    objetivosEspEditado,
    setHorasPorActividad,
  ]); // <-- Añadidos

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
      {/* Barra de progreso de carga */}
      {isUpdating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
          <div className="flex w-full max-w-md flex-col items-center rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 w-full">
              <div className="h-6 w-full rounded-full bg-gray-200">
                <div
                  className="h-6 rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-2 text-center font-semibold text-gray-700">
                {statusText
                  ? statusText
                  : progress < 100
                    ? `Procesando... (${progress}%)`
                    : '¡Completado!'}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Por favor, espera a que termine el proceso.
            </div>
          </div>
        </div>
      )}
      <div
        onClick={(e) => e.target === e.currentTarget && onClose()}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 ${isUpdating ? 'pointer-events-none opacity-60 select-none' : ''}`}
        aria-disabled={isUpdating}
      >
        <div className="relative h-full max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-[#0F2940] p-3 text-white shadow-lg sm:p-6">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-xl font-bold text-white hover:text-red-500 sm:top-3 sm:right-4 sm:text-2xl"
          >
            ✕
          </button>

          {/* Espacio para la imagen del proyecto */}
          <div className="mb-4 flex w-full flex-row items-start justify-center gap-4 sm:mb-6">
            {/* Área de carga de imagen */}
            <div className="flex w-1/2 flex-col items-center">
              {!(selectedImage ?? coverImageUrl) && (
                <div
                  className={`flex h-36 w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 ${
                    isDragOverImage
                      ? 'scale-105 border-teal-400 bg-teal-900/30'
                      : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                  }`}
                  onDragOver={handleDragOverImage}
                  onDragLeave={handleDragLeaveImage}
                  onDrop={handleDropImage}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="mb-3 h-8 w-8 text-teal-400" />
                    <p className="mb-2 text-center text-sm text-gray-300">
                      {isDragOverImage ? (
                        <span className="font-semibold text-teal-300">
                          Suelta el archivo aquí
                        </span>
                      ) : (
                        <span className="font-semibold">
                          Sube una imagen del proyecto
                        </span>
                      )}
                    </p>
                    <p className="text-center text-xs text-gray-400">
                      Solo se permite 1 imagen
                    </p>
                  </div>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    disabled={!!selectedImage || !!coverImageUrl}
                  />
                </div>
              )}
              {/* Previsualización de imagen seleccionada o cargada */}
              {selectedImage ? (
                <div className="mt-2 flex w-full flex-col gap-2">
                  <div className="flex items-center gap-2 rounded border border-slate-600 bg-slate-700 p-2">
                    <ImageIcon className="h-4 w-4 text-green-400" />
                    <span
                      className="truncate text-sm text-gray-300"
                      title={selectedImage.name}
                    >
                      {selectedImage.name}
                    </span>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      ({(selectedImage.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                    <button
                      type="button"
                      className="ml-auto rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                      onClick={() => removeFile('image')}
                    >
                      Quitar
                    </button>
                  </div>
                  {previewImagen && (
                    <div className="flex w-full items-center justify-center">
                      <Image
                        src={previewImagen}
                        alt="Previsualización imagen"
                        width={320}
                        height={320}
                        className="h-auto max-h-80 w-full rounded bg-slate-900 object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              ) : coverImageUrl ? (
                <div className="mt-2 flex w-full flex-col gap-2">
                  <div className="flex items-center gap-2 rounded border border-slate-600 bg-slate-700 p-2">
                    <ImageIcon className="h-4 w-4 text-green-400" />
                    <span className="truncate text-sm text-gray-300">
                      Imagen cargada
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-center">
                    <Image
                      src={coverImageUrl}
                      alt="Imagen del proyecto"
                      width={320}
                      height={320}
                      className="h-auto max-h-80 w-full rounded bg-slate-900 object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              ) : null}
            </div>
            {/* Área de carga de video */}
            <div className="flex w-1/2 flex-col items-center">
              {!(selectedVideo ?? coverVideoUrl) && (
                <div
                  className={`flex h-36 w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 ${
                    isDragOverVideo
                      ? 'scale-105 border-purple-400 bg-purple-900/30'
                      : 'border-slate-600 bg-slate-700 hover:bg-slate-600'
                  }`}
                  onDragOver={handleDragOverVideo}
                  onDragLeave={handleDragLeaveVideo}
                  onDrop={handleDropVideo}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="mb-3 h-8 w-8 text-purple-400" />
                    <p className="mb-2 text-center text-sm text-gray-300">
                      {isDragOverVideo ? (
                        <span className="font-semibold text-purple-300">
                          Suelta el archivo aquí
                        </span>
                      ) : (
                        <span className="font-semibold">
                          Sube un video del proyecto
                        </span>
                      )}
                    </p>
                    <p className="text-center text-xs text-gray-400">
                      Solo se permite 1 video
                    </p>
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                    disabled={!!selectedVideo || !!coverVideoUrl}
                  />
                </div>
              )}
              {/* Previsualización de video seleccionado o cargado */}
              {selectedVideo ? (
                <div className="mt-2 flex w-full flex-col gap-2">
                  <div className="flex items-center gap-2 rounded border border-slate-600 bg-slate-700 p-2">
                    <Video className="h-4 w-4 text-purple-400" />
                    <span
                      className="truncate text-sm text-gray-300"
                      title={selectedVideo.name}
                    >
                      {selectedVideo.name}
                    </span>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      ({(selectedVideo.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                    <button
                      type="button"
                      className="ml-auto rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                      onClick={() => removeFile('video')}
                    >
                      Quitar
                    </button>
                  </div>
                  {previewVideo && (
                    <div className="flex w-full items-center justify-center">
                      <video
                        src={previewVideo}
                        controls
                        className="h-auto max-h-80 w-full rounded bg-slate-900 object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : coverVideoUrl ? (
                <div className="mt-2 flex w-full flex-col gap-2">
                  <div className="flex items-center gap-2 rounded border border-slate-600 bg-slate-700 p-2">
                    <Video className="h-4 w-4 text-purple-400" />
                    <span className="truncate text-sm text-gray-300">
                      Video cargado
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-center">
                    <video
                      src={coverVideoUrl}
                      controls
                      className="h-auto max-h-80 w-full rounded bg-slate-900 object-contain"
                    />
                  </div>
                </div>
              ) : null}
            </div>
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
                  // Quitar: if (setPlanteamiento) setPlanteamiento(e.target.value);
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
                  // Quitar: if (setJustificacion) setJustificacion(e.target.value);
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
                  // Quitar: if (setObjetivoGen) setObjetivoGen(e.target.value);
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
                <div className="col-span-1 flex flex-col items-start">
                  {!totalHorasEditadoManualmente ? (
                    <span className="text-sm font-semibold text-green-300 sm:text-base">
                      Días laborables necesarios:{' '}
                      {Math.ceil(
                        totalHorasActividadesCalculado / horasPorDiaValue
                      )}
                    </span>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-orange-300 sm:text-base">
                        Estimados de días laborables necesarios:{' '}
                        {Math.ceil(
                          totalHorasActividadesCalculado / horasPorDiaValue
                        )}
                      </span>
                      <span className="text-sm font-semibold text-green-300 sm:text-base">
                        Días laborables necesarios:{' '}
                        {Math.ceil(totalHorasInput / horasPorDiaValue)}
                      </span>
                    </>
                  )}
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
                                    : tipoVisualizacion === 'meses' &&
                                        mesesPorActividad[
                                          actividadKey
                                        ]?.includes(i)
                                      ? 'bg-cyan-300 font-bold text-white'
                                      : cronogramaState[act]?.includes(i)
                                        ? 'bg-cyan-300 font-bold text-white'
                                        : 'bg-white'
                                }`}
                              >
                                {tipoVisualizacion === 'dias' &&
                                diasPorActividad[actividadKey]?.includes(i)
                                  ? '✔️'
                                  : tipoVisualizacion === 'meses' &&
                                      mesesPorActividad[actividadKey]?.includes(
                                        i
                                      )
                                    ? '✔️'
                                    : tipoVisualizacion !== 'dias' &&
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
                onClick={() => {
                  // Al volver atrás, propaga los valores actuales editados
                  if (setPlanteamiento) setPlanteamiento(planteamientoEditado);
                  if (setJustificacion) setJustificacion(justificacionEditada);
                  if (setObjetivoGen) setObjetivoGen(objetivoGenEditado);
                  if (setObjetivosEspProp)
                    setObjetivosEspProp(objetivosEspEditado);
                  setTotalHorasEditadoManualmente(false);
                  // También pasa los datos por el callback si lo acepta
                  onAnterior({
                    planteamiento: planteamientoEditado,
                    justificacion: justificacionEditada,
                    objetivoGen: objetivoGenEditado,
                    objetivosEsp: objetivosEspEditado,
                  });
                }}
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
