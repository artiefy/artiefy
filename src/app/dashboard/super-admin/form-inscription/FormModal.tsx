'use client';

import { Dialog } from '@headlessui/react';
import { useEffect, useState } from 'react';

/* =======================
   Listas estáticas
   ======================= */
const COUNTRY_LIST: string[] = [
  'Afganistán',
  'Alemania',
  'Argentina',
  'Australia',
  'Brasil',
  'Canadá',
  'Chile',
  'China',
  'Colombia',
  'Corea del Sur',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'Egipto',
  'El Salvador',
  'Emiratos Árabes Unidos',
  'España',
  'Estados Unidos',
  'Francia',
  'Guatemala',
  'Honduras',
  'India',
  'Indonesia',
  'Italia',
  'Japón',
  'Kenia',
  'México',
  'Nigeria',
  'Panamá',
  'Paraguay',
  'Perú',
  'Portugal',
  'Reino Unido',
  'República Dominicana',
  'Rusia',
  'Sudáfrica',
  'Suecia',
  'Suiza',
  'Uruguay',
  'Venezuela',
  'Vietnam',
];

const NIVEL_EDUCACION_OPTS = [
  'Primaria',
  'Grado 9',
  'Bachillerato',
  'Pregrado',
  'Posgrado',
  'Doctorado',
] as const;

const SEDES_OPTS = [
  'Principal Cali',
  'Ponao-Florencia',
  'Mocoa',
  'Planeta Rica',
] as const;

/* =======================
   Tipos y defaults
   ======================= */
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

type Fields = typeof defaultFields;

type InscriptionConfig = {
  dates?: { startDate: string }[];
  comercials?: { name: string }[];
};

type ProgramsResponse = {
  ok: boolean;
  programs: { id: number; title: string; description: string | null }[];
  page?: number;
  pageSize?: number;
  total?: number;
};

