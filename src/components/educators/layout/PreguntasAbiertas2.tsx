'use client';
import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { Input } from '~/components/educators/ui/input';
import { Label } from '~/components/educators/ui/label';
import { Progress } from '~/components/educators/ui/progress';

import type { Completado2 } from '~/types/typesActi';

interface PreguntasAbiertasProps {
  activityId: number;
  editingQuestion?: Completado2;
  onSubmit: (question: Completado2) => void;
  onCancel?: () => void;
  isUploading: boolean;
}

interface TotalPercentageResponse {
  totalPercentage: number;
}

interface SaveResponse {
  success: boolean;
}

const PreguntasAbiertas2: React.FC<PreguntasAbiertasProps> = ({
  activityId,
  editingQuestion,
  onCancel,
  isUploading,
}) => {
  const [formData, setFormData] = useState<Completado2>({
    id: '',
    text: '',
    correctAnswer: '',
    answer: '',
    pesoPregunta: 0,
  });

  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    setFormData(
      editingQuestion ?? {
        id: '',
        text: '',
        correctAnswer: '',
        answer: '',
        pesoPregunta: 0,
      }
    );
  }, [editingQuestion]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateTotalPercentage = async (newPeso: number) => {
    try {
      const res = await fetch(
        `/api/educadores/question/totalPercentage?activityId=${activityId}`
      );

      const percentageData = (await res.json()) as TotalPercentageResponse;
      const { totalPercentage } = percentageData;

      const adjustedTotal =
        totalPercentage + newPeso - (editingQuestion?.pesoPregunta ?? 0);

      return adjustedTotal > 100;
    } catch {
      toast.error('Error validando el porcentaje');
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (await validateTotalPercentage(formData.pesoPregunta)) {
      toast.error('El porcentaje total no puede superar el 100%');
      return;
    }

    const method = editingQuestion ? 'PUT' : 'POST';
    const questionId = editingQuestion?.id ?? crypto.randomUUID();

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const response = await fetch('/api/educadores/question/completar2', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          questionsACompletar2: { ...formData, id: questionId },
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = (await response.json()) as SaveResponse;
      if (data.success) {
        toast.success('Pregunta guardada correctamente');
        setTimeout(() => {
          window.location.reload(); // ✅ Esto garantiza visibilidad inmediata
        }, 500);
      } else {
        toast.error('No se pudo guardar la pregunta');
      }
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      clearInterval(interval);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    window.location.reload(); // Cancelar también recarga
  };

  return (
    <div className="my-6 rounded-xl border bg-slate-50 p-6 shadow-lg">
      <h2 className="mb-4 border-b pb-2 text-xl font-bold text-gray-800">
        {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta de Completado'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="text">Texto de la Pregunta</Label>
          <textarea
            id="text"
            name="text"
            value={formData.text}
            onChange={handleChange}
            placeholder="Ej: La independencia fue en el año _____."
            required
            className="w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="correctAnswer">Palabra de Completado</Label>
            <Input
              id="correctAnswer"
              name="correctAnswer"
              value={formData.correctAnswer}
              onChange={handleChange}
              required
              placeholder="Ej: 1810"
            />
          </div>
          <div>
            <Label htmlFor="pesoPregunta">Porcentaje</Label>
            <Input
              type="number"
              id="pesoPregunta"
              name="pesoPregunta"
              value={formData.pesoPregunta}
              onChange={handleChange}
              min={1}
              max={100}
              required
            />
          </div>
        </div>

        {isUploading && (
          <div className="my-4">
            <Progress value={uploadProgress} />
            <p className="text-center text-sm text-gray-500">
              {uploadProgress}% cargado
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {editingQuestion ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PreguntasAbiertas2;
