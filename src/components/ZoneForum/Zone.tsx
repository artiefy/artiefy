'use client';
import { useState, useEffect } from 'react';

import { useUser } from '@clerk/nextjs';
import { AspectRatio } from '@radix-ui/react-aspect-ratio';
import Image from 'next/image';
import Link from 'next/link';

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

//import { FaImage } from 'react-icons/fa';
import { Button } from '../educators/ui/button';

interface ForumsModels {
	id: number;
	courseId: {
		id: number;
		title: string;
		descripcion: string;
		instructor: string;
		coverImageKey: string;
	};
	title: string;
	description: string;
	userId: {
		id: string;
		name: string;
	};
	// change: {
	//   image: string;
	// };
}

export const Zone = () => {
	const { user } = useUser();
	const [forums, setForums] = useState<ForumsModels[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	// const [change, setChange] = useState<{ image: string }>({ image: '' });
	// const [localImageUrl, setLocalImageUrl] = useState(change.image);
	const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

	const handleImageLoad = (courseId: number) => {
		setLoadedImages((prev) => ({ ...prev, [courseId]: true }));
	};

	// useEffect(() => {
	//   setLocalImageUrl(change.image);
	// }, [change]);

	// const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	//   const files = e.target.files;
	//   if (files?.[0]) {
	//     const file = files[0];
	//     const imageUrl = URL.createObjectURL(file);
	//     setLocalImageUrl(imageUrl);
	//     setChange({ image: imageUrl });
	//   }
	// };

	useEffect(() => {
		const fetchLessons = async () => {
			if (!user) return null; // Si no hay usuario logueado, no se hace nada
			try {
				const response = await fetch(`/api/forums?userId=${user.id}`);
				if (!response.ok) {
					const errorData = (await response.json()) as { error?: string };
					throw new Error(errorData.error ?? 'Error al obtener las lecciones');
				}
				const data = (await response.json()) as ForumsModels[];
				setForums(data); // Setea las lecciones obtenidas
			} catch (error) {
				setError('Error al obtener los foros'); // Error general
				console.error('Error al obtener los foros:', error);
			} finally {
				setLoading(false);
			}
		};

		void fetchLessons();
	}, [user]); // Este efecto se ejecuta cada vez que el userId cambia

	if (loading) return <p>Cargando...</p>;
	if (forums.length === 0) {
		return (
			<div className="mt-10 flex h-auto items-center justify-center">
				<p className="text-2xl text-gray-600">
					No hay foros disponibles actualmente
				</p>
			</div>
		);
	} else if (error) return <p>{error}</p>;

	const handleDelete = async (id: number) => {
		try {
			const response = await fetch(`/api/forums?id=${id}`, {
				method: 'DELETE',
			});
			if (!response.ok) throw new Error('Error al eliminar el foro');
			toast.success('Foro eliminado', {
				description: 'El foro ha sido eliminado correctamente',
			});
			window.location.reload(); // Refrescar la página
		} catch (error) {
			console.error('Error:', error);
			toast.error('Error', {
				description: 'No se pudo eliminar el foro',
			});
		}
	};

	return (
		<ul className="grid grid-cols-1 gap-7 rounded-l shadow-md sm:grid-cols-2 lg:grid-cols-3">
			{forums.map((forum, index) => (
				<div key={index} className="group relative">
					<div className="animate-gradient absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-0 blur transition duration-500 group-hover:opacity-100"></div>
					<li className="relative z-20 mx-auto flex h-auto w-96 flex-col rounded-lg border border-slate-800 md:w-full lg:w-full">
						<div className="relative">
							<AspectRatio ratio={16 / 9}>
								<Image
									src={
										`
                  ${`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${forum.courseId.coverImageKey}`} ` ||
										'/login-fondo.webp'
									}
									alt={forum.title}
									onError={(e) => {
										(e.target as HTMLImageElement).src = '/login-fondo.webp';
									}}
									className={`rounded-t-lg bg-black object-cover transition-opacity duration-500 ${
										loadedImages[forum.id] ? 'opacity-100' : 'opacity-0'
									}`}
									fill
									placeholder="blur"
									blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciPjxzdG9wIHN0b3AtY29sb3I9IiNlZWUiIG9mZnNldD0iMjAlIi8+PHN0b3Agc3RvcC1jb2xvcj0iI2Y1ZjVmNSIgb2Zmc2V0PSI1MCUiLz48c3RvcCBzdG9wLWNvbG9yPSIjZWVlIiBvZmZzZXQ9IjcwJSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZWVlIi8+PHJlY3QgaWQ9InIiIHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI2cpIi8+PGFuaW1hdGUgeGxpbms6aHJlZj0iI3IiIGF0dHJpYnV0ZU5hbWU9IngiIGZyb209Ii02MDAiIHRvPSI2MDAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9zdmc+"
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
									onLoad={(_event) => handleImageLoad(forum.id)}
								/>
							</AspectRatio>
							<div className="absolute inset-0 flex items-center justify-center">
								<h2 className="absolute text-2xl font-bold text-white">
									{forum.title}
								</h2>
							</div>
							{/* <label className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-white p-2 hover:bg-gray-100">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <FaImage className="text-gray-600" />
            </label> */}
						</div>
						<div className="grid grid-cols-2 bg-background p-5">
							<div className="flex flex-col justify-center text-center">
								<p>Del curso:</p>
								<p className="mt-2 text-white"> {forum.courseId.title}</p>
							</div>
							<div className="flex flex-col justify-center text-center">
								<p>Del docente:</p>
								<p className="mt-2 text-white"> {forum.courseId.instructor}</p>
							</div>
						</div>
						<div className="h-auto rounded-b-lg bg-white p-6">
							<p className="mb-4 text-gray-600">{forum.description}</p>
							<div className="flex justify-between">
								<Link
									className="mx-auto rounded-md bg-primary px-4 py-2 text-white"
									href={`/dashboard/educadores/foro/${forum.id}`}
								>
									Ingresar al foro
								</Link>
								{forum.userId.id === user?.id && (
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button className="border-red-600 bg-red-600 text-white hover:border-red-600 hover:bg-white hover:text-red-600">
												Eliminar
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
												<AlertDialogDescription>
													Esta acción no se puede deshacer. Se eliminará
													permanentemente el curso
													<span className="font-bold"> {forum.title}</span> y
													todos los datos asociados a este.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancelar</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => handleDelete(forum.id)}
													className="border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-transparent hover:text-red-700"
												>
													Eliminar
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								)}
							</div>
						</div>
					</li>
				</div>
			))}
		</ul>
	);
};
