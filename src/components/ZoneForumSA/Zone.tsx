'use client';
import { useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '~/components/educators/ui/alert-dialog';
import { AspectRatio } from '~/components/educators/ui/aspect-ratio';
import {
	Card,
	CardHeader,
	CardContent,
	CardFooter,
} from '~/components/educators/ui/card';
import { Button } from '~/components/estudiantes/ui/button';

interface ForumsModels {
	id: number;
	title: string;
	description: string;
	coverImageKey: string;
	documentKey: string;
	course: {
		id: number;
		title: string;
		descripcion: string;
		coverImageKey: string;
	};
	instructor: {
		id: string;
		name: string;
	};
	user: {
		id: string;
		name: string;
	};
}

export const Zone = () => {
	const { user } = useUser();
	const [forums, setForums] = useState<ForumsModels[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchForums = async () => {
			if (!user) return;
			try {
				const res = await fetch(`/api/forums?userId=${user.id}`);
				if (!res.ok) throw new Error('Error al obtener los foros');
				const data = (await res.json()) as ForumsModels[];
				setForums(data);
			} catch (err) {
				setError('No se pudieron cargar los foros');
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		void fetchForums();
	}, [user]);

	const handleDelete = async (id: number) => {
		try {
			const res = await fetch(`/api/forums?id=${id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error();
			toast.success('Foro eliminado correctamente');
			window.location.reload();
		} catch {
			toast.error('No se pudo eliminar el foro');
		}
	};

	if (loading) return <p className="text-gray-400">Cargando foros...</p>;
	if (error) return <p className="text-red-500">{error}</p>;
	if (!forums.length) {
		return (
			<div className="mt-10 flex h-auto items-center justify-center">
				<p className="text-2xl text-gray-500">No hay foros disponibles.</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
			{forums.map((forum) => (
				<div key={forum.id} className="group relative">
					<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100" />

					<Card className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border-0 bg-[#0f0f0f] px-2 pt-2 text-white transition-transform duration-300 ease-in-out group-hover:scale-[1.02]">
						{/* Imagen de portada */}
						<CardHeader className="px-0 pt-0">
							<AspectRatio ratio={16 / 9}>
								<div className="relative size-full">
									<Image
										src={
											forum.course.coverImageKey
												? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${forum.course.coverImageKey}`
												: '/login-fondo.webp'
										}
										alt={forum.title}
										className="object-cover transition-transform duration-300 hover:scale-105"
										fill
									/>
									<div className="absolute inset-0 flex items-center justify-center bg-black/40">
										<h2 className="z-10 px-4 text-center text-xl font-semibold text-white">
											{forum.title}
										</h2>
									</div>
								</div>
							</AspectRatio>
						</CardHeader>

						{/* Contenido del foro */}
						<CardContent className="flex grow flex-col justify-between space-y-3 px-2 pb-2">
							<div className="flex flex-wrap items-start justify-between gap-2 text-sm text-gray-300">
								<div className="w-full sm:w-1/2">
									<p className="text-primary text-xs">Curso:</p>
									<p className="font-medium">{forum.course.title}</p>
								</div>
								<div className="w-full sm:w-1/2">
									<p className="text-primary text-xs">Instructor:</p>
									<p
										className="truncate font-medium sm:whitespace-normal"
										title={forum.instructor?.name ?? 'Sin nombre'}
									>
										{forum.instructor?.name ?? 'Sin nombre'}
									</p>
								</div>
							</div>

							<p className="line-clamp-3 text-sm text-gray-400">
								{forum.description}
							</p>
						</CardContent>

						{/* Footer con acciones */}
						<CardFooter className="flex flex-col items-start justify-between space-y-2 px-2 pb-3">
							<div className="flex w-full items-center justify-between">
								<Button asChild>
									<Link
										href={`/dashboard/super-admin/foro/${forum.id}`}
										className="group/button bg-background text-primary relative inline-flex items-center justify-center overflow-hidden rounded-md border border-white/20 px-3 py-2 text-sm font-semibold active:scale-95"
									>
										<p className="font-bold">Ver foro</p>
										<div className="absolute inset-0 flex w-full [transform:skew(-13deg)_translateX(-100%)] justify-center group-hover/button:[transform:skew(-13deg)_translateX(100%)] group-hover/button:duration-1000">
											<div className="relative h-full w-10 bg-white/30" />
										</div>
									</Link>
								</Button>

								{forum.user.id === user?.id && (
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												variant="ghost"
												className="text-sm text-red-600 hover:bg-red-600/10"
											>
												Eliminar
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
												<AlertDialogDescription>
													Esto eliminará el foro <strong>{forum.title}</strong>{' '}
													y todo su contenido asociado.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancelar</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => handleDelete(forum.id)}
													className="bg-red-600 text-white hover:bg-red-700"
												>
													Eliminar
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								)}
							</div>
						</CardFooter>
					</Card>
				</div>
			))}
		</div>
	);
};
