'use client';
import { useState, useEffect } from 'react';

import { useUser } from '@clerk/nextjs';
import { FaSearch, FaPlus } from 'react-icons/fa';
import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '~/components/educators/ui/dialog';
import { Input } from '~/components/educators/ui/input';
import { Progress } from '~/components/educators/ui/progress';
import { Zone } from '~/components/ZoneForum/Zone';

interface CoursesModels {
	id: number;
	title: string;
	description: string;
	coverImageKey: string;
}

const ForumHome = () => {
	const { user } = useUser();
	const [searchQuery, setSearchQuery] = useState('');
	const [courseId, setCourseId] = useState<number | ''>('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [courses, setCourses] = useState<CoursesModels[]>([]);
	const [loadingCourses, setLoadingCourses] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const handleCreateForum = async () => {
		if (!user) return;
		setIsUploading(true);
		const userId = user.id;

		try {
			const response = await fetch('/api/forums', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ courseId, title, description, userId }),
			});
			setUploadProgress(100);
			await response.json();

			toast.success('Foro creado exitosamente!');
			setIsDialogOpen(false);
			window.location.reload();
		} catch (error) {
			console.error('Error al crear el foro:', error);
		} finally {
			setIsUploading(false);
			setCourseId('');
			setTitle('');
			setDescription('');
		}
	};

	useEffect(() => {
		const fetchCourses = async () => {
			if (!user) return;
			try {
				setLoadingCourses(true);
				const response = await fetch(
					`/api/educadores/courses?userId=${user.id}`
				);
				if (!response.ok) throw new Error('Error al obtener los cursos');
				const data: CoursesModels[] = await response.json();
				setCourses(data);
			} catch (error) {
				console.error('Error al obtener los cursos:', error);
			} finally {
				setLoadingCourses(false);
			}
		};
		void fetchCourses();
	}, [user]);

	return (
		<div className="bg-background min-h-screen px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl space-y-8">
				<header className="flex flex-col items-center justify-between gap-4 sm:flex-row">
					<h1 className="text-primary text-3xl font-bold">
						Zona de Foros Artiefy
					</h1>
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button
								className="bg-primary hover:bg-primary/90 flex items-center gap-2 text-black"
								onClick={() => setIsDialogOpen(true)}
							>
								<FaPlus />
								Nuevo Foro
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Crear Nuevo Foro</DialogTitle>
								<DialogDescription>
									Completa los campos para iniciar una discusión.
								</DialogDescription>
							</DialogHeader>

							<div className="mt-4 flex flex-col gap-4">
								<label className="text-primary text-sm font-medium">
									Curso asociado
								</label>
								{loadingCourses ? (
									<p className="text-sm text-gray-400">Cargando cursos...</p>
								) : (
									<select
										value={courseId}
										onChange={(e) => setCourseId(Number(e.target.value))}
										className="bg-background rounded border border-white p-2 text-gray-300"
									>
										<option value="">Selecciona un curso</option>
										{courses.map((c) => (
											<option key={c.id} value={c.id}>
												{c.title}
											</option>
										))}
									</select>
								)}

								<Input
									type="text"
									placeholder="Título del foro"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="text-gray-300"
								/>
								<Input
									type="text"
									placeholder="Descripción"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="text-gray-300"
								/>

								<div className="border-primary text-primary rounded border p-2 text-sm">
									Instructor: {user?.fullName}
								</div>
							</div>

							{isUploading && (
								<div className="mt-4">
									<Progress value={uploadProgress} className="w-full" />
									<p className="mt-2 text-center text-xs text-gray-400">
										{uploadProgress}% completado
									</p>
								</div>
							)}

							<DialogFooter>
								<Button
									variant="outline"
									className="border-primary text-primary border hover:bg-gray-700/10"
									onClick={() => {
										setCourseId('');
										setTitle('');
										setDescription('');
										setIsDialogOpen(false);
									}}
								>
									Cancelar
								</Button>
								<Button
									onClick={handleCreateForum}
									className="bg-green-500 text-white hover:bg-green-600"
								>
									Crear Foro
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</header>

				<div className="relative w-full">
					<Input
						type="text"
						placeholder="Buscar una discusión..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="bg-background focus:ring-primary w-full rounded-lg border border-gray-700 py-2 pr-4 pl-10 text-white placeholder:text-gray-400 focus:ring-2 focus:outline-none"
					/>
					<FaSearch className="absolute top-2.5 left-3 text-gray-400" />
				</div>

				<Zone />
			</div>
		</div>
	);
};

export default ForumHome;
