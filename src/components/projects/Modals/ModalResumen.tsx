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
  tipoVisualizacion?: 'meses' | 'dias';
}

interface ModalResumenProps {
  isOpen: boolean;
  onClose: () => void;
  titulo?: string;
  planteamiento: string;
  justificacion: string;
  objetivoGen: string;
  objetivosEsp: string[];
  actividad: string[];
  cronograma?: Record<string, number[]>;
  categoriaId?: number;
  numMeses?: number;
  setObjetivosEsp: (value: string[]) => void;
  setActividades: (value: string[]) => void;
  projectId?: number;
  coverImageKey?: string;
  tipoProyecto?: string;
  onUpdateProject?: (updatedProject: UpdatedProjectData) => void;
  fechaInicio?: string;
  fechaFin?: string;
  tipoVisualizacion?: 'meses' | 'dias';
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
    useState<string[]>(objetivosEsp);
  const [actividadEditada, setActividadEditada] = useState<string[]>(actividad);
  const [nuevoObjetivo, setNuevoObjetivo] = useState('');
  const [nuevaActividad, setNuevaActividad] = useState('');
  const [cronogramaState, setCronograma] =
    useState<Record<string, number[]>>(cronograma);
  const [fechaInicio, setFechaInicio] = useState<string>(fechaInicioProp ?? '');
  const [fechaFin, setFechaFin] = useState<string>(fechaFinProp ?? '');
  const [numMeses, setNumMeses] = useState<number>(numMesesProp ?? 1);
  const [duracionDias, setDuracionDias] = useState<number>(0);
  const [tipoVisualizacion, setTipoVisualizacion] = useState<'meses' | 'dias'>(
    tipoVisualizacionProp ?? 'meses'
  );
  const [tipoProyecto, setTipoProyecto] = useState<string>(
    typeProjects[0]?.value || ''
  );
  const [imagenProyecto, setImagenProyecto] = useState<File | null>(null);
  const [previewImagen, setPreviewImagen] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const isEditMode = !!projectId; // <-- AÑADE ESTA LÍNEA
  //const router = useRouter();

  const cronogramaRef = useRef<Record<string, number[]>>(cronograma);
  const tituloRef = useRef<string>(titulo);

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
  useEffect(() => setActividadEditada(actividad), [actividad]);

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

  // Simplificar el useEffect del cronograma
  useEffect(() => {
    if (actividadEditada.length > 0) {
      setCronograma((prev) => {
        const nuevo: Record<string, number[]> = {};
        actividadEditada.forEach((act) => {
          // Mantener los meses existentes o inicializar como array vacío
          nuevo[act] = prev[act] || [];
        });
        cronogramaRef.current = nuevo;
        return nuevo;
      });
    }
  }, [actividadEditada]);

  const handleAgregarObjetivo = () => {
    if (nuevoObjetivo.trim()) {
      setObjetivosEsp([...objetivosEspEditado, nuevoObjetivo.trim()]);
      setObjetivosEspEditado((prev) => [...prev, nuevoObjetivo.trim()]);
      setNuevoObjetivo('');
    }
  };

  const handleEditarObjetivo = (index: number, value: string) => {
    const copia = [...objetivosEspEditado];
    copia[index] = value;
    setObjetivosEsp(copia);
    setObjetivosEspEditado(copia);
  };

  const handleEliminarObjetivo = (index: number) => {
    const copia = objetivosEspEditado.filter((_, i) => i !== index);
    setObjetivosEsp(copia);
    setObjetivosEspEditado(copia);
  };

  const handleAgregarActividad = () => {
    if (nuevaActividad.trim()) {
      setActividadEditada((prev) => [...prev, nuevaActividad.trim()]);
      setNuevaActividad('');
    }
  };

  const handleEditarActividad = (index: number, value: string) => {
    const copia = [...actividadEditada];
    copia[index] = value;
    setActividadEditada(copia);
    setActividades(copia);
  };

