import { SignOutButton } from '@clerk/nextjs';

import { LogoAcademia } from './LogoAcademia';

/** La sesión no pertenece a esta academia (es de otra o de Artiefy). */
export function SinAcceso({
  academia,
}: {
  academia: { nombre: string; acronimo: string | null; logoKey: string | null };
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <LogoAcademia {...academia} className="h-12" />
      <h1 className="text-2xl font-bold">
        Esta cuenta no es de {academia.nombre}
      </h1>
      <p className="max-w-md text-white/60">
        Inicia sesión con la cuenta que te dio {academia.nombre}. Si no la
        tienes, pídesela a la academia.
      </p>
      <SignOutButton redirectUrl="/sign-in">
        <button
          type="button"
          className="rounded-full bg-[var(--ac-primario)] px-6 py-2.5 font-semibold text-[var(--ac-primario-texto)]"
        >
          Cerrar sesión
        </button>
      </SignOutButton>
    </main>
  );
}
