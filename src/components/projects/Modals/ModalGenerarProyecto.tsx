import React, { useState } from 'react';
import { Button } from '~/components/projects/ui/button';
import { Input } from '~/components/projects/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/projects/ui/dialog';
import { typeProjects } from '~/server/actions/project/typeProject';

interface ModalGenerarProyectoProps {
  isOpen: boolean;
  onClose: () => void;
  onProyectoGenerado: (data: any) => void;
  resetOnOpen?: boolean;
  objetivoGen?: string;
  currentUser?: { name: string }; // <-- Nuevo prop para el usuario logueado
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
    team_members: '', // Inicializar vacío, se llenará en useEffect
    project_requirements: '',
  });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [categorias, setCategorias] = useState<{ id: number; name: string }[]>(
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handler para textarea
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

  // Función para inicializar la altura de textareas existentes
  const initializeTextAreaHeight = (element: HTMLTextAreaElement) => {
    if (element && element.value) {
      const event = {
        target: element,
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleTextAreaChange(event);
    }
  };

  // Nuevo handler para el select de tipo de proyecto
  const handleProjectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, project_type: e.target.value });
  };

  const handleGenerar = async () => {
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const res = await fetch('http://3.142.77.31:5000/plan_project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al generar el proyecto');
      const data = await res.json();
      setResultado(data);
      setShowConfirmModal(true); // Mostrar modal de confirmación
      // onProyectoGenerado(data); // Solo llamar si se confirma
    } catch (err) {
      setError('No se pudo generar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearProyecto = async () => {
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      // Ajusta el endpoint y los datos según tu API
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultado),
      });
      if (!res.ok) throw new Error('Error al crear el proyecto');
      setCreateSuccess('Proyecto creado exitosamente');
      onProyectoGenerado(resultado);
      setShowConfirmModal(false);
      setResultado(null);
    } catch (err) {
      setCreateError('No se pudo crear el proyecto');
    } finally {
      setCreating(false);
    }
  };

  // Cargar categorías al montar el componente
  React.useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch('/api/super-admin/categories');
        const data = await res.json();
        setCategorias(Array.isArray(data) ? data : []);
      } catch (error) {
        setCategorias([]);
      }
    };
    fetchCategorias();
  }, []);

  // Efecto separado solo para cargar el usuario logueado
  React.useEffect(() => {
    console.log('DEBUG - currentUser cambió:', currentUser);
    console.log('DEBUG - currentUser?.name:', currentUser?.name);
    console.log('DEBUG - typeof currentUser:', typeof currentUser);
    console.log('DEBUG - currentUser completo:', JSON.stringify(currentUser));

    if (currentUser?.name) {
      console.log('DEBUG - Actualizando team_members con:', currentUser.name);
      setForm((prev) => ({
        ...prev,
        team_members: currentUser.name,
      }));
    } else {
      console.log('DEBUG - No hay currentUser.name disponible');
      // Intentar obtener el usuario de otra manera si es necesario
      // Por ejemplo, desde localStorage o context
    }
  }, [currentUser]);

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
        team_members: currentUser?.name || '',
        project_requirements: '',
      });
      setResultado(null);
      setError('');
      setShowConfirmModal(false);
      setCreating(false);
      setCreateError('');
      setCreateSuccess('');
      return;
    }

    // Solo sincronizar objetivos si no es un reset
    if (objetivoGen) {
      setForm((prev) => ({
        ...prev,
        project_objectives: objetivoGen,
      }));
    }

    // Forzar la carga del usuario si está disponible
    if (currentUser?.name) {
      setForm((prev) => ({
        ...prev,
        team_members: currentUser.name,
      }));
    }
  }, [isOpen, resetOnOpen, objetivoGen, currentUser]);

  // useEffect para inicializar alturas cuando se abra el modal
  React.useEffect(() => {
    if (isOpen) {
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
    form.project_objectives,
    form.team_members,
    form.project_requirements,
  ]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-words">
              Generar Proyecto con IA
            </DialogTitle>
          </DialogHeader>
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

      {/* Modal de confirmación para crear el proyecto en la BD */}
      <Dialog
        open={showConfirmModal}
        onOpenChange={() => setShowConfirmModal(false)}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="break-words">
              ¿Crear este proyecto en la base de datos?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="max-h-64 overflow-auto rounded bg-slate-100 p-2 text-slate-800">
              <pre className="text-xs break-words whitespace-pre-wrap">
                {JSON.stringify(resultado, null, 2)}
              </pre>
            </div>
            {createError && (
              <div className="break-words text-red-500">{createError}</div>
            )}
            {createSuccess && (
              <div className="break-words text-green-600">{createSuccess}</div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                className="truncate bg-cyan-600 text-white"
                onClick={handleCrearProyecto}
                disabled={creating}
              >
                {creating ? 'Creando...' : 'Crear Proyecto'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={creating}
                className="truncate"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
