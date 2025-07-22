'use client';

import { FaHome, FaUserGraduate } from 'react-icons/fa';
import { HiAcademicCap } from 'react-icons/hi';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/estudiantes/ui/breadcrumb';

interface CourseBreadcrumbProps {
  title: string;
  programInfo?: {
    id: string;
    title: string;
  } | null;
}

export function CourseBreadcrumb({
  title,
  programInfo,
}: CourseBreadcrumbProps) {
  return (
    <Breadcrumb className="w-full overflow-x-auto pb-6 sm:mt-12">
      <BreadcrumbList className="flex w-full flex-nowrap items-center gap-1 whitespace-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink href="/">
            <FaHome className="mr-1 inline-block" /> Inicio
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {programInfo ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="/estudiantes">
                <FaUserGraduate className="mr-1 inline-block" /> Cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/estudiantes/programas/${programInfo.id}`}>
                <HiAcademicCap className="mr-1 inline-block" />
                <span
                  className="sm:truncate-none inline-block max-w-[70px] truncate align-middle sm:max-w-none"
                  title={programInfo.title}
                >
                  {programInfo.title}
                </span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="/estudiantes">
                <FaUserGraduate className="mr-1 inline-block" /> Cursos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>
            <span
              className="sm:truncate-none inline-block max-w-none truncate align-middle sm:max-w-[90px]"
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
