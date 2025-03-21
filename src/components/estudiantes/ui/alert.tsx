import * as React from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '~/lib/utils';

const alertVariants = cva(
	'relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
	{
		variants: {
			variant: {
				default: 'bg-background text-foreground',
				destructive:
					'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive text-destructive',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

function Alert({
	className,
	variant,
	...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
	return (
		<div
			role="alert"
			className={cn(alertVariants({ variant }), className)}
			{...props}
		/>
	);
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
	return (
		<h5
			className={cn('mb-2 leading-none font-medium tracking-tight', className)}
			{...props}
		/>
	);
}

function AlertDescription({
	className,
	...props
}: React.ComponentProps<'div'>) {
	return (
		<div
			className={cn('text-sm [&_p]:leading-relaxed', className)}
			{...props}
		/>
	);
}

export { Alert, AlertTitle, AlertDescription };
