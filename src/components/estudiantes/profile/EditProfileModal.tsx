'use client';

import { type FormEvent, type ReactNode, useState } from 'react';

import { X } from 'lucide-react';

import {
  type MyProfile,
  updateMyProfile,
} from '~/server/actions/estudiantes/profile/profileActions';

interface EditProfileModalProps {
  profile: MyProfile;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: EditProfileModalProps) {
  const [username, setUsername] = useState(profile.username ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [website, setWebsite] = useState(profile.website ?? '');
  const [location, setLocation] = useState(profile.location ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = await updateMyProfile({ username, bio, website, location });
    setSaving(false);
    if (result.success) {
      onSaved();
    } else {
      setError(result.error ?? 'No se pudo guardar.');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="fixed inset-0 cursor-default bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="
          relative z-10 w-full max-w-md rounded-2xl border border-border
          bg-card p-6 shadow-2xl
        "
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Editar perfil</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="
              rounded-full p-1 text-muted-foreground transition
              hover:bg-white/10 hover:text-foreground
            "
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nombre de usuario">
            <div className="flex items-center rounded-xl border border-border bg-background px-3">
              <span className="text-sm text-muted-foreground">@</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="usuario"
                maxLength={30}
                className="
                  w-full bg-transparent px-1 py-2.5 text-sm text-foreground
                  outline-none
                  placeholder:text-muted-foreground
                "
              />
            </div>
          </Field>

          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Contá algo sobre vos"
              rows={3}
              maxLength={280}
              className="
                w-full resize-none rounded-xl border border-border bg-background
                px-3 py-2.5 text-sm text-foreground outline-none
                placeholder:text-muted-foreground
              "
            />
          </Field>

          <Field label="Ubicación">
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Ciudad, País"
              maxLength={80}
              className="
                w-full rounded-xl border border-border bg-background px-3
                py-2.5 text-sm text-foreground outline-none
                placeholder:text-muted-foreground
              "
            />
          </Field>

          <Field label="Sitio web">
            <input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="tusitio.com"
              maxLength={200}
              className="
                w-full rounded-xl border border-border bg-background px-3
                py-2.5 text-sm text-foreground outline-none
                placeholder:text-muted-foreground
              "
            />
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                rounded-xl bg-secondary px-4 py-2 text-sm font-medium
                text-foreground transition
                hover:bg-secondary/80
              "
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="
                rounded-xl bg-gradient-to-r from-primary to-cyan-500 px-5 py-2
                text-sm font-semibold text-primary-foreground transition-all
                hover:shadow-[0_0_25px_rgba(34,196,211,0.4)]
                disabled:opacity-60
              "
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
