'use client';

import {
	Users,
	BookOpen,
	MessageSquare,
	HelpCircle,
	Award,
	BarChart,
	FileText,
	GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/app/dashboard/super-admin/components/button';
import ResponsiveSidebar from '~/app/dashboard/super-admin/components/ResponsiveSidebar';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/super-admin/ui/card';

export default function Home() {
	const stats = [
		{
			title: 'Total Estudiantes',
			value: '1,234',
			icon: Users,
			href: './app/estudiantes',
		},
		{
			title: 'Cursos Activos',
			value: '56',
			icon: BookOpen,
			href: './app/cursos',
		},
		{
			title: 'Foros Activos',
			value: '23',
			icon: MessageSquare,
			href: './app/foros',
		},
		{
			title: 'Tickets de Soporte',
			value: '15',
			icon: HelpCircle,
			href: './app/soporte',
		},
		{
			title: 'Insignias Otorgadas',
			value: '789',
			icon: Award,
			href: './app/gamificacion',
		},
		{
			title: 'Tasa de Finalización',
			value: '78%',
			icon: BarChart,
			href: './app/analisis',
		},
		{
			title: 'Total Recursos',
			value: '345',
			icon: FileText,
			href: './app/recursos',
		},
		{
			title: 'Tutores Activos',
			value: '42',
			icon: GraduationCap,
			href: './app/tutores',
		},
	];

	const quickAccess = [
		{ title: 'Gestionar Cursos', href: './app/cursos' },
		{ title: 'Ver Estudiantes', href: './app/estudiantes' },
		{ title: 'Moderar Foros', href: './app/foros' },
		{ title: 'Atender Soporte', href: './app/soporte' },
		{ title: 'Gestionar Gamificación', href: './app/gamificacion' },
		{ title: 'Ver Análisis', href: './app/analisis' },
		{ title: 'Administrar Recursos', href: './app/recursos' },
		{ title: 'Gestionar Tutores', href: './app/tutores' },
	];

	return (
		<ResponsiveSidebar>
			<div className="container mx-auto px-4 py-8">
				<h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
					Dashboard Educativo
				</h2>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
					{stats.map((stat) => (
						<Card className="bg-white" key={stat.title}>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									{stat.title}
								</CardTitle>
								<stat.icon className="text-muted-foreground size-4" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{stat.value}</div>
								<Link href={stat.href} passHref>
									<Button variant="link" className="p-0 text-black">
										Ver detalles
									</Button>
								</Link>
							</CardContent>
						</Card>
					))}
				</div>

				<h3 className="mt-8 mb-4 text-xl font-semibold text-white">
					Accesos Rápidos
				</h3>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{quickAccess.map((item) => (
						<Link
							className="border-primary text-primary hover:bg-primary rounded-lg border p-2 hover:text-black"
							key={item.title}
							href={item.href}
							passHref
						>
							{item.title}
						</Link>
					))}
				</div>

				<Card className="mt-8">
					<CardHeader>
						<CardTitle>Actividad Reciente</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							<li>
								Nuevo curso añadido: &quot;Introducción a la Inteligencia
								Artificial&quot;
							</li>
							<li>5 nuevos estudiantes registrados en las últimas 24 horas</li>
							<li>Foro &quot;Discusión General&quot; alcanzó 1000 mensajes</li>
							<li>Se resolvieron 10 tickets de soporte hoy</li>
							<li>Nueva insignia creada: &quot;Maestro del Código&quot;</li>
							<li>
								Se añadieron 3 nuevos recursos al curso de &quot;Desarrollo Web
								Avanzado&quot;
							</li>
							<li>2 nuevos tutores se unieron a la plataforma</li>
						</ul>
					</CardContent>
				</Card>
			</div>
		</ResponsiveSidebar>
	);
}
