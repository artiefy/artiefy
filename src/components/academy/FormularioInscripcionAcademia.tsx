'use client';

import { useState } from 'react';

import { CheckCircle2, Loader2 } from 'lucide-react';

import { enviar, estilos } from './seccion/comun';

// Formulario de inscripción público de una academia
// (<slug>.artiefy.com/inscripcion). No requiere sesión.

export function FormularioInscripcionAcademia({
  slug,
  cursos,
}: {
  slug: string;
  cursos: { id: number; title: string }[];
}) {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    documento: '',
    courseId: '',
    mensaje: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const enviarFormulario = async () => {
    setEnviando(true);
    setError(null);
    try {
      await enviar(`/api/academia/${slug}/inscripciones`, 'POST', form);
      setListo(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  if (listo) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="size-10 text-[var(--ac-primario)]" />
        <p className="text-xl font-bold text-white">¡Recibimos tus datos!</p>
        <p className="max-w-sm text-white/60">
          La academia se pondrá en contacto contigo pronto.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void enviarFormulario();
      }}
    >
      <label className="block">
        <span className={estilos.etiqueta}>Nombre completo *</span>
        <input
          required
          value={form.nombre}
          onChange={(e) => set('nombre')(e.target.value)}
          className={estilos.campo}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={estilos.etiqueta}>Correo *</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
            className={estilos.campo}
          />
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Celular</span>
          <input
            value={form.telefono}
            onChange={(e) => set('telefono')(e.target.value)}
            className={estilos.campo}
          />
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Documento</span>
          <input
            value={form.documento}
            onChange={(e) => set('documento')(e.target.value)}
            className={estilos.campo}
          />
        </label>
        <label className="block">
          <span className={estilos.etiqueta}>Curso de interés</span>
          <select
            value={form.courseId}
            onChange={(e) => set('courseId')(e.target.value)}
            className={estilos.campo}
          >
            <option value="" className="bg-[var(--ac-fondo)]">
              — Seleccionar —
            </option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id} className="bg-[var(--ac-fondo)]">
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className={estilos.etiqueta}>Mensaje</span>
        <textarea
          value={form.mensaje}
          onChange={(e) => set('mensaje')(e.target.value)}
          className={estilos.area}
        />
      </label>
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className={`${estilos.boton} w-full`}
      >
        {enviando && <Loader2 className="size-4 animate-spin" />}
        Enviar inscripción
      </button>
    </form>
  );
}