  const handleEliminarActividad = (index: number) => {
    const copia = actividadEditada.filter((_, i) => i !== index);
    setActividadEditada(copia);
    setActividades(copia);
  };

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

    const actividadesMapped = actividadEditada.map((descripcion) => ({
      descripcion,
      meses: cronogramaState[descripcion] || [],
    }));

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

      // Construye el objeto del proyecto
      const proyecto = {
        name: tituloState,
        categoryId: parseInt(categoria),
        planteamiento: planteamientoEditado,
        justificacion: justificacionEditada,
        objetivo_general: objetivoGenEditado,
        objetivos_especificos: objetivosEspEditado,
        actividades: actividadesMapped,
        type_project: tipoProyecto,
        coverImageKey,
        fechaInicio,
        fechaFin,
        tipoVisualizacion,
      };

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
            objetivos_especificos: objetivosEspEditado,
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

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div className="relative h-full w-[88%] max-w-5xl overflow-y-auto rounded-lg bg-[#0F2940] p-6 text-white shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-2xl font-bold text-white hover:text-red-500"
        >
          ✕
        </button>

        {/* Espacio para la imagen del proyecto */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-2 flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg bg-gray-200">
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
          <label className="cursor-pointer rounded bg-cyan-700 px-4 py-2 text-white hover:bg-cyan-800">
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
        <input
          value={tituloState}
          onChange={(e) => setTitulo(e.target.value)}
          className="mb-6 w-full rounded p-2 text-center text-3xl font-semibold text-cyan-300"
          placeholder="Título del Proyecto"
        />

        <form className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="col-span-2">
            <label>Planteamiento del problema</label>
            <input
              value={planteamientoEditado}
              onChange={(e) => setPlanteamientoEditado(e.target.value)}
              className="mt-1 w-full rounded bg-gray-400 p-2 text-black"
            />
          </div>

          <div className="col-span-2">
            <label>Justificación</label>
            <input
              value={justificacionEditada}
              onChange={(e) => setJustificacionEditada(e.target.value)}
              className="mt-1 w-full rounded bg-gray-400 p-2 text-black"
            />
          </div>

          <div className="col-span-2">
            <label>Objetivo General</label>
            <input
              value={objetivoGenEditado}
              onChange={(e) => setObjetivoGenEditado(e.target.value)}
              className="mt-1 w-full rounded bg-gray-400 p-2 text-black"
            />
          </div>

          <div className="col-span-2">
            <label>Objetivos Específicos</label>
            <ul className="mb-2 space-y-2">
              {objetivosEspEditado.map((obj, idx) => (
                <li key={idx} className="flex gap-2">
                  <input
                    value={obj}
                    onChange={(e) => handleEditarObjetivo(idx, e.target.value)}
                    className="flex-1 rounded bg-gray-400 p-2 text-black"
                  />
                  <button
                    onClick={() => handleEliminarObjetivo(idx)}
                    className="rounded bg-red-600 px-2 font-semibold text-white hover:bg-red-700"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={nuevoObjetivo}
                onChange={(e) => setNuevoObjetivo(e.target.value)}
                className="flex-1 rounded bg-gray-400 p-2 text-black"
                placeholder="Agregar nuevo objetivo..."
              />
              <button
                type="button"
                onClick={handleAgregarObjetivo}
                className="rounded bg-green-600 px-2 text-2xl font-semibold text-white hover:bg-green-700"
              >
                +
              </button>
            </div>
          </div>

          <div className="col-span-2">
            <label>Actividades</label>
            <ul className="mb-2 space-y-2">
              {actividadEditada.map((act, idx) => (
                <li key={idx} className="flex gap-2">
                  <input
                    value={act}
                    onChange={(e) => handleEditarActividad(idx, e.target.value)}
                    className="flex-1 rounded bg-gray-400 p-2 text-black"
                  />
                  <button
                    onClick={() => handleEliminarActividad(idx)}
                    className="rounded bg-red-600 px-2 font-semibold text-white hover:bg-red-700"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={nuevaActividad}
                onChange={(e) => setNuevaActividad(e.target.value)}
                className="flex-1 rounded bg-gray-400 p-2 text-black"
                placeholder="Agregar nueva actividad..."
              />
              <button
                type="button"
                onClick={handleAgregarActividad}
                className="rounded bg-green-600 px-2 text-2xl font-semibold text-white hover:bg-green-700"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            <label>Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 rounded border bg-gray-400 p-2 text-black"
              required
            >
              <option value="">-- Seleccione una Categoría --</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector para el tipo de proyecto */}
          <div className="flex flex-col">
            <label>Tipo de Proyecto</label>
            <select
              value={tipoProyecto}
              onChange={(e) => setTipoProyecto(e.target.value)}
              className="mt-1 rounded border bg-gray-400 p-2 text-black"
              required
            >
              <option value="">-- Seleccione un Tipo de Proyecto--</option>
              {typeProjects.map((tp) => (
                <option key={tp.value} value={tp.value}>
                  {tp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reemplazar el selector de meses con selectores de fechas */}
          <div className="mb-4">
            <label className="mb-1 block font-medium">
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

          <div className="mb-4">
            <label className="mb-1 block font-medium">
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

          {fechaInicio && fechaFin && (
            <div className="col-span-2 mb-4">
              <span className="text-sm text-gray-300">
                Duración: {formatearDuracion(duracionDias)} ({duracionDias} días
                en total)
              </span>
              <br />
              <span className="text-xs text-gray-400">
                Cronograma:{' '}
                {tipoVisualizacion === 'meses'
                  ? `${calcularMesesEntreFechas(fechaInicio, fechaFin).length} mes${calcularMesesEntreFechas(fechaInicio, fechaFin).length !== 1 ? 'es' : ''}`
                  : `${duracionDias} día${duracionDias !== 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          {/* Selector para tipo de visualización del cronograma */}
          {fechaInicio && fechaFin && (
            <div className="col-span-2 mb-4">
              <label className="mb-2 block font-medium">
                Visualización del Cronograma
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="meses"
                    checked={tipoVisualizacion === 'meses'}
                    onChange={(e) =>
                      setTipoVisualizacion(e.target.value as 'meses' | 'dias')
                    }
                    className="text-cyan-500"
                  />
                  <span>Por Meses</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="dias"
                    checked={tipoVisualizacion === 'dias'}
                    onChange={(e) =>
                      setTipoVisualizacion(e.target.value as 'meses' | 'dias')
                    }
                    className="text-cyan-500"
                  />
                  <span>Por Días</span>
                </label>
              </div>
            </div>
          )}
        </form>

        {/* Cronograma dinámico con celdas coloreadas */}
        <div className="mt-6 overflow-x-auto">
          <h3 className="mb-2 text-lg font-semibold text-white">
            Cronograma{' '}
            {tipoVisualizacion === 'meses' ? 'por Meses' : 'por Días'}
          </h3>
          {meses.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full table-auto border-collapse text-sm text-black">
                <thead className="sticky top-0 z-10 bg-gray-300">
                  <tr>
                    <th className="border px-2 py-2 text-left break-words">
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
                  {actividadEditada.map((act, idx) => (
                    <tr key={idx}>
                      <td className="border bg-white px-2 py-2 font-medium break-words">
                        {act}
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-300">
              Selecciona las fechas de inicio y fin para ver el cronograma
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={handleGuardarProyecto}
            className="rounded bg-green-700 px-6 py-2 text-lg font-bold text-white hover:bg-green-600"
            disabled={isUpdating}
          >
            {isEditMode ? 'Actualizar Proyecto' : 'Crear Proyecto'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-red-700 px-6 py-2 text-lg font-bold text-white hover:bg-red-600"
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
