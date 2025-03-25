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
		<Breadcrumb className="pb-6">
			<BreadcrumbList>
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
								{programInfo.title}
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
					<BreadcrumbPage>{title}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}
