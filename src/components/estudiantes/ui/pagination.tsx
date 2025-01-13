<<<<<<< HEAD:src/components/ui/pagination.tsx
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "~/lib/utils"
import type { ButtonProps } from "~/components/ui/button"
import { buttonVariants } from "~/components/ui/button"
=======
import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import {
  type ButtonProps,
  buttonVariants,
} from '~/components/estudiantes/ui/button';
import { cn } from '~/lib/utils';
>>>>>>> develop:src/components/estudiantes/ui/pagination.tsx

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
<<<<<<< HEAD:src/components/ui/pagination.tsx
)
Pagination.displayName = "Pagination"
=======
);
Pagination.displayName = 'Pagination';
>>>>>>> develop:src/components/estudiantes/ui/pagination.tsx

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
<<<<<<< HEAD:src/components/ui/pagination.tsx
))
PaginationContent.displayName = "PaginationContent"
=======
));
PaginationContent.displayName = 'PaginationContent';
>>>>>>> develop:src/components/estudiantes/ui/pagination.tsx

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
<<<<<<< HEAD:src/components/ui/pagination.tsx
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">
=======
  <li ref={ref} className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'a'>;
>>>>>>> develop:src/components/estudiantes/ui/pagination.tsx

const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? 'outline' : 'ghost',
        size,
      }),
      className
    )}
    {...props}
  />
<<<<<<< HEAD:src/components/ui/pagination.tsx
)
PaginationLink.displayName = "PaginationLink"
=======
);
PaginationLink.displayName = 'PaginationLink';
>>>>>>> develop:src/components/estudiantes/ui/pagination.tsx

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  >
<<<<<<< HEAD:src/components/ui/pagination.tsx
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"
=======
    <ChevronLeft className="size-4" />
    <span>Anterior</span>
  </PaginationLink>
);
PaginationPrevious.displayName = 'PaginationPrevious';
>>>>>>> develop:src/components/estudiantes/ui/pagination.tsx

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn('gap-1 pr-2.5', className)}
    {...props}
  >
<<<<<<< HEAD:src/components/ui/pagination.tsx
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"
=======
    <span>Siguiente</span>
    <ChevronRight className="size-4" />
  </PaginationLink>
);
PaginationNext.displayName = 'PaginationNext';
>>>>>>> develop:src/components/estudiantes/ui/pagination.tsx

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="size-4" />
    <span className="sr-only">More pages</span>
  </span>
<<<<<<< HEAD:src/components/ui/pagination.tsx
)
PaginationEllipsis.displayName = "PaginationEllipsis"
=======
);
PaginationEllipsis.displayName = 'PaginationEllipsis';
>>>>>>> develop:src/components/estudiantes/ui/pagination.tsx

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
