'use client';

import {
	Users,
	BookOpen,
	MessageSquare,
	HelpCircle,
	GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/components/admin/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';

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
		{ title: 'Gestionar Tutores', href: './app/tutores' },
	];

	return (
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
							<stat.icon className="size-4 text-muted-foreground" />
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

			<h3 className="mb-4 mt-8 text-xl font-semibold text-white">
				Accesos Rápidos
			</h3>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
				{quickAccess.map((item) => (
					<Link
						className="rounded-lg border border-primary p-2 text-primary hover:bg-primary hover:text-black"
						key={item.title}
						href={item.href}
						passHref
					>
						{item.title}
					</Link>
				))}
			</div>
		</div>
	);
}
