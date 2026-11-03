import { urlLogo } from '~/lib/academy/marca';

/** Logo de la academia; si no tiene, su acrónimo en el color principal. */
export function LogoAcademia({
  nombre,
  acronimo,
  logoKey,
  className = 'h-9',
}: {
  nombre: string;
  acronimo: string | null;
  logoKey: string | null;
  className?: string;
}) {
  const logo = urlLogo(logoKey);
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={nombre}
        className={`${className} w-auto object-contain`}
      />
    );
  }
  return (
    <span
      className={`${className} inline-flex items-center font-black tracking-wide text-[var(--ac-primario)]`}
    >
      {acronimo ?? nombre}
    </span>
  );
}
