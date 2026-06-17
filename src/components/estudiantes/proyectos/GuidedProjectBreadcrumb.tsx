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

interface GuidedProjectBreadcrumbProps {
  title: string;
}

export function GuidedProjectBreadcrumb({
  title,
}: GuidedProjectBreadcrumbProps) {
  return (
    <div
      className="
        relative z-20 hidden w-full backdrop-blur-sm
        md:block md:bg-transparent md:backdrop-blur-none
      "
    >
      <Breadcrumb
        className="
          w-full overflow-x-auto py-2
          md:pt-0
        "
      >
        <BreadcrumbList
          className="
            flex w-full flex-nowrap items-center gap-1 px-4 whitespace-nowrap
            md:px-0
          "
        >
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <FaHome className="mr-1 inline-block" /> Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/estudiantes">
              <FaUserGraduate className="mr-1 inline-block" /> Estudiantes
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <span
                className="
                  sm:truncate-none
                  inline-block max-w-none truncate align-middle
                  sm:max-w-none
                "
                title={title}
              >
                {title}
              </span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
