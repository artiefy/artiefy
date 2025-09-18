'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { Dialog } from '@headlessui/react';


function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let num = bytes;
  while (num >= 1024 && i < units.length - 1) {
    num /= 1024;
    i++;
  }
  return `${num.toFixed(1)} ${units[i]}`;
}

function FileBadge({
  file,
  onClear,
}: {
  file: File | null;
  onClear: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }

    // 1) Intento rápido con objectURL
    try {
      const u = URL.createObjectURL(file);
      setUrl(u);

      // 2) Si el tipo viene vacío o es HEIC/HEIF, hacemos fallback a dataURL
      const needsFallback =
        !file.type ||
        /heic|heif/i.test(file.name || '') ||
        /heic|heif/i.test(file.type || '');

      if (needsFallback) {
        const reader = new FileReader();
        reader.onload = () => {
          // Solo sobreescribe si sigue siendo el mismo archivo
          setUrl(typeof reader.result === 'string' ? reader.result : u);
          // Liberamos el objectURL inicial si ya no se usa
          URL.revokeObjectURL(u);
        };
        reader.readAsDataURL(file);
        return () => {
          reader.abort?.();
        };
      }

      return () => URL.revokeObjectURL(u);
    } catch {
      // 3) Último recurso: FileReader para todo lo demás
      const reader = new FileReader();
      reader.onload = () => {
        setUrl(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.readAsDataURL(file);
      return () => reader.abort?.();
    }
  }, [file]);


  if (!file) return null;

  const isImg =
    file.type.startsWith('image/') ||
    /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name || '');

  const isPdf =
    file.type === 'application/pdf' ||
    /\.pdf$/i.test(file.name || '');


  return (
    <div className="mt-2 flex items-center gap-3 rounded border border-cyan-900/40 bg-[#0f1a38] p-2">
      {isImg && url ? (
        <Image
          src={url}
          alt={file.name}
          width={48}
          height={48}
          className="h-12 w-12 rounded object-cover"
          unoptimized
          priority
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded bg-[#101a35] text-xs text-gray-300">
          {isPdf ? 'PDF' : 'FILE'}
        </div>
      )}


      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{file.name}</div>
        <div className="text-xs text-gray-400">
          {formatBytes(file.size)} • {file.type || 'archivo'}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-cyan-400 underline"
          >
            Ver
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="text-xs rounded border border-gray-600 px-2 py-1 hover:bg-gray-800"
      >
        Quitar
      </button>
    </div>
  );
}



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

const ID_TYPES = [
  'CC (Cédula de ciudadanía)',
  'TI (Tarjeta de identidad)',
  'Número de Identificación Tributaria',
  'ID',
  'Código NES',
  'Número Único de Identificación Personal',
  'Pasaporte',
  'Permiso Especial de Permanencia',
  'Registro Civil de Nacimiento',
  'Salvoconducto de Permanencia',
  'Social Security Number',
  'Permiso de Protección Temporal',
  'Registro único de migrantes venezolanos',
  'NIT Extranjeros',
  'Otro',
] as const;

/* =======================
   Tipos y defaults
   ======================= */
