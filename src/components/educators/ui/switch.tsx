'use client';

import * as React from 'react';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center space-x-3">
        <span className="text-primary text-sm font-medium">{label}</span>
        <input
          type="checkbox"
          className={`peer sr-only ${className}`}
          ref={ref}
          {...props}
        />
        <div className="peer peer-checked:bg-primary relative h-6 w-11 rounded-full bg-gray-400 transition-colors duration-300 after:absolute after:top-1 after:left-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };
