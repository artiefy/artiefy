'use client';
import { useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import { AspectRatio } from '@radix-ui/react-aspect-ratio';
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

import { Button } from '../educators/ui/button';

interface ForumsModels {
	id: number;
	title: string;
	description: string;
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
				<div
					key={forum.id}
					className="group relative overflow-hidden rounded-xl bg-[#0f0f0f] shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(0,189,216,0.25)]"
				>
					{/* Imagen de portada */}
					<div className="relative h-48 w-full">
						<Image
							src={
								forum.course.coverImageKey
									? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${forum.course.coverImageKey}`
									: '/login-fondo.webp'
							}
							alt={forum.title}
							fill
							className="object-cover"
						/>
						<div className="absolute inset-0 flex items-center justify-center bg-black/40">
							<h2 className="z-10 px-4 text-center text-xl font-semibold text-white">
								{forum.title}
							</h2>
						</div>
					</div>

					{/* Contenido debajo de la imagen */}
					<div className="space-y-2 p-4">
						<div className="flex flex-col gap-2 text-sm text-gray-300 sm:flex-row sm:justify-between">
							<div className="sm:w-1/2">
								<p className="text-primary text-xs">Curso:</p>
								<p className="font-medium">{forum.course.title}</p>
							</div>
							<div className="sm:w-1/2">
								<p className="text-primary text-xs">Instructor:</p>
								<p
									className="truncate font-medium sm:whitespace-normal"
									title={forum.instructor.name}
								>
									{forum.instructor.name}
								</p>
							</div>
						</div>

						<p className="mt-2 line-clamp-3 text-sm text-gray-400">
							{forum.description}
						</p>

						<div className="mt-4 flex items-center justify-between">
							<Link
								href={`/dashboard/admin/foro/${forum.id}`}
								className="bg-primary hover:bg-primary/80 rounded-md px-4 py-2 text-sm font-semibold text-white"
							>
								Ver foro
							</Link>
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
												Esto eliminará el foro <strong>{forum.title}</strong> y
												todo su contenido asociado.
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
					</div>
				</div>
			))}
		</div>
	);
};
