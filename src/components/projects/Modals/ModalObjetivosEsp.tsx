// ModalObjetivosEsp.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs'; // Agregar import
import { Button } from '~/components/projects/ui/button';
import { Input } from '~/components/projects/ui/input';
import { Card, CardContent } from '~/components/projects/ui/card';
import { X } from 'lucide-react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import ModalGenerarProyecto from '~/components/projects/Modals/ModalGenerarProyecto';

interface SpecificObjective {
  id: string;
  title: string;
  activities: string[];
}

interface ModalObjetivosEspProps {
  isOpen: boolean;
  onClose: () => void;
  onAnterior: () => void;
  onConfirm: (data: {
    objetivos: SpecificObjective[];
    responsablesPorActividad: { [key: string]: string };
    horasPorActividad: { [key: string]: number };
    horasPorDiaProyecto: number; // <-- Nuevo campo
    tiempoEstimadoProyecto: number; // <-- Nuevo prop
  }) => void;
  texto: SpecificObjective[];
  setTexto: (value: SpecificObjective[]) => void;
  objetivoGen?: string;
  horasPorDiaProyecto: number; // <-- Nuevo prop
  setHorasPorDiaProyecto: (value: number) => void; // <-- Nuevo prop
  tiempoEstimadoProyecto: number; // <-- Nuevo prop
  setTiempoEstimadoProyecto: (value: number) => void; // <-- Nuevo prop
}

