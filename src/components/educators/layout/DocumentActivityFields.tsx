'use client';

import type { QuestionFilesSubida } from '~/types/typesActi';
import type { ChangeEvent } from 'react';

interface DocumentActivityFieldsProps {
  formData: QuestionFilesSubida;
  helpFile: File | null;
  imageFile: File | null;
  isEditing: boolean;
  textColorClass?: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onHelpFileChange: (file: File | null) => void;
  onImageFileChange: (file: File | null) => void;
}

const DocumentActivityFields: React.FC<DocumentActivityFieldsProps> = ({
  formData,
  helpFile,
  imageFile,
  isEditing,
  textColorClass = 'text-white',
  onChange,
  onHelpFileChange,
  onImageFileChange,
}) => {
  return (
    <div
      className="
        mt-8 space-y-8 rounded-2xl border border-[#22C4D3] bg-[#01142B] p-8
        shadow-2xl
      "
    >
      <div>
        <h3
          className="
            mb-2 bg-gradient-to-r from-[#22C4D3] to-[#00BDD8] bg-clip-text
            text-2xl font-extrabold tracking-tight text-transparent
          "
        >
          Presentación de trabajo
        </h3>
        <p className="text-base text-[#22C4D3] opacity-90">
          Este bloque se habilita para actividades de entrega de documento.
        </p>
      </div>

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
          onChange={onChange}
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
          onChange={onChange}
        />
      </div>

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
            {helpFile?.name ??
              formData.archivoKey?.split('/').pop() ??
              'Selecciona un archivo de ayuda (PDF, Word, video...)'}
          </span>
          <label
            className="
              cursor-pointer rounded-md bg-[#00BDD8] px-3 py-1 text-sm font-bold
              text-[#01142B] transition-all duration-150
              hover:bg-[#00A5C0]
            "
          >
            Seleccionar
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,video/*,application/*"
              required={!isEditing && !formData.archivoKey}
              onChange={(e) => onHelpFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-medium text-[#00BDD8]">
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
            {imageFile?.name ??
              formData.portadaKey?.split('/').pop() ??
              'Selecciona una imagen complementaria'}
          </span>
          <label
            className="
              cursor-pointer rounded-md bg-[#22C4D3] px-3 py-1 text-sm font-bold
              text-[#01142B] transition-all duration-150
              hover:bg-[#00A5C0]
            "
          >
            Seleccionar
            <input
              type="file"
              accept="image/*"
              required={!isEditing && !formData.portadaKey}
              onChange={(e) => onImageFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default DocumentActivityFields;
