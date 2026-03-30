'use client';
import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { Progress } from '~/components/educators/ui/progress';

import type { QuestionFilesSubida } from '~/types/typesActi';

interface formSubida {
  activityId: number;
  editingQuestion?: QuestionFilesSubida;
  onSubmit?: () => void;
  onCancel?: () => void;
}

interface UploadS3Response {
  url: string;
  fields: Record<string, string>;
  key: string;
}

interface SaveResponse {
  success: boolean;
}

const FormActCompletado: React.FC<formSubida> = ({
  activityId,
  editingQuestion,
  onCancel,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);

  const [formData, setFormData] = useState<QuestionFilesSubida>({
    id: '',
    text: '',
    parametros: '',
    pesoPregunta: 0,
    archivoKey: '',
    portadaKey: '',
  });

  useEffect(() => {
    if (editingQuestion) {
      setFormData(editingQuestion);
    } else {
      setFormData({
        id: '',
        text: '',
        parametros: '',
        pesoPregunta: 0,
        archivoKey: '',
        portadaKey: '',
      });
    }
  }, [editingQuestion]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === 'pesoPregunta' ? Number(value) : value,
    }));
  };

  const uploadToS3 = async (file: File): Promise<string> => {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: file.type,
        fileSize: file.size,
        fileName: file.name,
      }),
    });
    if (!res.ok) throw new Error('Error al generar la URL de subida');

    const responseJson = (await res.json()) as UploadS3Response;
    const { url, fields, key } = responseJson;
    const uploadForm = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
      uploadForm.append(k, v);
    });
    uploadForm.append('file', file);

    const uploadRes = await fetch(url, {
      method: 'POST',
      body: uploadForm,
    });
    if (!uploadRes.ok) throw new Error('Error al subir archivo');
    return key;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const method = editingQuestion ? 'PUT' : 'POST';
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 400);

    if (!editingQuestion) {
      formData.id = crypto.randomUUID();
    }

    try {
      let archivoKey = formData.archivoKey;
      let portadaKey = formData.portadaKey;

      if (file1) {
        archivoKey = await uploadToS3(file1);
      }
      if (file2) {
        portadaKey = await uploadToS3(file2);
      }

      formData.archivoKey = archivoKey;
      formData.portadaKey = portadaKey;

      const response = await fetch('/api/educadores/question/archivos', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId, questionsFilesSubida: formData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en la solicitud: ${errorText}`);
      }

      const data = (await response.json()) as SaveResponse;
      if (data.success) {
        toast('Pregunta guardada', {
          description: 'La pregunta se guardó correctamente',
        });
        window.location.reload();
      } else {
        toast('Error', {
          description: 'Error al guardar la pregunta',
        });
      }
    } catch (error) {
      console.error('Error al guardar la pregunta:', error);
      toast('Error', {
        description: `Error: ${(error as Error).message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="
        mt-8 space-y-8 rounded-2xl border border-[#22C4D3]/40 bg-[#01142B] p-8
        shadow-2xl
      "
    >
      <h2
        className="
          mb-4 bg-gradient-to-r from-[#22C4D3] to-[#00BDD8] bg-clip-text
          text-center text-2xl font-extrabold tracking-tight text-transparent
        "
      >
        {editingQuestion ? 'Actualizar' : 'Crear'} Pregunta del tipo:
        Presentación de trabajo
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block font-bold text-[#22C4D3]">Pregunta</label>
          <textarea
            className="
              w-full rounded-lg border border-[#1d283a]/40 bg-[#1e2939] p-3
              text-white shadow-md transition-all duration-200 outline-none
              placeholder:text-[#00BDD8]
              focus:border focus:border-[#22C4D3]
              focus:shadow-[0_0_0_2px_rgba(34,196,211,0.15)]
            "
            placeholder="Digite aquí la descripción del trabajo"
            name="text"
            value={formData.text}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="block font-bold text-[#22C4D3]">
            Criterios de evaluación
          </label>
          <textarea
            className="
              w-full rounded-lg border border-[#1d283a]/40 bg-[#1e2939] p-3
              text-white shadow-md transition-all duration-200 outline-none
              placeholder:text-[#00BDD8]
              focus:border focus:border-[#22C4D3]
              focus:shadow-[0_0_0_2px_rgba(34,196,211,0.15)]
            "
            placeholder="Parámetros de evaluación"
            name="parametros"
            value={formData.parametros}
            onChange={handleChange}
          />
        </div>

        {/* Archivo de ayuda (documento, video, etc.) */}
        <div className="space-y-2">
          <label className="block font-bold text-[#22C4D3]">
            Archivo de ayuda
          </label>
          <div
            className="
              relative flex items-center justify-between rounded-lg border
              border-[#1d283a]/40 bg-[#1e2939] px-4 py-2 shadow transition-all
              duration-200
              focus-within:border-[#22C4D3]
              focus-within:shadow-[0_0_0_2px_rgba(34,196,211,0.15)]
            "
          >
            <span className="truncate text-sm text-[#00BDD8]">
              {file1?.name ??
                'Selecciona un archivo de ayuda (PDF, Word, video...)'}
            </span>
            <label
              className="
                cursor-pointer rounded-md bg-[#00BDD8] px-3 py-1 text-sm
                font-bold text-[#01142B] transition-all duration-150
                hover:bg-[#00A5C0]
              "
            >
              Seleccionar
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,video/*,application/*"
                onChange={(e) => setFile1(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Imagen complementaria */}
        <div className="space-y-2">
          <label className="block font-bold text-[#22C4D3]">
            Recurso complementario (imagen)
          </label>
          <div
            className="
              relative flex items-center justify-between rounded-lg border
              border-[#1d283a]/40 bg-[#1e2939] px-4 py-2 shadow transition-all
              duration-200
              focus-within:border-[#22C4D3]
              focus-within:shadow-[0_0_0_2px_rgba(34,196,211,0.15)]
            "
          >
            <span className="truncate text-sm text-[#00BDD8]">
              {file2?.name ?? 'Selecciona una imagen complementaria'}
            </span>
            <label
              className="
                cursor-pointer rounded-md bg-[#22C4D3] px-3 py-1 text-sm
                font-bold text-[#01142B] transition-all duration-150
                hover:bg-[#00A5C0]
              "
            >
              Seleccionar
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile2(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {isUploading && (
          <div className="my-1">
            <Progress value={uploadProgress} className="w-full" />
            <p className="mt-2 text-center text-sm text-[#00BDD8]">
              {uploadProgress}% Completado
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-end space-x-2">
          {editingQuestion && (
            <Button
              type="button"
              variant="outline"
              className="
                border-[#22C4D3] text-[#22C4D3] transition-all duration-150
                hover:bg-[#01142B] hover:text-white
              "
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            className="
              border-none bg-[#22C4D3] font-bold text-[#01142B] transition-all
              duration-150
              hover:bg-[#00A5C0]
            "
          >
            {editingQuestion ? 'Actualizar' : 'Enviar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FormActCompletado;
