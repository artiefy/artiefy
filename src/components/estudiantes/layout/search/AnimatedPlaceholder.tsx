import type { PlaceholderPhase } from './useRotatingPlaceholder';

interface AnimatedPlaceholderProps {
  text: string;
  phase: PlaceholderPhase;
  className?: string;
}

/**
 * Visual stand-in for an input's `placeholder`, which the browser does not
 * let us animate. Sits over the input (the parent must be `relative`), never
 * takes clicks, and is hidden from screen readers: the input keeps its own
 * `aria-label`. Styles live in globals.css (`.typing-caret`, `.typing-dots`).
 */
export function AnimatedPlaceholder({
  text,
  phase,
  className = '',
}: AnimatedPlaceholderProps) {
  const isMoving = phase !== 'holding';

  return (
    <span
      aria-hidden="true"
      className={`
        pointer-events-none absolute inset-0 flex items-center overflow-hidden
        whitespace-nowrap text-muted-foreground select-none
        ${className}
      `}
    >
      {text}
      {isMoving ? (
        <span className="typing-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      ) : null}
      <span
        className={`typing-caret ${isMoving ? '' : 'typing-caret--blink'}`}
      />
    </span>
  );
}
