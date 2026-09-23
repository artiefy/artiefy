interface NeonSearchShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Pill-shaped search field with a beam of light that travels around its
 * whole border. The beam is a conic gradient whose start angle is animated
 * (see `.neon-search-ring` in globals.css); a blurred copy behind it adds the
 * halo. The inner surface sits 2px inside so only the ring shows.
 */
export function NeonSearchShell({
  children,
  className = '',
}: NeonSearchShellProps) {
  return (
    <div
      className={`
        group relative isolate h-10 w-full rounded-full
        ${className}
      `}
    >
      <div
        aria-hidden="true"
        className="
          neon-search-glow pointer-events-none absolute -inset-0.5 -z-10
          rounded-full
        "
      />
      <div
        aria-hidden="true"
        className="
          neon-search-ring pointer-events-none absolute inset-0 rounded-full
        "
      />
      <div
        className="
          absolute inset-[2px] flex items-center rounded-full border
          border-border/40 bg-slate-800 px-4 transition-all duration-300
          group-focus-within:border-primary/30
          group-focus-within:bg-slate-900
        "
      >
        {children}
      </div>
    </div>
  );
}
