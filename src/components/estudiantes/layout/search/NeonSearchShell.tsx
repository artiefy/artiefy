interface NeonSearchShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Pill-shaped search field of the header. Static on purpose: the travelling
 * beam (`.neon-search-ring`) is kept for the Artie idea composer only.
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
        className="
          absolute inset-0 flex items-center rounded-full border
          border-border/40 bg-slate-800 px-4 transition-all duration-300
          group-focus-within:border-primary/40
          group-focus-within:bg-slate-900
        "
      >
        {children}
      </div>
    </div>
  );
}
