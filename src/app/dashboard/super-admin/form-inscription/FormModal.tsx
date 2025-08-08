'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';

const defaultFields = {
  nombres: '',
  apellidos: '',
  identificacionTipo: '',
  identificacionNumero: '',
  email: '',
  direccion: '',
  pais: '',
  ciudad: '',
  telefono: '',
  birthDate: '',
  fecha: '',
  nivelEducacion: '',
  tieneAcudiente: '',
  acudienteNombre: '',
  acudienteContacto: '',
  acudienteEmail: '',
  programa: '',
  fechaInicio: '',
  comercial: '',
  sede: '',
  horario: '',
  pagoInscripcion: 'No',
  pagoCuota1: 'No',
  modalidad: 'Virtual',
  numeroCuotas: '',
};

type FieldDefinition = {
  type: 'input' | 'select';
  name: keyof typeof defaultFields;
  label: string;
  inputType?: string;
  options?: string[];
};

export default function FormModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose(): void;
}) {
  const [fields, setFields] = useState({ ...defaultFields });
  const [step, setStep] = useState(0);
  const [dateOptions, setDateOptions] = useState<string[]>([]);
  const [commercialOptions, setCommercialOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/super-admin/form-inscription')
      .then((res) => res.json())
      .then((data) => {
        setDateOptions(data.dates?.map((d: any) => d.startDate) || []);
        setCommercialOptions(data.comercials?.map((c: any) => c.name) || []);
      });
  }, []);

  const handleChange = (key: keyof typeof defaultFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = 'usuario-logueado-id';

    await fetch('/api/super-admin/form-inscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, fields, startDate: fields.fechaInicio }),
    });

    onClose();
  };

  const steps: FieldDefinition[][] = [
    [
      { type: 'input', name: 'nombres', label: 'Nombres*' },
      { type: 'input', name: 'apellidos', label: 'Apellidos*' },
      {
        type: 'input',
        name: 'identificacionTipo',
        label: 'Identificación Tipo*',
      },
      {
        type: 'input',
        name: 'identificacionNumero',
        label: 'Número de Identificación*',
      },
      {
        type: 'input',
        name: 'email',
        label: 'Correo Electrónico*',
        inputType: 'email',
      },
      { type: 'input', name: 'direccion', label: 'Dirección*' },
    ],
    [
      { type: 'input', name: 'pais', label: 'País de Residencia*' },
      { type: 'input', name: 'ciudad', label: 'Ciudad de Residencia*' },
      { type: 'input', name: 'telefono', label: 'Teléfono*' },
      {
        type: 'input',
        name: 'birthDate',
        label: 'Fecha de Nacimiento*',
        inputType: 'date',
      },
      { type: 'input', name: 'nivelEducacion', label: 'Nivel de Educación*' },
    ],
    [
      {
        type: 'select',
        name: 'tieneAcudiente',
        label: '¿Acudiente o empresa?',
        options: ['Sí', 'No'],
      },
      ...(fields.tieneAcudiente === 'Sí'
        ? ([
            {
              type: 'input',
              name: 'acudienteNombre',
              label: 'Nombre Acudiente / Empresa',
            },
            {
              type: 'input',
              name: 'acudienteContacto',
              label: 'Contacto Acudiente / Empresa',
            },
            {
              type: 'input',
              name: 'acudienteEmail',
              label: 'Email Acudiente / Empresa',
              inputType: 'email',
            },
          ] as FieldDefinition[])
        : []),
    ],
    [
      { type: 'input', name: 'programa', label: 'Programa*' },
      {
        type: 'select',
        name: 'fechaInicio',
        label: 'Fecha de Inicio*',
        options: dateOptions,
      },
      {
        type: 'select',
        name: 'comercial',
        label: 'Comercial*',
        options: commercialOptions,
      },
    ],
    [
      { type: 'input', name: 'sede', label: 'Sede*' },
      { type: 'input', name: 'horario', label: 'Horario*' },
      {
        type: 'select',
        name: 'pagoInscripcion',
        label: 'Pago de Inscripción*',
        options: ['Sí', 'No'],
      },
      {
        type: 'select',
        name: 'pagoCuota1',
        label: 'Pago de Primera Cuota*',
        options: ['Sí', 'No'],
      },
      {
        type: 'select',
        name: 'modalidad',
        label: 'Modalidad del Estudiante*',
        options: ['Virtual', 'Presencial'],
      },
      {
        type: 'input',
        name: 'numeroCuotas',
        label: 'Número de Cuotas*',
        inputType: 'number',
      },
    ],
  ];

  const renderField = (field: FieldDefinition) => {
    if (field.type === 'input') {
      return (
        <label key={field.name} className="flex flex-col text-white">
          <span className="mb-1">{field.label}</span>
          <input
            type={field.inputType || 'text'}
            value={fields[field.name]}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="rounded bg-[#1C2541] p-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </label>
      );
    }

    if (field.type === 'select') {
      return (
        <label key={field.name} className="flex flex-col text-white">
          <span className="mb-1">{field.label}</span>
          <select
            value={fields[field.name]}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="rounded bg-[#1C2541] p-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            <option value="">Selecciona una opción</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      );
    }

    return null;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      <Dialog.Panel className="w-full max-w-3xl rounded-xl bg-[#0B132B] p-8 text-white shadow-lg shadow-cyan-500/20">
        <Dialog.Title className="mb-6 text-2xl font-semibold text-cyan-400">
          Paso {step + 1} de {steps.length}
        </Dialog.Title>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2"
        >
          {steps[step].map(renderField)}

          <div className="col-span-2 mt-6 flex justify-between">
            {step > 0 ? (
              <button
                type="button"
                className="rounded bg-gray-800 px-4 py-2 text-sm hover:bg-gray-700"
                onClick={() => setStep((s) => s - 1)}
              >
                Anterior
              </button>
            ) : (
              <div />
            )}

            {step < steps.length - 1 ? (
              <button
                type="button"
                className="rounded bg-cyan-500 px-6 py-2 font-semibold hover:bg-cyan-400"
                onClick={() => setStep((s) => s + 1)}
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                className="rounded bg-cyan-500 px-6 py-2 font-semibold hover:bg-cyan-400"
              >
                Enviar Inscripción
              </button>
            )}
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
}
