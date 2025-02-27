'use client';

import * as React from 'react';
import '~/styles/progress.css';

interface ProgressProps {
	value?: number;
	showPercentage?: boolean;
}

function Progress({ value, showPercentage = true }: ProgressProps) {
	return (
		<div className="progress-container">
			<div
				className="progress-bar"
				style={
					{
						'--progress-width': `${value || 0}%`,
					} as React.CSSProperties
				}
				data-percentage={showPercentage ? `${value || 0}%` : undefined}
			/>
		</div>
	);
}

export { Progress };