export default function FormModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose(): void;
}) {
  const [fields, setFields] = useState<Fields>({ ...defaultFields });

  // Opciones dinámicas
  const [dateOptions, setDateOptions] = useState<string[]>([]);
  const [commercialOptions, setCommercialOptions] = useState<string[]>([]);
  const [programTitles, setProgramTitles] = useState<string[]>([]);

  // Estados UI
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [errorPrograms, setErrorPrograms] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOK, setSubmittedOK] = useState<boolean | null>(null);

  // Cargar fechas y comerciales
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/super-admin/form-inscription');
        const data: InscriptionConfig = await res.json();
        setDateOptions((data.dates ?? []).map((d) => d.startDate));
        setCommercialOptions((data.comercials ?? []).map((c) => c.contact));
      } catch {
        setDateOptions([]);
        setCommercialOptions([]);
      }
    };
    if (isOpen) load();
  }, [isOpen]);

  // Cargar programas
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoadingPrograms(true);
        setErrorPrograms(null);
        const res = await fetch('/api/super-admin/form-inscription/programs');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ProgramsResponse = await res.json();
        setProgramTitles((data.programs ?? []).map((p) => p.title));
      } catch {
        setErrorPrograms('No se pudieron cargar los programas');
        setProgramTitles([]);
      } finally {
        setLoadingPrograms(false);
      }
    };
    if (isOpen) loadPrograms();
  }, [isOpen]);

  const handleChange = (key: keyof Fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmittedOK(null);

    try {
      // TODO: Reemplaza por el id real del usuario logueado
      const userId = 'usuario-logueado-id';

      const res = await fetch('/api/super-admin/form-inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fields, startDate: fields.fechaInicio }),
      });

      if (!res.ok) throw new Error('Error al enviar inscripción');
      setSubmittedOK(true);
      // Si quieres limpiar:
      // setFields({ ...defaultFields });
    } catch {
      setSubmittedOK(false);
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmittedOK(null), 4000);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      {/* Panel con scroll interno */}
      <Dialog.Panel className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-[#0B132B] text-white shadow-xl shadow-cyan-500/20">
        {/* Header sticky dentro del modal */}
        <div className="sticky top-0 z-10 border-b border-cyan-900/30 bg-[#0B132B]/95 px-6 py-4 backdrop-blur">
          <Dialog.Title className="text-2xl font-semibold text-cyan-400">
            Formulario de Inscripción
          </Dialog.Title>
          <p className="text-sm text-gray-300">
            Completa los campos y envía tu inscripción.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6">
          {/* Datos personales */}
          <Section title="Datos personales">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldInput
                label="Nombres*"
                value={fields.nombres}
                onChange={(v) => handleChange('nombres', v)}
              />
              <FieldInput
                label="Apellidos*"
                value={fields.apellidos}
                onChange={(v) => handleChange('apellidos', v)}
              />

              <FieldSelect
                label="Tipo de Identificación*"
                value={fields.identificacionTipo}
                onChange={(v) => handleChange('identificacionTipo', v)}
                placeholder="Selecciona un tipo de identificación"
                options={[
                  'Cédula de Ciudadanía',
                  'Cédula de Extranjería',
                  'Pasaporte',
                  'Tarjeta de Identidad',
                ]}
              />
              <FieldInput
                label="Número de Identificación*"
                value={fields.identificacionNumero}
                onChange={(v) => handleChange('identificacionNumero', v)}
              />

              <FieldInput
                label="Correo Electrónico*"
                type="email"
                value={fields.email}
                onChange={(v) => handleChange('email', v)}
              />
              <FieldInput
                label="Dirección*"
                value={fields.direccion}
                onChange={(v) => handleChange('direccion', v)}
              />
            </div>
          </Section>

          {/* Ubicación y educación */}
          <Section title="Ubicación y educación">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldSelect
                label="País de Residencia*"
                value={fields.pais}
                onChange={(v) => handleChange('pais', v)}
                placeholder="Selecciona un país"
                options={COUNTRY_LIST}
              />
              <FieldInput
                label="Ciudad de Residencia*"
                value={fields.ciudad}
                onChange={(v) => handleChange('ciudad', v)}
              />

              <FieldInput
                label="Teléfono*"
                value={fields.telefono}
                onChange={(v) => handleChange('telefono', v)}
              />
              <FieldInput
                label="Fecha de Nacimiento*"
                type="date"
                value={fields.birthDate}
                onChange={(v) => handleChange('birthDate', v)}
              />

              <FieldSelect
                label="Nivel de Educación*"
                value={fields.nivelEducacion}
                onChange={(v) => handleChange('nivelEducacion', v)}
                placeholder="Elige"
                options={[...NIVEL_EDUCACION_OPTS]}
              />
            </div>
          </Section>

          {/* Acudiente (opcional) */}
          <Section title="Acudiente o empresa (opcional)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldSelect
                label="¿Acudiente o empresa?"
                value={fields.tieneAcudiente}
                onChange={(v) => handleChange('tieneAcudiente', v)}
                placeholder="Selecciona una opción"
                options={['Sí', 'No']}
              />

              {fields.tieneAcudiente === 'Sí' && (
                <>
                  <FieldInput
                    label="Nombre Acudiente / Empresa"
                    value={fields.acudienteNombre}
                    onChange={(v) => handleChange('acudienteNombre', v)}
                  />
                  <FieldInput
                    label="Contacto Acudiente / Empresa"
                    value={fields.acudienteContacto}
                    onChange={(v) => handleChange('acudienteContacto', v)}
                  />
                  <FieldInput
                    label="Email Acudiente / Empresa"
                    type="email"
                    value={fields.acudienteEmail}
                    onChange={(v) => handleChange('acudienteEmail', v)}
                  />
                </>
              )}
            </div>
          </Section>

          {/* Programa y fechas */}
          <Section title="Programa y fechas">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldSelect
                label={
                  loadingPrograms
                    ? 'Programa* (cargando...)'
                    : errorPrograms
                      ? 'Programa* (error al cargar)'
                      : 'Programa*'
                }
                value={fields.programa}
                onChange={(v) => handleChange('programa', v)}
                placeholder={
                  loadingPrograms
                    ? 'Cargando programas...'
                    : errorPrograms
                      ? 'Error al cargar programas'
                      : programTitles.length === 0
                        ? 'No hay programas'
                        : 'Selecciona un programa'
                }
                options={programTitles}
                disabled={
                  loadingPrograms ||
                  !!errorPrograms ||
                  programTitles.length === 0
                }
              />

              <FieldSelect
                label="Fecha de Inicio*"
                value={fields.fechaInicio}
                onChange={(v) => handleChange('fechaInicio', v)}
                placeholder="Selecciona una fecha"
                options={dateOptions}
              />

              <FieldSelect
                label="Comercial*"
                value={fields.comercial}
                onChange={(v) => handleChange('comercial', v)}
                placeholder="Selecciona un comercial"
                options={commercialOptions}
              />
            </div>
          </Section>

          {/* Sede, modalidad y cuotas */}
          <Section title="Sede y detalles de pago">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldSelect
                label="Sede*"
                value={fields.sede}
                onChange={(v) => handleChange('sede', v)}
                placeholder="Elige"
                options={[...SEDES_OPTS]}
              />
              <FieldInput
                label="Horario*"
                value={fields.horario}
                onChange={(v) => handleChange('horario', v)}
              />

              <FieldSelect
                label="Pago de Inscripción*"
                value={fields.pagoInscripcion}
                onChange={(v) => handleChange('pagoInscripcion', v)}
                placeholder="Selecciona una opción"
                options={['Sí', 'No']}
              />
              <FieldSelect
                label="Pago de Primera Cuota*"
                value={fields.pagoCuota1}
                onChange={(v) => handleChange('pagoCuota1', v)}
                placeholder="Selecciona una opción"
                options={['Sí', 'No']}
              />

              <FieldSelect
                label="Modalidad del Estudiante*"
                value={fields.modalidad}
                onChange={(v) => handleChange('modalidad', v)}
                placeholder="Selecciona una modalidad"
                options={['Virtual', 'Presencial']}
              />
              <FieldInput
                label="Número de Cuotas*"
                type="number"
                value={fields.numeroCuotas}
                onChange={(v) => handleChange('numeroCuotas', v)}
              />
            </div>
          </Section>

          {/* Acciones */}
          <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-cyan-900/30 bg-[#0B132B] py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-600 px-5 py-2 text-sm hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-cyan-500 px-6 py-2 text-sm font-semibold text-black shadow-md transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {submitting ? 'Enviando…' : 'Enviar Inscripción'}
            </button>

            {submittedOK === true && (
              <span className="self-center text-xs text-green-400">
                Inscripción enviada correctamente.
              </span>
            )}
            {submittedOK === false && (
              <span className="self-center text-xs text-red-400">
                No se pudo enviar la inscripción.
              </span>
            )}
          </div>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
}

/* =======================
   Subcomponentes UI
   ======================= */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-semibold text-cyan-300">{title}</h2>
      {children}
    </section>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className="flex flex-col text-white">
      <span className="mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded bg-[#1C2541] p-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col text-white">
      <span className="mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded bg-[#1C2541] p-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
