import React, { useState } from 'react';

import { Button } from '~/components/projects/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/projects/ui/dialog';
import { typeProjects } from '~/server/actions/project/typeProject';

// Define explicit types for props and IA result
interface ProyectoGenerado {
  project_name?: string;
  project_description?: string;
  justification?: string;
  general_objective?: string;
  specific_objectives?: string[];
  tasks?: { task_name: string }[];
  categoryId?: number;
  numMeses?: number;
  project_type?: string;
  fechaInicio?: string;
  fechaFin?: string;
  [key: string]: unknown;
}

interface ModalGenerarProyectoProps {
  isOpen: boolean;
  onClose: () => void;
  onProyectoGenerado: (data: ProyectoGenerado) => void;
  resetOnOpen?: boolean;
  objetivoGen?: string;
  currentUser?: { name: string };
}

export default function ModalGenerarProyecto({
  isOpen,
  onClose,
  onProyectoGenerado,
  resetOnOpen,
  objetivoGen,
  currentUser,
}: ModalGenerarProyectoProps) {
  const [form, setForm] = useState({
    project_type: '',
    industry: '',
    project_objectives: '',
    team_members: '',
    project_requirements: '',
  });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ProyectoGenerado | null>(null);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<{ id: number; name: string }[]>(
    []
  );

  // Handler for textarea
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    // Auto-resize functionality
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

  // Nuevo handler para el select de tipo de proyecto
  const handleProjectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, project_type: e.target.value });
  };

  const handleGenerar = async () => {
    setLoading(true);
    setError('');
    // Mostrar el cuerpo que se envía
    console.log('Cuerpo enviado a IA:', form);
    try {
      const res = await fetch(
        'http://agentes-alb-900454314.us-east-2.elb.amazonaws.com/plan_project',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      // Mostrar la respuesta completa
      console.log('Respuesta completa:', res);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error al generar el proyecto:', errorText);
        throw new Error('Error al generar el proyecto');
      }
      const data: ProyectoGenerado = await res.json();
      console.log('Información generada por IA:', data);
      // Añade el tipo de proyecto seleccionado por el usuario al objeto enviado al resumen
      const resultadoFinal: ProyectoGenerado = {
        ...data,
        project_type: form.project_type,
      };
      setResultado(resultadoFinal);
      onProyectoGenerado(resultadoFinal);
      onClose();
    } catch (err) {
      setError('No se pudo generar el proyecto');
      console.error('Catch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías al montar el componente
  React.useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch('/api/super-admin/categories');
        const data = await res.json();
        setCategorias(Array.isArray(data) ? data : []);
      } catch (_error) {
        setCategorias([]);
      }
    };
    fetchCategorias();
  }, []);

  // Efecto separado solo para cargar el usuario logueado
  React.useEffect(() => {
    if (currentUser?.name && !form.team_members) {
      setForm((prev) => ({
        ...prev,
        team_members: currentUser.name,
      }));
    }
  }, [currentUser, form.team_members]);

  // Efecto separado para manejar la apertura del modal
  React.useEffect(() => {
    if (!isOpen) return;

    console.log('DEBUG - Modal abierto, resetOnOpen:', resetOnOpen);
    console.log('DEBUG - objetivoGen:', objetivoGen);
    console.log('DEBUG - currentUser en modal:', currentUser);

    // Si se debe resetear el formulario
    if (resetOnOpen) {
      setForm({
        project_type: '',
        industry: '',
        project_objectives: objetivoGen ?? '',
        team_members: currentUser?.name ?? '',
        project_requirements: '',
      });
      setResultado(null);
      setError('');
      return;
    }

    // Solo sincronizar objetivos si no es un reset
    if (objetivoGen) {
      setForm((prev) => ({
        ...prev,
        project_objectives: objetivoGen,
      }));
    }
  }, [isOpen, resetOnOpen, objetivoGen, currentUser]);

  // useEffect para inicializar alturas cuando se abra el modal
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
          if (textarea instanceof HTMLTextAreaElement && textarea.value) {
            // Inline handleTextAreaChange logic to avoid dependency warning
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
          }
        });
      }, 100);
    }
  }, [
    isOpen,
    form.project_objectives,
    form.team_members,
    form.project_requirements,
  ]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-h-[90vh] max-w-2xl overflow-y-auto"
          aria-describedby="modal-generar-proyecto-desc"
        >
          <DialogHeader>
            <DialogTitle className="break-words">
              Generar Proyecto con IA
            </DialogTitle>
          </DialogHeader>
          {/* Descripción accesible para el modal */}
          <p id="modal-generar-proyecto-desc" className="sr-only">
            Complete los campos para generar un proyecto automáticamente con
            inteligencia artificial.
          </p>
          <div className="space-y-3">
            {/* Selector para el tipo de proyecto */}
            <div>
              <label
                htmlFor="project_type"
                className="block text-sm font-medium break-words"
              >
                Tipo de Proyecto
              </label>
              <select
                name="project_type"
                value={form.project_type}
                onChange={handleProjectTypeChange}
                className="w-full truncate rounded border p-2"
                required
              >
                <option value="" className="bg-[#0F2940] text-gray-500">
                  -- Seleccione un Tipo de Proyecto --
                </option>
                {typeProjects.map((tp) => (
                  <option
                    key={tp.value}
                    value={tp.value}
                    className="bg-[#0F2940] break-words"
                  >
                    {tp.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Selector para la categoría */}
            <div>
              <label
                htmlFor="industry"
                className="block text-sm font-medium break-words"
              >
                Categoría (Industria)
              </label>
              <select
                name="industry"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full truncate rounded border p-2"
                required
              >
                <option value="" className="bg-[#0F2940] text-gray-500">
                  -- Seleccione una Categoria --
                </option>
                {categorias.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.name}
                    className="bg-[#0F2940] break-words"
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="project_objectives"
                className="block text-sm font-medium break-words"
              >
                Objetivos del Proyecto
              </label>
              <textarea
                name="project_objectives"
                placeholder="Objetivos del proyecto"
                value={form.project_objectives}
                onChange={handleTextAreaChange}
                rows={1}
                className="w-full resize-none overflow-hidden rounded border p-2 break-words"
                disabled={!!objetivoGen}
                style={{ wordBreak: 'break-word' }}
              />
            </div>
            <div>
              <label
                htmlFor="team_members"
                className="block text-sm font-medium break-words"
              >
                Miembros del Equipo
              </label>
              <textarea
                name="team_members"
                placeholder="Miembros del equipo"
                value={form.team_members}
                onChange={handleTextAreaChange}
                rows={1}
                className="w-full resize-none overflow-hidden rounded border p-2 break-words"
                disabled={!!currentUser?.name}
                style={{ wordBreak: 'break-word' }}
              />
            </div>
            <div>
              <label
                htmlFor="project_requirements"
                className="block text-sm font-medium break-words"
              >
                Requisitos del Proyecto
              </label>
              <textarea
                name="project_requirements"
                placeholder="Requisitos del proyecto"
                value={form.project_requirements}
                onChange={handleTextAreaChange}
                rows={1}
                className="w-full resize-none overflow-hidden rounded border p-2 break-words"
                style={{ wordBreak: 'break-word' }}
              />
            </div>
            {error && <div className="break-words text-red-500">{error}</div>}
            {resultado && (
              <div className="rounded bg-slate-100 p-2 text-slate-800">
                <div className="max-h-60 overflow-y-auto">
                  <pre className="text-xs break-words whitespace-pre-wrap">
                    {JSON.stringify(resultado, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                className="truncate bg-emerald-500 text-white"
                onClick={handleGenerar}
                disabled={loading}
              >
                {loading ? 'Generando...' : 'Generar'}
              </Button>
              <Button variant="outline" onClick={onClose} className="truncate">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
