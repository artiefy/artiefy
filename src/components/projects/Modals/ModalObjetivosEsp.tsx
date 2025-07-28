// ModalObjetivosEsp.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '~/components/projects/ui/button';
import { Input } from '~/components/projects/ui/input';
import { Card, CardContent } from '~/components/projects/ui/card';
import { X } from 'lucide-react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface SpecificObjective {
  id: string;
  title: string;
  activities: string[];
}

interface ModalObjetivosEspProps {
  isOpen: boolean;
  onClose: () => void;
  onAnterior: () => void;
  onConfirm: (objectives: SpecificObjective[]) => void;
  texto: SpecificObjective[];
  setTexto: (value: SpecificObjective[]) => void;
}

const ModalObjetivosEsp: React.FC<ModalObjetivosEspProps> = ({
  isOpen,
  onClose,
  onAnterior,
  onConfirm,
  texto,
  setTexto,
}) => {
  const [newObjective, setNewObjective] = useState('');
  const [newObjectiveActivity, setNewObjectiveActivity] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      setNewObjective('');
      setNewObjectiveActivity({});
    }
  }, [isOpen]);

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
      setTexto(renumerarObjetivos(nuevos));
      setNewObjectiveActivity((prev) => ({ ...prev, [objectiveId]: '' }));
    }
  };

  const removeActivityFromObjective = (
    objectiveId: string,
    activityIndex: number
  ) => {
    const updatedObjectives = texto.map((obj, idx) =>
      obj.id === objectiveId
        ? {
            ...obj,
            activities: obj.activities.filter((_, i) => i !== activityIndex),
          }
        : obj
    );
    // Renumerar después de eliminar
    setTexto(renumerarObjetivos(updatedObjectives));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="h-[80%] w-[90%] max-w-3xl overflow-y-auto rounded-lg bg-[#0F2940] p-6 text-white shadow-lg">
        <h2 className="mb-4 text-center text-2xl font-bold text-cyan-400">
          Objetivos Específicos
        </h2>

        {/* Add new objective */}
        <div className="mb-6 flex gap-2">
          <Input
            placeholder="Nuevo objetivo..."
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            className="border-none bg-gray-400 text-gray-800 placeholder:text-gray-600"
            onKeyDown={(e) => e.key === 'Enter' && addObjective()}
          />
          <Button
            onClick={addObjective}
            className="bg-green-600 px-6 hover:bg-green-700"
          >
            Agregar
          </Button>
        </div>

        {/* Objectives cards */}
        <div className="mb-6 grid gap-4">
          {texto.map((objective) => (
            <Card
              key={objective.id}
              className="border-slate-600 bg-slate-700/50"
            >
              <CardContent className="p-4">
                {/* Objective header */}
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-cyan-300">
                    {objective.title}
                  </h3>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeObjective(objective.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Add activity to this objective */}
                <div className="mb-3 flex gap-2">
                  <Input
                    placeholder="Nueva actividad para este objetivo..."
                    value={newObjectiveActivity[objective.id] || ''}
                    onChange={(e) =>
                      setNewObjectiveActivity((prev) => ({
                        ...prev,
                        [objective.id]: e.target.value,
                      }))
                    }
                    className="border-none bg-gray-500 text-sm text-white placeholder:text-gray-300"
                    onKeyDown={(e) =>
                      e.key === 'Enter' && addActivityToObjective(objective.id)
                    }
                  />
                  <Button
                    onClick={() => addActivityToObjective(objective.id)}
                    size="sm"
                    className="bg-green-600 px-4 hover:bg-green-700"
                  >
                    +
                  </Button>
                </div>

                {/* Activities list for this objective */}
                <div className="space-y-2">
                  {objective.activities.length > 0 && (
                    <div className="mb-2 text-sm text-gray-300">
                      Actividades ({objective.activities.length}):
                    </div>
                  )}
                  {objective.activities.map((activity, activityIndex) => (
                    <div
                      key={activityIndex}
                      className="flex items-center gap-2 rounded bg-slate-600/50 p-2 text-sm"
                    >
                      <span className="flex-1 text-gray-200">{activity}</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          removeActivityFromObjective(
                            objective.id,
                            activityIndex
                          )
                        }
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {objective.activities.length === 0 && (
                    <div className="text-sm text-gray-400 italic">
                      No hay actividades agregadas para este objetivo
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {texto.length === 0 && (
          <div className="py-8 text-center text-gray-400">
            No hay objetivos específicos agregados
          </div>
        )}

        <div className="mt-6 flex justify-between gap-4">
          <Button
            variant="ghost"
            onClick={onAnterior}
            className="group flex items-center gap-2 rounded px-4 py-2 font-semibold text-cyan-300 hover:underline"
          >
            <FaArrowLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
            Objetivo General
          </Button>
          <Button
            variant="destructive"
            onClick={onClose}
            className="rounded px-4 py-2 font-semibold text-white"
          >
            Cancelar
          </Button>
          <Button
            variant="ghost"
            onClick={() => onConfirm(texto)}
            className="group flex items-center gap-2 rounded px-4 py-2 font-semibold text-cyan-300 hover:underline"
          >
            Resumen
            <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalObjetivosEsp;
