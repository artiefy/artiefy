'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import '~/styles/progress.css';
import { cn } from '~/lib/utils';

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  showPercentage?: boolean;
  value?: number;
}

const Progress = ({
  className,
  value,
  showPercentage = true,
  ...props
}: ProgressProps) => {
  return (
    <div className="relative progress-container">
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(
          "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="bg-primary h-full w-full flex-1 transition-all progress-bar"
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showPercentage && (
        <span className="absolute right-0 top-0 text-xs text-gray-700">
          {value || 0}%
        </span>
      )}
    </div>
  );
};

export { Progress };
