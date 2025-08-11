'use client';

import * as React from 'react';

import * as ProgressPrimitive from '@radix-ui/react-progress';

import '~/styles/progress.css';
import { cn } from '~/lib/utils';

interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
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
    <div className="progress-container relative">
      <ProgressPrimitive.Root
        data-slot="progress"
        className={cn(className)}
        {...props}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="progress-bar"
          style={
            { '--progress-width': `${value || 0}%` } as React.CSSProperties
          }
          data-percentage={showPercentage ? `${value || 0}%` : undefined}
        />
      </ProgressPrimitive.Root>
    </div>
  );
};

export { Progress };
