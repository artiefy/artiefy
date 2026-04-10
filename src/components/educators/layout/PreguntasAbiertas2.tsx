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
    <div
      className="
        my-8 rounded-2xl border border-cyan-500/20 bg-slate-900 p-8 shadow-2xl
      "
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <h2
          className="
            mb-6 bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-2xl
            font-extrabold tracking-tight text-transparent
          "
        >
          {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta de Completado'}
        </h2>

        <div>
          <Label htmlFor="text" className="font-semibold text-white">
            Texto de la Pregunta
          </Label>
          <textarea
            id="text"
            name="text"
            value={formData.text}
            onChange={handleChange}
            placeholder="Escribe la pregunta aquí..."
            required
            className="
              mt-2 w-full rounded-lg border border-cyan-500/30 bg-slate-800 p-3
              text-white shadow-md transition-all duration-200 outline-none
              placeholder:text-slate-400
              focus:ring-2 focus:ring-cyan-400
            "
          />
        </div>

        <div
          className="
            grid grid-cols-1 gap-6
            md:grid-cols-2
          "
        >
          <div>
            <Label htmlFor="correctAnswer" className="font-semibold text-white">
              Palabra que completa
            </Label>
            <Input
              id="correctAnswer"
              name="correctAnswer"
              value={formData.correctAnswer}
              onChange={handleChange}
              placeholder="Ejemplo: revolución"
              required
              className="
                mt-2 w-full rounded-lg border border-cyan-500/30 bg-slate-800
                text-white
                placeholder:text-slate-400
                focus:ring-2 focus:ring-cyan-400
              "
            />
          </div>
          <div>
            <Label htmlFor="pesoPregunta" className="font-semibold text-white">
              Porcentaje de la Pregunta
            </Label>
            <Input
              type="number"
              id="pesoPregunta"
              name="pesoPregunta"
              value={formData.pesoPregunta}
              onChange={handleChange}
              min={1}
              max={100}
              required
              className="
                mt-2 w-full rounded-lg border border-cyan-500/30 bg-slate-800
                text-white
                placeholder:text-slate-400
                focus:ring-2 focus:ring-cyan-400
              "
            />
          </div>
        </div>

        {isUploading && (
          <div className="my-4">
            <Progress value={uploadProgress} className="w-full bg-slate-700" />
            <p className="mt-2 text-center text-sm text-slate-300">
              {uploadProgress}% subido
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            className="
              border-cyan-500/30 text-cyan-300 transition-all duration-150
              hover:bg-cyan-950/40 hover:text-white
            "
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="
              bg-cyan-600 font-bold text-white shadow-md transition-all
              duration-150
              hover:bg-cyan-700
            "
          >
            {editingQuestion ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PreguntasAbiertas2;
