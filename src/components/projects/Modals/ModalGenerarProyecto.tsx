import React, { useState } from 'react';
import { Button } from '~/components/projects/ui/button';
import { Input } from '~/components/projects/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/projects/ui/dialog';

interface ModalGenerarProyectoProps {
  isOpen: boolean;
  onClose: () => void;
  onProyectoGenerado: (data: any) => void;
  resetOnOpen?: boolean; // Nuevo prop
}

export default function ModalGenerarProyecto({
  isOpen,
  onClose,
  onProyectoGenerado,
  resetOnOpen,
}: ModalGenerarProyectoProps) {
  const [form, setForm] = useState({
    project_type: '',
    industry: '',
    project_objectives: '',
    team_members: '',
    project_requirements: '',
  });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGenerar = async () => {
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const res = await fetch('http://18.191.230.0:5000/plan_project', {
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

  React.useEffect(() => {
    if (resetOnOpen) {
      setForm({
        project_type: '',
        industry: '',
        project_objectives: '',
        team_members: '',
        project_requirements: '',
      });
      setResultado(null);
      setError('');
      setShowConfirmModal(false);
      setCreating(false);
      setCreateError('');
      setCreateSuccess('');
    }
  }, [resetOnOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Proyecto con IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              name="project_type"
              placeholder="Tipo de proyecto"
              value={form.project_type}
              onChange={handleChange}
            />
            <Input
              name="industry"
              placeholder="Industria"
              value={form.industry}
              onChange={handleChange}
            />
            <Input
              name="project_objectives"
              placeholder="Objetivos del proyecto"
              value={form.project_objectives}
              onChange={handleChange}
            />
            <Input
              name="team_members"
              placeholder="Miembros del equipo"
              value={form.team_members}
              onChange={handleChange}
            />
            <Input
              name="project_requirements"
              placeholder="Requisitos del proyecto"
              value={form.project_requirements}
              onChange={handleChange}
            />
            {error && <div className="text-red-500">{error}</div>}
            {resultado && (
              <div className="rounded bg-slate-100 p-2 text-slate-800">
                <pre>{JSON.stringify(resultado, null, 2)}</pre>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                className="bg-emerald-500 text-white"
                onClick={handleGenerar}
                disabled={loading}
              >
                {loading ? 'Generando...' : 'Generar'}
              </Button>
              <Button variant="outline" onClick={onClose}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Crear este proyecto en la base de datos?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="max-h-64 overflow-auto rounded bg-slate-100 p-2 text-slate-800">
              <pre>{JSON.stringify(resultado, null, 2)}</pre>
            </div>
            {createError && <div className="text-red-500">{createError}</div>}
            {createSuccess && (
              <div className="text-green-600">{createSuccess}</div>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                className="bg-cyan-600 text-white"
                onClick={handleCrearProyecto}
                disabled={creating}
              >
                {creating ? 'Creando...' : 'Crear Proyecto'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={creating}
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
