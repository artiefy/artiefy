'use client';

import { FaHome, FaUserGraduate } from 'react-icons/fa';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/estudiantes/ui/breadcrumb';

interface ProgramsBreadcrumbsProps {
  title: string;
}

export function ProgramsBreadcrumbs({ title }: ProgramsBreadcrumbsProps) {
  return (
    <Breadcrumb className="w-full overflow-x-auto pb-6">
      <BreadcrumbList className="flex w-full flex-nowrap items-center gap-1 whitespace-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">
            <FaHome className="mr-1 inline-block" /> Inicio
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/estudiantes">
            <FaUserGraduate className="mr-1 inline-block" /> Cursos
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            <span
              className="inline-block max-w-[120px] truncate align-middle"
              title={title}
            >
              {title}
            </span>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
