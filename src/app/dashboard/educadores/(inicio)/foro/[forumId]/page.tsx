'use client';
import { useCallback, useEffect, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';

interface Foro {
	id: number;
	title: string;
	description: string;
	userId: {
		id: string;
		name: string;
	};
	courseId: {
		id: number;
		title: string;
		descripcion: string;
		instructor: string;
	};
}

interface Post {
	id: number;
	userId: {
		id: string;
		name: string;
	};
	content: string;
	foroId: number;
	createdAt: string;
}

const ForumPage = () => {
	const params = useParams();
	const forumId = params?.forumId;
	const { user } = useUser();
	const [forumData, setForumData] = useState<Foro | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [message, setMessage] = useState('');
	const [posts, setPosts] = useState<Post[]>([]);
	const [loadingPosts, setLoadingPosts] = useState(false);

	const ForumIdString = Array.isArray(forumId) ? forumId[0] : forumId;
	const ForumIdNumber = ForumIdString ? parseInt(ForumIdString) : null;
	console.log('courseIdUrl:', ForumIdNumber);

	const fetchPosts = useCallback(async () => {
		setLoadingPosts(true);
		try {
			const responsePosts = await fetch(
				`/api/forums/posts?foroId=${ForumIdNumber}`
			);
			if (responsePosts.ok) {
				const data = (await responsePosts.json()) as Post[];
				console.log(`Respuesta correcta`);
				setPosts(data);
			} else {
				console.error('Error al traer los posts');
			}
		} catch (e) {
			console.error(`Error de tipo ${(e as Error).message}`);
		} finally {
			setLoadingPosts(false);
		}
	}, [ForumIdNumber]);

	useEffect(() => {
		fetchPosts().catch((error) =>
			console.error('Error fetching posts:', error)
		);
	}, [fetchPosts]);

	const fetchForum = useCallback(async () => {
		if (!ForumIdNumber) return;
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(`/api/forums/${ForumIdNumber}`);
			if (response.ok) {
				const data = (await response.json()) as Foro;
				console.log(data);
				setForumData(data);
			} else {
				setError('Error al traer el foro');
				console.error(`Error al traer el foro`);
			}
		} catch (e) {
			setError((e as Error).message);
			console.error(`Error type: ${(e as Error).message}`);
		} finally {
			setLoading(false);
		}
	}, [ForumIdNumber]);

	useEffect(() => {
		fetchForum().catch((error) => console.error('Error fetching Foro:', error));
	}, [fetchForum]);

	const handleSubmit = async () => {
		if (!message.trim() || !user) return;

		try {
			const response = await fetch('/api/forums/posts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content: message,
					foroId: ForumIdNumber,
					userId: user.fullName,
				}),
			});

			if (response.ok) {
				setMessage('');
				await fetchPosts();
			} else {
				console.error('Error al enviar el mensaje');
			}
		} catch (error) {
			console.error('Error al enviar el mensaje:', error);
		}
	};

	if (loading) return <div>Cargando Foro...</div>;
	if (error) return <div>Error: {error}</div>;
	return (
		<>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink className="hover:text-gray-300" href="/">
							Inicio
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="hover:text-gray-300"
							href="/dashboard/educadores/foro"
						>
							Foros
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="hover:text-gray-300"
							href="/dashboard/educadores/foro"
						>
							Foro: {forumData?.title}
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<div className="container mx-auto mt-5">
				<div className="mx-auto w-full rounded-lg bg-slate-500/20 p-5 shadow-lg md:w-11/12 lg:w-full">
					<div className="flex justify-between">
						<h1 className="mb-4 text-2xl font-bold text-white">
							{forumData?.title}
						</h1>
						<p className="text-white">
							Del instructor: {forumData?.userId.name}
						</p>{' '}
						{/* Asegúrate de acceder al nombre del usuario */}
					</div>
					<p className="mb-4 text-gray-300">
						Description: {forumData?.description}
					</p>
					<h2 className="text-xl font-semibold text-white">Mensajes</h2>
					<div className="mb-4 flex flex-col-reverse rounded-lg bg-gray-700 p-4">
						{/* Aquí puedes mapear los mensajes del foro */}
						{loadingPosts ? (
							<div className="mt-2 rounded-lg bg-gray-600 p-3">
								<p className="text-gray-200">Cargando mensajes...</p>
							</div>
						) : posts.length === 0 ? (
							<div className="mt-2 rounded-lg bg-gray-600 p-3">
								<p className="text-gray-200">No hay mensajes todavía</p>
							</div>
						) : (
							posts.map((post, index) => (
								<div className="mt-2 rounded-lg bg-gray-600 p-3" key={index}>
									<p className="font-bold text-gray-200">
										{post.userId.name}, dijo:
									</p>
									<p className="text-justify text-gray-200">{post.content}</p>
									<p className="mt-4 text-xs text-gray-400">
										Creado en: {post.createdAt}
									</p>
								</div>
							))
						)}
					</div>
					<div className="flex flex-col">
						<textarea
							className="mb-2 rounded-lg bg-gray-900 p-3 text-white outline-hidden"
							placeholder="Ingresa tu mensaje"
							rows={3}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
						/>
						<button
							className="rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600"
							onClick={handleSubmit}
						>
							Enviar
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default ForumPage;
