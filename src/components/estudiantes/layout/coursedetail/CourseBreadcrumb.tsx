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

interface CourseBreadcrumbProps {
	title: string;
}

export function CourseBreadcrumb({ title }: CourseBreadcrumbProps) {
	return (
		<Breadcrumb className="pb-6">
			<BreadcrumbList>
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
					<BreadcrumbPage>{title}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}
