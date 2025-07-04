'use client';

import React, { useEffect, useState } from 'react';

import { typeProjects } from '~/server/actions/project/typeProject';
import { type Category } from '~/types';

interface ModalResumenProps {
  isOpen: boolean;
  onClose: () => void;
  planteamiento: string;
  justificacion: string;
  objetivoGen: string;
  objetivosEsp: string[];
  actividad: string[];
  setObjetivosEsp: (value: string[]) => void;
  setActividades: (value: string[]) => void;
}

const ModalResumen: React.FC<ModalResumenProps> = ({
  isOpen,
  onClose,
  planteamiento,
  justificacion,
  objetivoGen,
  objetivosEsp,
  actividad,
  setObjetivosEsp,
  setActividades,
}) => {
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [categoria, setCategoria] = useState<string>('');
  const [titulo, setTitulo] = useState('');
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
  const [cronograma, setCronograma] = useState<Record<string, number[]>>({});
  const [numMeses, setNumMeses] = useState(1);
  const [tipoProyecto, setTipoProyecto] = useState<string>(
    typeProjects[0]?.value || ''
  );

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

  const meses: string[] = Array.from({ length: numMeses }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    return date.toLocaleString('es-ES', { month: 'long' }).toUpperCase();
  });

  useEffect(() => {
    const nuevo: Record<string, number[]> = {};
    actividadEditada.forEach((act) => {
      nuevo[act] = cronograma[act] || [];
    });
    setCronograma(nuevo);
  }, [actividadEditada, cronograma]);

  const toggleMesActividad = (actividad: string, mesIndex: number) => {
    setCronograma((prev) => {
      const meses = prev[actividad] || [];
      const nuevos = meses.includes(mesIndex)
        ? meses.filter((m) => m !== mesIndex)
        : [...meses, mesIndex];
      return { ...prev, [actividad]: nuevos };
    });
  };

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
      !titulo ||
      !categoria ||
      !planteamientoEditado ||
      !justificacionEditada ||
      !objetivoGenEditado
    ) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    if (objetivosEspEditado.length === 0 || actividadEditada.length === 0) {
      alert('Debes ingresar al menos un objetivo específico y una actividad.');
      return;
    }

    const proyecto = {
      name: titulo,
      categoryId: parseInt(categoria),
      planteamiento: planteamientoEditado,
      justificacion: justificacionEditada,
      objetivo_general: objetivoGenEditado,
      objetivos_especificos: objetivosEspEditado,
      actividades: actividadEditada.map((descripcion) => ({
        descripcion,
        meses: cronograma[descripcion] || [],
      })),
      coverImageKey: null,
      type_project: tipoProyecto, // <-- usar el valor seleccionado
    };

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proyecto),
      });

      if (!response.ok) throw new Error('Error al guardar el proyecto');

      alert('Proyecto creado con éxito');
      onClose();
    } catch (error) {
      console.error('Error al crear el proyecto:', error);
      alert('Hubo un problema al guardar el proyecto');
    }
  };

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

        <br />
        <br />
        <input
          value={titulo}
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
              {typeProjects.map((tp) => (
                <option key={tp.value} value={tp.value}>
                  {tp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de cantidad de meses para el cronograma */}
          <div className="mb-4">
            <label className="mb-1 block font-medium">
              ¿Cuántos meses dura el proyecto?
            </label>
            <input
              type="number"
              min={1}
              max={24}
              value={numMeses}
              onChange={(e) => setNumMeses(Number(e.target.value))}
              className="w-24 rounded bg-gray-400 p-1 text-black"
            />
          </div>
        </form>

        {/* Cronograma dinámico con celdas coloreadas */}
        <div className="mt-6 overflow-x-auto">
          <h3 className="mb-2 text-lg font-semibold text-white">Cronograma</h3>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full table-auto border-collapse text-sm text-black">
              <thead className="sticky top-0 z-10 bg-gray-300">
                <tr>
                  <th className="border px-2 py-2 text-left break-words">
                    Actividad
                  </th>
                  {meses.map((mes, i) => (
                    <th
                      key={i}
                      className="border px-2 py-2 text-left break-words whitespace-normal"
                    >
                      {mes}
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
                          cronograma[act]?.includes(i)
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
        </div>

        <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={handleGuardarProyecto}
            className="rounded bg-green-700 px-6 py-2 text-lg font-bold text-white hover:bg-green-600"
          >
            Crear Proyecto
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-red-700 px-6 py-2 text-lg font-bold text-white hover:bg-red-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalResumen;