const defaultFields = {
  primerNombre: '',
  segundoNombre: '',        // opcional
  primerApellido: '',
  segundoApellido: '',      // opcional
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
  horarios?: { schedule: string }[];
  sedes?: { nombre: string }[]; // 👈 añadido
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
  const CUOTAS_OPTS = ['1', '2', '3', '4', '8', '10', '12'] as const;
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const resetForm = () => {
    setFields({ ...defaultFields });
    setErrors({});
    setDocIdentidad(null);
    setReciboServicio(null);
    setComprobanteInscripcion(null);
    setActaGrado(null);
    setPagare(null);
    setShowSuccess(false); // 👈 vuelve al formulario
  };



  const [comprobanteInscripcion, setComprobanteInscripcion] =
    useState<File | null>(null);

  function FieldFile({
    label,
    file,
    onChange,
    required = false,
    accept = 'application/pdf,image/*',
    error,
  }: {
    label: string;
    file: File | null;
    onChange: (f: File | null) => void;
    required?: boolean;
    accept?: string;
    error?: string;
  }) {
    const [inputKey, setInputKey] = useState(0);

    const clear = () => {
      onChange(null);
      setInputKey((k) => k + 1); // resetea el input file
    };

    return (
      <label className="flex flex-col text-white">
        <span className="mb-1">
          {label} {required && <span className="text-red-400">*</span>}
        </span>

        <input
          key={inputKey}
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          aria-required={required}
          aria-invalid={!!error}
          className={`rounded bg-[#1C2541] p-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none ${error ? 'border border-red-500' : ''}`}
        />


        {error && <span className="mt-1 text-xs text-red-400">{error}</span>}

        {/* Vista del archivo seleccionado */}
        <FileBadge file={file} onClear={clear} />
      </label>
    );
  }


  function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
  interface ProgramObj { title?: string | null }
  interface ApiErr { error: string }
  function hasError(p: unknown): p is ApiErr {
    return isRecord(p) && typeof p.error === 'string';
  }

  function hasProgram(p: unknown): p is { program: ProgramObj } {
    return isRecord(p) && 'program' in p && isRecord((p as Record<string, unknown>).program);
  }

  function hasEmailSent(p: unknown): p is { emailSent: boolean } {
    return isRecord(p) && typeof (p as Record<string, unknown>).emailSent === 'boolean';
  }

  void isRecord; // <- para evitar warning de unused
  // Cargar fechas y comerciales
  const [sedeOptions, setSedeOptions] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/super-admin/form-inscription');
        const data: InscriptionConfig = await res.json();
        setDateOptions((data.dates ?? []).map((d) => d.startDate));
        setCommercialOptions((data.comercials ?? []).map((c) => c.contact));
        setHorarioOptions((data.horarios ?? []).map((h) => h.schedule)); // 👈 nuevo
        setSedeOptions((data.sedes ?? []).map((s) => s.nombre)); // 👈 nuevo
      } catch {
        setDateOptions([]);
        setCommercialOptions([]);
        setHorarioOptions([]); // 👈 nuevo
        setSedeOptions([]); // 👈 nuevo
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

  // Normaliza según el campo: trim siempre; en textos colapsa espacios internos.
  function sanitizeValueByKey(key: keyof Fields, value: string) {
    const TRIM_AND_FOLD: (keyof Fields)[] = [
      'primerNombre', 'segundoNombre',
      'primerApellido', 'segundoApellido',
      'direccion', 'ciudad', 'comercial', 'programa',
      'sede', 'horario', 'pais', 'nivelEducacion',
      'tieneAcudiente', 'acudienteNombre', 'acudienteContacto',
      'acudienteEmail', 'modalidad',
    ];
    const TRIM_ONLY: (keyof Fields)[] = [
      'email', 'identificacionTipo', 'identificacionNumero',
      'telefono', 'numeroCuotas', 'fechaInicio', 'birthDate',
      'fecha', 'pagoInscripcion', 'pagoCuota1',
    ];
    if (typeof value !== 'string') return value as unknown as string;
    if (TRIM_AND_FOLD.includes(key)) return value.replace(/\s+/g, ' ').trim();
    if (TRIM_ONLY.includes(key)) return value.trim();
    return value.trim();
  }


  const handleChange = (key: keyof Fields, value: string) => {
    const sanitized = sanitizeValueByKey(key, value);
    setFields((prev) => ({ ...prev, [key]: sanitized }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };


  // estado nuevo

  // Validación básica por campo
  const validate = (f: Fields) => {
    const e: Partial<Record<keyof Fields, string>> = {};

    const required: (keyof Fields)[] = [
      'primerNombre',
      'primerApellido',
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
  // Validación previa de tus campos de texto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmittedOK(null);
    setSubmitMessage('');

    // ✅ Validación aquí, no en render
    const v = validate(fields);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      setSubmitting(false);
      setSubmittedOK(false);
      setSubmitMessage('Por favor corrige los campos marcados.');
      return;
    }

    // ✅ Validación condicional del comprobante aquí
    if (fields.pagoInscripcion === 'Sí' && !comprobanteInscripcion) {
      setSubmitting(false);
      setSubmittedOK(false);
      setSubmitMessage('Debes adjuntar el comprobante de pago de inscripción.');
      return;
    }

    if (Object.keys(v).length > 0) {
      setErrors(v);
      setSubmitting(false);
      setSubmittedOK(false);
      setSubmitMessage('Por favor corrige los campos marcados.');
      return;
    }

    // … dentro de handleSubmit, después de const v = validate(fields) …
    const fe: Record<string, string> = {};

    // Requeridos: documento de identidad y pagaré
    if (!docIdentidad) fe.docIdentidad = 'Adjunta el documento de identidad.';
    if (!pagare) fe.pagare = 'Adjunta el pagaré.';

    // (Opcional) Validaciones de tamaño/tipo
    const MAX_MB = 10;
    const check = (f: File | null, key: string) => {
      if (!f) return;
      if (f.size > MAX_MB * 1024 * 1024)
        fe[key] = `Máximo ${MAX_MB}MB por archivo.`;
      // ejemplo de tipo permitido
      const okType =
        f.type === 'application/pdf' || f.type.startsWith('image/');
      if (!okType) fe[key] = 'Solo PDF o imágenes.';
    };
    check(docIdentidad, 'docIdentidad');
    check(actaGrado, 'actaGrado');
    check(reciboServicio, 'reciboServicio');
    check(pagare, 'pagare');

    setFileErrors(fe);

    if (Object.keys(v).length > 0 || Object.keys(fe).length > 0) {
      setErrors(v);
      setSubmitting(false);
      setSubmittedOK(false);
      setSubmitMessage('Por favor corrige los campos marcados.');
      return;
    }


    try {
      const fd = new FormData();

      // Normaliza TODO antes de enviar
      (Object.entries(fields) as [keyof Fields, string][])
        .map(([k, v]) => [k, sanitizeValueByKey(k, v)])
        .forEach(([k, v]) => fd.append(String(k), v ?? ''));

      if (comprobanteInscripcion)
        fd.append('comprobanteInscripcion', comprobanteInscripcion);

      // Archivos (si están)
      if (docIdentidad) fd.append('docIdentidad', docIdentidad);
      if (reciboServicio) fd.append('reciboServicio', reciboServicio);
      if (actaGrado) fd.append('actaGrado', actaGrado);
      if (pagare) fd.append('pagare', pagare);

      const res = await fetch('/api/super-admin/form-inscription/', {
        method: 'POST',
        body: fd, // ¡sin Content-Type manual!
      });

      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const message = hasError(payload) ? payload.error : `Error HTTP ${res.status}`;
        throw new Error(message);
      }

      const programTitle =
        hasProgram(payload) && typeof payload.program.title === 'string'
          ? payload.program.title
          : fields.programa;

      const emailSent = hasEmailSent(payload) ? payload.emailSent : false;


      const successMsg = emailSent
        ? ` ¡Inscripción creada con éxito! Te enviamos tus credenciales a ${fields.email}. Programa: ${programTitle}.`
        : ` ¡Inscripción creada con éxito! Tu cuenta ya existía; no enviamos un nuevo correo. Programa: ${programTitle}.`;

      setSubmittedOK(true);
      setSubmitMessage(successMsg);
      setShowSuccess(true);


      // Reset de formulario y cierre
      setTimeout(() => {
        setFields({ ...defaultFields });
        setErrors({});
        setDocIdentidad(null);
        setReciboServicio(null);
        setComprobanteInscripcion(null);
        setActaGrado(null);
        setPagare(null);
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
      <Dialog.Panel className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-[#0B132B] text-white shadow-xl shadow-cyan-500/20 flex flex-col">
        {showSuccess ? (
          // ==== Pantalla de ÉXITO ====
          <div className="flex flex-col items-center justify-center gap-6 px-8 py-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1C2541] shadow shadow-cyan-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-cyan-400" aria-hidden="true">
                <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm13.28-2.03a.75.75 0 10-1.06-1.06L10.5 12.88l-1.72-1.72a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.5-4.5z" clipRule="evenodd" />
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-cyan-300">
                ¡Gracias por diligenciar tus datos!
              </h2>
              <p className="mt-2 text-gray-300">
                Ya puedes disfrutar de <span className="text-cyan-400 font-semibold">Artiefy</span>.
              </p>
            </div>

            {submitMessage && (
              <p className="max-w-xl text-sm text-gray-400">{submitMessage}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded bg-cyan-500 px-6 py-2 text-sm font-semibold text-black shadow-md transition hover:bg-cyan-400"
              >
                Llenar otro formulario
              </button>
              <a
                href="https://artiefy.com/"
                target="_blank"
                rel="noreferrer"
                className="rounded border border-gray-600 px-5 py-2 text-sm hover:bg-gray-800"
              >
                Ir a Artiefy
              </a>
            </div>
          </div>

        ) : (
          // ==== Pantalla de FORMULARIO ====
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Header sticky */}
              <div className="sticky top-0 z-10 border-b border-cyan-900/30 bg-[#0B132B]/95 px-6 py-4 backdrop-blur">
                <Dialog.Title className="text-2xl font-semibold text-cyan-400">
                  Formulario de Inscripción
                </Dialog.Title>
                <p className="text-sm text-gray-300">Completa los campos y envía tu inscripción.</p>
              </div>

              {/* Banner resultado */}
              {submittedOK !== null && submitMessage && (
                <div
                  className={`mx-6 mt-4 rounded-lg px-4 py-3 text-center text-lg font-bold ${submittedOK ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'
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
                      label="Primer nombre*"
                      value={fields.primerNombre}
                      onChange={(v) => handleChange('primerNombre', v)}
                      error={errors.primerNombre}
                    />
                    <FieldInput
                      label="Segundo nombre (opcional)"
                      value={fields.segundoNombre}
                      onChange={(v) => handleChange('segundoNombre', v)}
                      error={errors.segundoNombre}
                    />
                    <FieldInput
                      label="Primer apellido*"
                      value={fields.primerApellido}
                      onChange={(v) => handleChange('primerApellido', v)}
                      error={errors.primerApellido}
                    />
                    <FieldInput
                      label="Segundo apellido (opcional)"
                      value={fields.segundoApellido}
                      onChange={(v) => handleChange('segundoApellido', v)}
                      error={errors.segundoApellido}
                    />

                    <FieldSelect
                      label="Tipo de Identificación*"
                      value={fields.identificacionTipo}
                      onChange={(v) => handleChange('identificacionTipo', v)}
                      placeholder="Selecciona un tipo de identificación"
                      options={[...ID_TYPES]}
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
                      placeholder={
                        sedeOptions.length ? 'Selecciona una sede' : 'No hay sedes'
                      }
                      options={sedeOptions}
                      disabled={sedeOptions.length === 0}
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

                    <div className={fields.pagoInscripcion === 'Sí' ? 'block' : 'hidden'}>
                      <FieldFile
                        label="Subir comprobante de pago de inscripción (PDF/imagen)"
                        file={comprobanteInscripcion}
                        onChange={setComprobanteInscripcion}
                        error={fileErrors?.comprobanteInscripcion}
                        required={fields.pagoInscripcion === 'Sí'}
                      />
                    </div>



                    <FieldSelect
                      label="Número de Cuotas*"
                      value={fields.numeroCuotas}
                      onChange={(v) => handleChange('numeroCuotas', v)}
                      placeholder="Elige"
                      options={[...CUOTAS_OPTS]}
                      error={errors.numeroCuotas}
                    />
                  </div>
                </Section>

                <Section title="Documentos requeridos">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FieldFile
                      label="Subir Documento de Identidad"
                      required
                      file={docIdentidad}
                      onChange={setDocIdentidad}
                      error={fileErrors.docIdentidad}
                    />
                    <FieldFile
                      label="Subir Acta de Grado (Bachiller o Noveno)"
                      file={actaGrado}
                      onChange={setActaGrado}
                      error={fileErrors.actaGrado}
                    />
                    <FieldFile
                      label="Subir Recibo Servicio Público"
                      file={reciboServicio}
                      onChange={setReciboServicio}
                      error={fileErrors.reciboServicio}
                    />
                    <FieldFile
                      label="Subir Pagaré"
                      required
                      file={pagare}
                      onChange={setPagare}
                      error={fileErrors.pagare}
                    />
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
            </div>
          </>
        )}
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
