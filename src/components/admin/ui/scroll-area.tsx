'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '~/lib/utils';

// Tipado para las propiedades de ScrollArea
type ScrollAreaProps = React.ComponentPropsWithoutRef<
    typeof ScrollAreaPrimitive.Root
>;

// Componente ScrollArea
const ScrollArea = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Root>,
    ScrollAreaProps
>(({ className, children, ...props }, ref) => {
    // Validar y asegurar que className sea un string seguro
    const safeClassName = className ? String(className) : '';

    return (
        <ScrollAreaPrimitive.Root
            ref={ref}
            className={cn('relative overflow-hidden', safeClassName)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit]">
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
});
ScrollArea.displayName = 'ScrollArea';

// Tipado para las propiedades de ScrollBar
type ScrollBarProps = React.ComponentPropsWithoutRef<
    typeof ScrollAreaPrimitive.ScrollAreaScrollbar
>;

// Componente ScrollBar
const ScrollBar = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
    ScrollBarProps
>(({ className, orientation = 'vertical', ...props }, ref) => {
    // Validar y asegurar que className sea un string seguro
    const safeClassName = className ? String(className) : '';

    return (
        <ScrollAreaPrimitive.ScrollAreaScrollbar
            ref={ref}
            orientation={'horizontal'} // Tipado seguro: 'horizontal' | 'vertical'
            className={cn(
                'flex touch-none select-none transition-colors',
                orientation === 'vertical' &&
                    'h-full w-2.5 border-l border-l-transparent p-[1px]',
                orientation === 'horizontal' &&
                    'h-2.5 border-t border-t-transparent p-[1px]',
                safeClassName
            )}
            {...props}
        >
            <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
    );
});
ScrollBar.displayName = 'ScrollBar';

// Exportar componentes
export { ScrollArea, ScrollBar };
