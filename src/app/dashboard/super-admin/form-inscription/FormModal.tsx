'use client';

import { useEffect, useState } from 'react';

import { Dialog } from '@headlessui/react';

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

interface InscriptionConfig {
  dates?: { startDate: string }[];
  comercials?: { contact: string }[];
  horarios?: { schedule: string }[]; // 👈 nuevo
}

interface ProgramsResponse {
  ok: boolean;
  programs: { id: number; title: string; description: string | null }[];
  page?: number;
  pageSize?: number;
  total?: number;
}

interface Props {
  isOpen: boolean;
  // <- serializable a ojos del checker
  onClose: unknown;
}

function isFn(x: unknown): x is () => void {
  return typeof x === 'function';
}

export default function FormModal({ isOpen, onClose }: Props) {
  const handleClose = () => {
    if (isFn(onClose)) onClose(); // ejecuta si realmente es función
  };
  const [fields, setFields] = useState<Fields>({ ...defaultFields });
  const [horarioOptions, setHorarioOptions] = useState<string[]>([]);

  // Opciones dinámicas
  const [dateOptions, setDateOptions] = useState<string[]>([]);
  const [commercialOptions, setCommercialOptions] = useState<string[]>([]);
  const [programTitles, setProgramTitles] = useState<string[]>([]);

  // Estados UI
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [errorPrograms, setErrorPrograms] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOK, setSubmittedOK] = useState<boolean | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>(
    {}
  );
  const [docIdentidad, setDocIdentidad] = useState<File | null>(null);
  const [reciboServicio, setReciboServicio] = useState<File | null>(null);
  const [actaGrado, setActaGrado] = useState<File | null>(null);
  const [pagare, setPagare] = useState<File | null>(null);
  function FieldFile({
    label,
    onChange,
    required = false,
  }: {
    label: string;
    onChange: (f: File | null) => void;
    required?: boolean;
  }) {
    return (
      <label className="flex flex-col text-white">
        <span className="mb-1">
          {label} {required && <span className="text-red-400">*</span>}
        </span>
        <input
          type="file"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="rounded bg-[#1C2541] p-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        />
      </label>
    );
  }
  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
  void isRecord; // <- para evitar warning de unused
  // Cargar fechas y comerciales
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/super-admin/form-inscription');
        const data: InscriptionConfig = await res.json();
        setDateOptions((data.dates ?? []).map((d) => d.startDate));
        setCommercialOptions((data.comercials ?? []).map((c) => c.contact));
        setHorarioOptions((data.horarios ?? []).map((h) => h.schedule)); // 👈 nuevo
      } catch {
        setDateOptions([]);
        setCommercialOptions([]);
        setHorarioOptions([]); // 👈 nuevo
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

  function FieldSelect({
    label,
    value,
    onChange,
    options,
    placeholder = 'Selecciona una opción',
    disabled = false,
    error,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    placeholder?: string;
    disabled?: boolean;
    error?: string;
  }) {
    return (
      <label className="flex flex-col text-white">
        <span className="mb-1">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={!!error}
          className={`rounded bg-[#1C2541] p-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-60 ${error ? 'border border-red-500' : ''}`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {error && <span className="mt-1 text-xs text-red-400">{error}</span>}
      </label>
    );
  }

  const handleChange = (key: keyof Fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    // limpiar error al escribir
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Validación básica por campo
  const validate = (f: Fields) => {
    const e: Partial<Record<keyof Fields, string>> = {};

    const required: (keyof Fields)[] = [
      'nombres',
      'apellidos',
      'identificacionTipo',
      'identificacionNumero',
      'email',
      'direccion',
      'pais',
      'ciudad',
      'telefono',
      'birthDate',
      'nivelEducacion',
      'programa',
      'fechaInicio',
      'comercial',
      'sede',
      'horario',
      'pagoInscripcion',
      'pagoCuota1',
      'modalidad',
      'numeroCuotas',
    ];

    required.forEach((k) => {
      if (!String(f[k] ?? '').trim()) e[k] = 'Este campo es obligatorio';
    });

    // email formato
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
      e.email = 'Correo electrónico inválido';

    // teléfono básico
    if (f.telefono && !/^[\d\s+\-()]{7,20}$/.test(f.telefono))
      e.telefono = 'Teléfono inválido';

    // número de cuotas entero positivo
    if (f.numeroCuotas && !/^[1-9]\d*$/.test(f.numeroCuotas))
      e.numeroCuotas = 'Debe ser un número entero mayor a 0';

    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmittedOK(null);
    setSubmitMessage('');

    // Validación previa de tus campos de texto
    const v = validate(fields);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      setSubmitting(false);
      setSubmittedOK(false);
      setSubmitMessage('Por favor corrige los campos marcados.');
      return;
    }

    try {
      const fd = new FormData();
      // Campos “core” (los que ya mapeas a users y los extra)
      Object.entries(fields).forEach(([k, val]) =>
        fd.append(k, String(val ?? ''))
      );

      // Archivos (si están)
      if (docIdentidad) fd.append('docIdentidad', docIdentidad);
      if (reciboServicio) fd.append('reciboServicio', reciboServicio);
      if (actaGrado) fd.append('actaGrado', actaGrado);
      if (pagare) fd.append('pagare', pagare);

      const res = await fetch('/api/super-admin/form-inscription/', {
        method: 'POST',
        body: fd, // ¡sin Content-Type manual!
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as unknown;

        const message =
          isRecord(j) && typeof j.error === 'string'
            ? j.error
            : `Error HTTP ${res.status}`;

        throw new Error(message);
      }

      setSubmittedOK(true);
      setSubmitMessage('¡Inscripción enviada con éxito!');
      setTimeout(() => {
        setFields({ ...defaultFields });
        setErrors({});
        setDocIdentidad(null);
        setReciboServicio(null);
        setActaGrado(null);
        setPagare(null);
        handleClose();
      }, 1500);
    } catch (err: unknown) {
      setSubmittedOK(false);

      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'No se pudo enviar la inscripción.';

      setSubmitMessage(msg);
    } finally {
      setSubmitting(false);
      setTimeout(() => setSubmittedOK(null), 4000);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      {/* Panel con scroll interno */}
      <Dialog.Panel className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-[#0B132B] text-white shadow-xl shadow-cyan-500/20">
        {/* Header sticky */}
        <div className="sticky top-0 z-10 border-b border-cyan-900/30 bg-[#0B132B]/95 px-6 py-4 backdrop-blur">
          <Dialog.Title className="text-2xl font-semibold text-cyan-400">
            Formulario de Inscripción
          </Dialog.Title>
          <p className="text-sm text-gray-300">
            Completa los campos y envía tu inscripción.
          </p>
        </div>

        {/* Banner resultado */}
        {submittedOK !== null && submitMessage && (
          <div
            className={`mx-6 mt-4 rounded-lg px-4 py-3 text-center text-lg font-bold ${
              submittedOK
                ? 'bg-green-600/20 text-green-300'
                : 'bg-red-600/20 text-red-300'
            }`}
            role="alert"
          >
            {submitMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6">
          {/* Datos personales */}
          <Section title="Datos personales">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldInput
                label="Nombres*"
                value={fields.nombres}
                onChange={(v) => handleChange('nombres', v)}
                error={errors.nombres}
              />
              <FieldInput
                label="Apellidos*"
                value={fields.apellidos}
                onChange={(v) => handleChange('apellidos', v)}
                error={errors.apellidos}
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
                error={errors.identificacionTipo}
              />
              <FieldInput
                label="Número de Identificación*"
                value={fields.identificacionNumero}
                onChange={(v) => handleChange('identificacionNumero', v)}
                error={errors.identificacionNumero}
              />

              <FieldInput
                label="Correo Electrónico*"
                type="email"
                value={fields.email}
                onChange={(v) => handleChange('email', v)}
                error={errors.email}
              />
              <FieldInput
                label="Dirección*"
                value={fields.direccion}
                onChange={(v) => handleChange('direccion', v)}
                error={errors.direccion}
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
                error={errors.pais}
              />
              <FieldInput
                label="Ciudad de Residencia*"
                value={fields.ciudad}
                onChange={(v) => handleChange('ciudad', v)}
                error={errors.ciudad}
              />

              <FieldInput
                label="Teléfono*"
                value={fields.telefono}
                onChange={(v) => handleChange('telefono', v)}
                error={errors.telefono}
              />
              <FieldInput
                label="Fecha de Nacimiento*"
                type="date"
                value={fields.birthDate}
                onChange={(v) => handleChange('birthDate', v)}
                error={errors.birthDate}
              />

              <FieldSelect
                label="Nivel de Educación*"
                value={fields.nivelEducacion}
                onChange={(v) => handleChange('nivelEducacion', v)}
                placeholder="Elige"
                options={[...NIVEL_EDUCACION_OPTS]}
                error={errors.nivelEducacion}
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
                error={errors.tieneAcudiente}
              />

              {fields.tieneAcudiente === 'Sí' && (
                <>
                  <FieldInput
                    label="Nombre Acudiente / Empresa"
                    value={fields.acudienteNombre}
                    onChange={(v) => handleChange('acudienteNombre', v)}
                    error={errors.acudienteNombre}
                  />
                  <FieldInput
                    label="Contacto Acudiente / Empresa"
                    value={fields.acudienteContacto}
                    onChange={(v) => handleChange('acudienteContacto', v)}
                    error={errors.acudienteContacto}
                  />
                  <FieldInput
                    label="Email Acudiente / Empresa"
                    type="email"
                    value={fields.acudienteEmail}
                    onChange={(v) => handleChange('acudienteEmail', v)}
                    error={errors.acudienteEmail}
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
                error={errors.programa}
              />

              <FieldSelect
                label="Fecha de Inicio*"
                value={fields.fechaInicio}
                onChange={(v) => handleChange('fechaInicio', v)}
                placeholder="Selecciona una fecha"
                options={dateOptions}
                error={errors.fechaInicio}
              />

              <FieldSelect
                label="Comercial*"
                value={fields.comercial}
                onChange={(v) => handleChange('comercial', v)}
                placeholder="Selecciona un comercial"
                options={commercialOptions}
                error={errors.comercial}
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
                error={errors.sede}
              />
              <FieldSelect
                label="Horario*"
                value={fields.horario}
                onChange={(v) => handleChange('horario', v)}
                placeholder={
                  horarioOptions.length
                    ? 'Selecciona un horario'
                    : 'No hay horarios'
                }
                options={horarioOptions}
                disabled={horarioOptions.length === 0}
                error={errors.horario}
              />

              <FieldSelect
                label="Pago de Inscripción*"
                value={fields.pagoInscripcion}
                onChange={(v) => handleChange('pagoInscripcion', v)}
                placeholder="Selecciona una opción"
                options={['Sí', 'No']}
                error={errors.pagoInscripcion}
              />
              <FieldSelect
                label="Pago de Primera Cuota*"
                value={fields.pagoCuota1}
                onChange={(v) => handleChange('pagoCuota1', v)}
                placeholder="Selecciona una opción"
                options={['Sí', 'No']}
                error={errors.pagoCuota1}
              />

              <FieldSelect
                label="Modalidad del Estudiante*"
                value={fields.modalidad}
                onChange={(v) => handleChange('modalidad', v)}
                placeholder="Selecciona una modalidad"
                options={['Virtual', 'Presencial']}
                error={errors.modalidad}
              />
              <FieldInput
                label="Número de Cuotas*"
                type="number"
                value={fields.numeroCuotas}
                onChange={(v) => handleChange('numeroCuotas', v)}
                error={errors.numeroCuotas}
              />
            </div>
          </Section>

          <Section title="Documentos requeridos">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldFile
                label="Subir Documento de Identidad"
                required
                onChange={setDocIdentidad}
              />
              <FieldFile
                label="Subir Acta de Grado (Bachiller o Noveno)"
                onChange={setActaGrado}
              />
              <FieldFile
                label="Subir Recibo Servicio Público"
                onChange={setReciboServicio}
              />
              <FieldFile label="Subir Pagaré" required onChange={setPagare} />
            </div>
          </Section>

          {/* Acciones */}
          <div className="sticky bottom-0 mt-6 flex gap-3 border-t border-cyan-900/30 bg-[#0B132B] py-4">
            <button
              type="button"
              onClick={handleClose}
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
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;
  error?: string;
}) {
  return (
    <label className="flex flex-col text-white">
      <span className="mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`rounded bg-[#1C2541] p-2 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:outline-none ${error ? 'border border-red-500' : ''}`}
      />
      {error && <span className="mt-1 text-xs text-red-400">{error}</span>}
    </label>
  );
}