const ModalObjetivosEsp: React.FC<ModalObjetivosEspProps> = ({
  isOpen,
  onClose,
  onAnterior,
  onConfirm,
  texto,
  setTexto,
  objetivoGen,
  horasPorDiaProyecto, // <-- Recibe prop
  setHorasPorDiaProyecto, // <-- Recibe prop
  tiempoEstimadoProyecto,
  setTiempoEstimadoProyecto,
}) => {
  const { user } = useUser(); // Obtener el usuario logueado
  const [newObjective, setNewObjective] = useState('');
  const [newObjectiveActivity, setNewObjectiveActivity] = useState<{
    [key: string]: string;
  }>({});
  const [modalGenerarOpen, setModalGenerarOpen] = useState(false);
  const [objetivoGenTexto, setObjetivoGenTexto] = useState(objetivoGen || '');

  // Estados para responsables y horas por actividad
  const [responsablesPorActividad, setResponsablesPorActividad] = useState<{
    [key: string]: string;
  }>({});
  const [horasPorActividad, setHorasPorActividad] = useState<{
    [key: string]: number;
  }>({});
  const [usuarios, setUsuarios] = useState<{ id: string; name: string }[]>([]);
  const [horasPorDiaStr, setHorasPorDiaStr] = useState<string>(
    (horasPorDiaProyecto ?? 6).toString()
  );

  // Función para auto-resize de textareas
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';

    const scrollHeight = textarea.scrollHeight;
    const minHeight = 40;
    const maxHeight = 80;

    if (scrollHeight <= minHeight) {
      textarea.style.height = `${minHeight}px`;
    } else if (scrollHeight >= maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${scrollHeight}px`;
      textarea.style.overflowY = 'hidden';
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

  useEffect(() => {
    if (isOpen) {
      setNewObjective('');
      setNewObjectiveActivity({});
      setObjetivoGenTexto(objetivoGen || '');
      // Siempre mostrar 6 por defecto al abrir
      setHorasPorDiaStr('6');
      setHorasPorDiaProyecto(6);

      // Limpiar horasPorActividad si no hay actividades
      const totalActividadesAlAbrir = texto.reduce(
        (acc, obj) => acc + obj.activities.length,
        0
      );
      if (totalActividadesAlAbrir === 0) {
        setHorasPorActividad({});
      }

      // Inicializar alturas de textareas
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
          if (textarea instanceof HTMLTextAreaElement) {
            initializeTextAreaHeight(textarea);
          }
        });
      }, 100);
    }
  }, [isOpen, objetivoGen]);

  // Cargar usuarios para el selector de responsables
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch('/api/projects/UsersResponsable');
        const data = await res.json();
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

  const renumerarObjetivos = (objetivos: SpecificObjective[]) => {
    return objetivos.map((obj, idx) => ({
      ...obj,
      title: `OE ${idx + 1}. ${obj.title.replace(/^OE \d+\.\s*/, '')}`,
      activities: obj.activities.map(
        (act, actIdx) =>
          `OE ${idx + 1}. ACT ${actIdx + 1}. ${act.replace(/^OE \d+\. ACT \d+\.\s*/, '')}`
      ),
    }));
  };

  // Cambia la función para anteponer "OE. N" al objetivo
  const addObjective = () => {
    if (newObjective.trim()) {
      const nextNumber = texto.length + 1;
      const newObj: SpecificObjective = {
        id: Date.now().toString(),
        title: `OE ${nextNumber}. ${newObjective.trim()}`,
        activities: [],
      };
      const nuevos = renumerarObjetivos([...texto, newObj]);
      setTexto(nuevos);
      setNewObjective('');
    }
  };

  const removeObjective = (id: string) => {
    // Encuentra las actividades asociadas al objetivo a eliminar
    const objetivo = texto.find((obj) => obj.id === id);
    const actividadesKeys = objetivo
      ? objetivo.activities.map((_, idx) => `${id}_${idx}`)
      : [];

    // Elimina las horas y responsables de las actividades asociadas
    setHorasPorActividad((prev) => {
      const nuevo = { ...prev };
      actividadesKeys.forEach((key) => {
        delete nuevo[key];
      });
      return nuevo;
    });
    setResponsablesPorActividad((prev) => {
      const nuevo = { ...prev };
      actividadesKeys.forEach((key) => {
        delete nuevo[key];
      });
      return nuevo;
    });

    // Elimina el objetivo y renumera
    const nuevos = renumerarObjetivos(texto.filter((obj) => obj.id !== id));
    setTexto(nuevos);
  };

  const addActivityToObjective = (objectiveId: string) => {
    const activityText = newObjectiveActivity[objectiveId];
    if (activityText && activityText.trim()) {
      const nuevos = texto.map((obj) =>
        obj.id === objectiveId
          ? {
              ...obj,
              activities: [
                ...obj.activities,
                // Agrega solo el texto puro, la numeración se hará en renumerarObjetivos
                activityText.trim(),
              ],
            }
          : obj
      );
      // Renumerar después de agregar
      const nuevosEnumerados = renumerarObjetivos(nuevos);
      setTexto(nuevosEnumerados);

      // Inicializa las horas de la nueva actividad en 1 si no existe
      const objIndex = texto.findIndex((obj) => obj.id === objectiveId);
      const actividadKey = `${objectiveId}_${texto[objIndex]?.activities.length || 0}`;
      setHorasPorActividad((prev) => ({
        ...prev,
        [actividadKey]: prev[actividadKey] ?? 1,
      }));

      setNewObjectiveActivity((prev) => ({ ...prev, [objectiveId]: '' }));
    }
  };

  const removeActivityFromObjective = (
    objectiveId: string,
    activityIndex: number
  ) => {
    // Elimina la actividad del objetivo
    const updatedObjectives = texto.map((obj) =>
      obj.id === objectiveId
        ? {
            ...obj,
            activities: obj.activities.filter((_, i) => i !== activityIndex),
          }
        : obj
    );
    // Renumerar después de eliminar
    setTexto(renumerarObjetivos(updatedObjectives));

    // Elimina la entrada de horas y responsable correspondiente
    const actividadKey = `${objectiveId}_${activityIndex}`;
    setHorasPorActividad((prev) => {
      const nuevo = { ...prev };
      delete nuevo[actividadKey];
      return nuevo;
    });
    setResponsablesPorActividad((prev) => {
      const nuevo = { ...prev };
      delete nuevo[actividadKey];
      return nuevo;
    });
  };

  // Maneja la recepción de objetivos generados por IA
  const handleProyectoGenerado = (data: any) => {
    console.log('Objetivos específicos recibidos en ModalObjetivosEsp:', data);
    if (Array.isArray(data?.milestones)) {
      // Crear los objetivos y actividades
      const nuevosObjetivos = data.milestones.map(
        (milestone: any, idx: number) => ({
          id: String(idx) + '-' + Date.now(),
          title: milestone.milestone_name || `Milestone ${idx + 1}`,
          activities: Array.isArray(milestone.tasks) ? milestone.tasks : [],
        })
      );

      // Mapear horas y responsables por actividad usando data.tasks
      const nuevasHoras: { [key: string]: number } = {};
      const nuevosResponsables: { [key: string]: string } = {};
      if (Array.isArray(data.tasks)) {
        nuevosObjetivos.forEach((obj: SpecificObjective, objIdx: number) => {
          obj.activities.forEach((act, actIdx) => {
            // Buscar la tarea correspondiente por nombre
            const tarea = data.tasks.find(
              (t: any) =>
                typeof t.task_name === 'string' &&
                t.task_name.trim() === act.trim()
            );
            const actividadKey = `${obj.id}_${actIdx}`;
            if (tarea && typeof tarea.estimated_time_hours === 'number') {
              nuevasHoras[actividadKey] = tarea.estimated_time_hours;
            }
            // Asignar responsable logueado
            if (user?.id) {
              nuevosResponsables[actividadKey] = user.id;
            }
          });
        });
      }
      // Enumerar correctamente los objetivos y actividades generados
      const objetivosEnumerados = renumerarObjetivos(nuevosObjetivos);
      setTexto(objetivosEnumerados);
      setHorasPorActividad(nuevasHoras);
      setResponsablesPorActividad(nuevosResponsables);
    }
    setModalGenerarOpen(false);
  };

  // Calcular el total de horas del proyecto: 0 si no hay actividades, suma si hay
  const totalActividades = texto.reduce(
    (acc, obj) => acc + obj.activities.length,
    0
  );
  const totalHorasProyecto =
    totalActividades === 0
      ? 0
      : Object.values(horasPorActividad).reduce(
          (acc, val) => acc + (typeof val === 'number' ? val : 0),
          0
        );

  // Sincroniza el tiempo estimado con el estado externo
  useEffect(() => {
    setTiempoEstimadoProyecto(totalHorasProyecto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalHorasProyecto]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-[95vh] w-full max-w-xs flex-col rounded-lg bg-[#0F2940] text-white shadow-lg sm:h-[85vh] sm:max-w-md md:max-w-2xl lg:max-w-3xl xl:h-[80vh]">
        {/* Header fijo */}
        <div className="flex-shrink-0 p-2 pb-0 sm:p-4 md:p-6">
          <h2 className="mb-3 text-center text-lg font-bold text-cyan-400 sm:mb-4 sm:text-xl md:text-2xl">
            Objetivos Específicos
          </h2>
          {/* Cambia aquí: flex justify-between para separar izquierda y derecha */}
          <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* Izquierda: Horas por día */}
            <div className="flex flex-row items-center gap-2 sm:gap-4">
              <label
                className="text-sm font-medium text-cyan-300 sm:text-base"
                htmlFor="horasPorDiaProyecto"
              >
                Horas de trabajo por día:
              </label>
              <input
                id="horasPorDiaProyecto"
                type="number"
                min={1}
                max={24}
                value={horasPorDiaStr}
                onChange={(e) => {
                  const val = e.target.value;
                  setHorasPorDiaStr(val);
                  if (val === '') {
                    setHorasPorDiaProyecto(6);
                  } else {
                    const num = Number(val);
                    if (!isNaN(num) && num >= 1 && num <= 24) {
                      setHorasPorDiaProyecto(num);
                    }
                  }
                }}
                className="rounded bg-gray-400 p-1 text-black"
              />
            </div>
            {/* Derecha: Botón Generar con IA */}
            <div className="flex justify-end">
              <Button
                className="w-full bg-emerald-500 px-4 hover:bg-emerald-600 sm:w-auto sm:px-6"
                onClick={() => setModalGenerarOpen(true)}
                type="button"
              >
                <span className="sm:inline">Generar con IA</span>
              </Button>
            </div>
          </div>

          {/* Add new objective */}
          <div className="flex flex-col gap-2 sm:mb-6 sm:flex-row">
            <textarea
              placeholder="Nuevo objetivo..."
              value={newObjective}
              onChange={(e) => {
                setNewObjective(e.target.value);
                handleTextAreaChange(e);
              }}
              rows={1}
              className="w-full resize-none overflow-hidden rounded border-none bg-gray-400 p-2 text-sm text-gray-800 placeholder:text-gray-600 sm:text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  addObjective();
                }
              }}
            />
            <Button
              onClick={addObjective}
              className="w-full bg-green-600 px-4 hover:bg-green-700 sm:w-auto sm:px-6"
            >
              Agregar
            </Button>
          </div>
          {/* Izquierda: Horas totales del proyecto*/}
          <div className="flex flex-row items-center gap-2 sm:gap-4">
            <label
              className="text-sm font-medium text-cyan-300 sm:text-base"
              htmlFor="horasTotalesProyecto"
            >
              Tiempo estimado del proyecto:
            </label>
            <input
              id="horasTotalesProyecto"
              type="number"
              min={0}
              value={totalHorasProyecto}
              readOnly
              className="rounded bg-gray-400 p-1 text-black"
              style={{
                width: `${String(totalHorasProyecto).length + 2}ch`,
                minWidth: '3ch',
                maxWidth: '100ch',
                textAlign: 'center',
                transition: 'width 0.2s',
              }}
            />
          </div>
          <br />
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6">
          {/* Objectives cards */}
          <div className="mb-4 space-y-3 sm:mb-6 sm:space-y-4">
            {texto.map((objective) => (
              <Card
                key={objective.id}
                className="border-slate-600 bg-slate-700/50"
              >
                <CardContent className="p-3 sm:p-4">
                  {/* Objective header */}
                  <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 text-sm font-semibold break-words hyphens-auto text-cyan-300 sm:pr-2 sm:text-lg">
                      {objective.title}
                    </h3>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeObjective(objective.id)}
                      className="h-7 w-7 flex-shrink-0 self-end p-0 sm:h-8 sm:w-8 sm:self-start"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>

                  {/* Add activity to this objective */}
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                    <textarea
                      placeholder="Nueva actividad para este objetivo..."
                      value={newObjectiveActivity[objective.id] || ''}
                      onChange={(e) => {
                        setNewObjectiveActivity((prev) => ({
                          ...prev,
                          [objective.id]: e.target.value,
                        }));
                        handleTextAreaChange(e);
                      }}
                      rows={1}
                      className="w-full resize-none overflow-hidden rounded border-none bg-gray-500 p-2 text-xs break-words text-white placeholder:text-gray-300 sm:text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          addActivityToObjective(objective.id);
                        }
                      }}
                    />
                    <Button
                      onClick={() => addActivityToObjective(objective.id)}
                      size="sm"
                      className="w-full flex-shrink-0 bg-green-600 px-3 hover:bg-green-700 sm:w-auto sm:px-4"
                    >
                      +
                    </Button>
                  </div>

                  {/* Activities list for this objective */}
                  <div className="space-y-2">
                    {objective.activities.length > 0 && (
                      <div className="mb-2 text-xs text-gray-300 sm:text-sm">
                        Actividades ({objective.activities.length}):
                      </div>
                    )}
                    {objective.activities.map((activity, activityIndex) => {
                      const actividadKey = `${objective.id}_${activityIndex}`;
                      // Mostrar el nombre del usuario logueado como responsable
                      const responsableName =
                        user?.fullName || user?.firstName || 'Usuario';
                      return (
                        <div
                          key={activityIndex}
                          className="flex flex-col gap-2 rounded bg-slate-600/50 p-2 text-xs sm:flex-row sm:items-start sm:text-sm"
                        >
                          <span className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 break-words hyphens-auto text-gray-200 sm:pr-2">
                            {activity}
                          </span>
                          {/* Responsable */}
                          <span className="overflow-wrap-anywhere min-w-0 flex-1 pr-0 break-words hyphens-auto text-gray-200 sm:pr-2">
                            {responsableName}
                          </span>
                          {/* Horas */}
                          <input
                            type="number"
                            min={1}
                            value={horasPorActividad[actividadKey] ?? 1}
                            onChange={(e) =>
                              setHorasPorActividad((prev) => ({
                                ...prev,
                                [actividadKey]: Number(e.target.value),
                              }))
                            }
                            className="w-16 rounded bg-gray-300 p-1 text-xs text-black sm:text-sm"
                            placeholder="Horas"
                          />
                          <br />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              removeActivityFromObjective(
                                objective.id,
                                activityIndex
                              )
                            }
                            className="h-5 w-5 flex-shrink-0 self-end p-0 sm:h-6 sm:w-6 sm:self-start"
                          >
                            <X className="h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                        </div>
                      );
                    })}
                    {objective.activities.length === 0 && (
                      <div className="text-xs text-gray-400 italic sm:text-sm">
                        No hay actividades agregadas para este objetivo
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {texto.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-400 sm:py-8 sm:text-base">
              No hay objetivos específicos agregados
            </div>
          )}
        </div>

        {/* Footer fijo */}
        <div className="mt-4 flex flex-col justify-between gap-3 p-3 sm:mt-6 sm:flex-row sm:gap-4">
          <Button
            variant="ghost"
            onClick={onAnterior}
            className="group order-1 flex items-center justify-center gap-2 rounded px-3 py-2 font-semibold text-cyan-300 hover:underline sm:order-1 sm:px-4"
          >
            <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="sm:inline">Objetivo General</span>
          </Button>
          <Button
            variant="destructive"
            onClick={onClose}
            className="order-2 rounded px-3 py-2 font-semibold text-white sm:order-2 sm:px-4"
          >
            Cancelar
          </Button>
          <Button
            variant="ghost"
            // Cambia aquí: pasa también horasPorDiaProyecto
            onClick={() =>
              onConfirm({
                objetivos: texto,
                responsablesPorActividad,
                horasPorActividad,
                horasPorDiaProyecto,
                tiempoEstimadoProyecto: totalHorasProyecto, // <-- Pasa el valor actual
              })
            }
            className="group order-3 flex items-center justify-center gap-2 rounded px-3 py-2 font-semibold text-cyan-300 hover:underline sm:order-3 sm:px-4"
          >
            Resumen
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      {/* Modal de generación por IA */}
      <ModalGenerarProyecto
        isOpen={modalGenerarOpen}
        onClose={() => setModalGenerarOpen(false)}
        onProyectoGenerado={handleProyectoGenerado}
        objetivoGen={objetivoGenTexto}
        resetOnOpen={modalGenerarOpen}
        currentUser={{ name: user?.fullName || user?.firstName || 'Usuario' }} // Agregar el usuario logueado
      />
    </div>
  );
};

export default ModalObjetivosEsp;
