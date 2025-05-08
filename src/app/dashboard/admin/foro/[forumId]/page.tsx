'use client';
import { useCallback, useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { useUser } from '@clerk/nextjs';
import { EllipsisVertical } from 'lucide-react';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/educators/ui/breadcrumb';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '~/components/educators/ui/collapsible';

// Interfaces del foro
interface Foro {
	id: number;
	title: string;
	description: string;
	userId: {
		id: string;
		name: string;
		email: string;
	};
	courseId: {
		id: number;
		title: string;
		descripcion: string;
		instructor: string;
	};
}

// Interfaces de los posts
interface Post {
	id: number;
	userId: {
		id: string;
		name: string;
		email: string;
	};
	content: string;
	foroId: number;
	createdAt: string;
	updatedAt: string;
}

// Interfaces de las respuestas a los posts
interface PostReplay {
	id: number;
	userId: {
		id: string;
		name: string;
		email: string;
	};
	postId: number;
	content: string;
	createdAt: string;
	updatedAt: string;
}

// Función para formatear la fecha
const formatDate = (dateString: string | number | Date) => {
	const date = new Date(dateString);
	return isNaN(date.getTime())
		? 'Fecha inválida'
		: date.toISOString().split('T')[0];
};

const ForumPage = () => {
	const params = useParams();
	const forumId = params?.forumId;
	const { user } = useUser(); // Obtener el usuario actual
	const [forumData, setForumData] = useState<Foro | null>(null); // Estado del foro
	const [loading, setLoading] = useState(true); // Estado de carga
	const [posts, setPosts] = useState<Post[]>([]); // Estado de los posts
	const [postReplays, setPostReplays] = useState<PostReplay[]>([]); // Estado de las respuestas de los posts
	const [message, setMessage] = useState(''); // Estado del mensaje
	const [replyMessage, setReplyMessage] = useState(''); // Estado de la respuesta
	const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null); // Estado de la respuesta
	const [loadingPosts, setLoadingPosts] = useState(false); // Estado de carga de los posts
	const [editingPostId, setEditingPostId] = useState<number | null>(null); // Estado de edición del post
	const [editingReplyId, setEditingReplyId] = useState<number | null>(null); // Estado de edición de la respuesta
	const [editPostContent, setEditPostContent] = useState<string>(''); // Estado de edición del post
	const [editReplyContent, setEditReplyContent] = useState<string>(''); // Estado de edición de la respuesta
	// const [error, setError] = useState(false);
	const ForumIdString = Array.isArray(forumId) ? forumId[0] : forumId;
	const ForumIdNumber = ForumIdString ? parseInt(ForumIdString) : null;

	// Fetch del foro
	const fetchForum = useCallback(async () => {
		setLoading(true);
		try {
			const responseForum = await fetch(`/api/forums/${ForumIdNumber}`);
			if (responseForum.ok) {
				const data = (await responseForum.json()) as Foro;
				setForumData(data);
			} else {
				console.error('Error al traer el foro');
			}
		} catch (e) {
			console.error('Error al obtener el foro:', e);
		} finally {
			setLoading(false);
		}
	}, [ForumIdNumber]);

	// Fetch de los posts principales
	const fetchPosts = useCallback(async () => {
		setLoadingPosts(true);
		//setError(true)
		try {
			const responsePosts = await fetch(
				`/api/forums/posts?foroId=${ForumIdNumber}`
			);
			if (responsePosts.ok) {
				const data = (await responsePosts.json()) as Post[];
				setPosts(data);
			} else {
				console.error('Error al traer los posts');
			}
		} catch (e) {
			console.error('Error al obtener los posts:', e);
		} finally {
			setLoadingPosts(false);
		}
	}, [ForumIdNumber]);

	// Fetch de las respuestas (PostReplies)
	const fetchPostReplays = useCallback(async () => {
		try {
			const postIds = posts.map((post) => post.id).join(',');
			if (postIds) {
				const responsePostReplays = await fetch(
					`/api/forums/posts/postReplay?postIds=${postIds}`
				);
				if (responsePostReplays.ok) {
					const data = (await responsePostReplays.json()) as PostReplay[];
					setPostReplays(data);
				} else {
					console.error('Error al traer las respuestas');
				}
			}
		} catch (e) {
			console.error('Error al obtener las respuestas:', e);
		}
	}, [posts]);

	// Fetch de los foro y las posts
	useEffect(() => {
		fetchPosts().catch((error) =>
			console.error('Error fetching posts:', error)
		);
		fetchForum().catch((error) =>
			console.error('Error fetching forum:', error)
		);
	}, [fetchPosts, fetchForum]);

	// Fetch de las respuestas después de obtener los posts
	useEffect(() => {
		if (posts.length > 0) {
			fetchPostReplays().catch((error) =>
				console.error('Error fetching post replies:', error)
			);
		}
	}, [fetchPostReplays, posts]);

	const handlePostSubmit = async () => {
		if (!message.trim() || !user) return;
		try {
			const response = await fetch('/api/forums/posts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: message,
					foroId: ForumIdNumber,
					userId: user.id,
					userName: user.fullName,
					userEmail: user.emailAddresses[0]?.emailAddress,
				}),
			});

			if (response.ok) {
				setMessage('');
				await fetchPosts();

				const role = user.publicMetadata?.role;
				const userEmail = user.emailAddresses[0]?.emailAddress;
				const uniqueEmails = new Set<string>();

				if (role === 'educador') {
					// Notificar estudiantes (todos los que participaron)
					posts.forEach((post) => {
						if (post.userId.email && post.userId.email !== userEmail) {
							uniqueEmails.add(post.userId.email);
						}
					});
					postReplays.forEach((reply) => {
						if (reply.userId.email && reply.userId.email !== userEmail) {
							uniqueEmails.add(reply.userId.email);
						}
					});
				} else {
					// Notificar al instructor
					if (forumData?.userId.email && forumData.userId.email !== userEmail) {
						uniqueEmails.add(forumData.userId.email);
					}
				}
			}
		} catch (error) {
			console.error('Error al enviar el post:', error);
		}
	};

	const handleReplySubmit = async () => {
		if (!replyMessage.trim() || !user || replyingToPostId === null) return;

		try {
			const response = await fetch('/api/forums/posts/postReplay', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: replyMessage,
					postId: replyingToPostId,
					userId: user.fullName,
				}),
			});

			if (response.ok) {
				setReplyMessage('');
				setReplyingToPostId(null);
				await fetchPostReplays();

				const role = user.publicMetadata?.role;
				const userEmail = user.emailAddresses[0]?.emailAddress;
				const uniqueEmails = new Set<string>();

				const originalPost = posts.find((p) => p.id === replyingToPostId);

				if (role === 'educador') {
					// Notificar a estudiantes que comentaron en este hilo
					if (
						originalPost?.userId.email &&
						originalPost.userId.email !== userEmail
					) {
						uniqueEmails.add(originalPost.userId.email);
					}
					postReplays
						.filter((r) => r.postId === replyingToPostId)
						.forEach((reply) => {
							if (reply.userId.email && reply.userId.email !== userEmail) {
								uniqueEmails.add(reply.userId.email);
							}
						});
				} else {
					// Notificar al instructor
					if (forumData?.userId.email && forumData.userId.email !== userEmail) {
						uniqueEmails.add(forumData.userId.email);
					}
				}

				if (uniqueEmails.size > 0) {
					await sendForumEmail(replyMessage, Array.from(uniqueEmails));
				}
			}
		} catch (error) {
			console.error('Error al enviar la respuesta:', error);
		}
	};

	// Eliminar un post
	const handleDeletePost = async (postId: number) => {
		try {
			const response = await fetch(`/api/forums/posts?postId=${postId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				await fetchPosts(); // Refrescar lista de posts
			} else {
				console.error('Error al eliminar el post');
			}
		} catch (error) {
			console.error('Error al eliminar el post:', error);
		}
	};

	// Eliminar una respuesta
	const handleDeleteReply = async (replyId: number) => {
		try {
			const response = await fetch(
				`/api/forums/posts/postReplay?replyId=${replyId}`,
				{
					method: 'DELETE',
				}
			);

			if (response.ok) {
				await fetchPostReplays(); // Refrescar respuestas
			} else {
				console.error('Error al eliminar la respuesta');
			}
		} catch (error) {
			console.error('Error al eliminar la respuesta:', error);
		}
	};

	// Actualizar Post
	const handlePostUpdate = async (postId: number) => {
		if (!editPostContent.trim()) return;
		try {
			const response = await fetch(`/api/forums/posts/${postId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content: editPostContent,
				}),
			});

			if (response.ok) {
				setEditingPostId(null);
				setEditPostContent('');
				await fetchPosts(); // Refrescar lista de posts
			} else {
				console.error('Error al actualizar el post');
			}
		} catch (error) {
			console.error('Error al actualizar el post:', error);
		}
	};

	// Actualizar Respuesta
	const handleReplyUpdate = async (replyId: number) => {
		if (!editReplyContent.trim()) return;
		try {
			const response = await fetch(`/api/forums/posts/postReplay/${replyId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content: editReplyContent,
				}),
			});

			if (response.ok) {
				setEditingReplyId(null);
				setEditReplyContent('');
				await fetchPostReplays(); // Refrescar respuestas
			} else {
				console.error('Error al actualizar la respuesta');
			}
		} catch (error) {
			console.error('Error al actualizar la respuesta:', error);
		}
	};

	// Renderizar respuestas de un post
	const renderPostReplies = (postId: number) => {
		const replies = postReplays.filter((reply) => reply.postId === postId);

		return replies.map((reply) => (
			<div
				key={reply.id}
				className="relative mt-3 ml-8 rounded-lg bg-gray-900 p-4 shadow-lg"
			>
				<div className="mb-2 flex items-center justify-between">
					<span className="text-sm font-semibold text-gray-200">
						{reply.userId.name}
					</span>
					<span className="text-xs text-gray-500">
						{formatDate(reply.createdAt)}
					</span>
				</div>

				{editingReplyId === reply.id ? (
					<div>
						<textarea
							className="w-full rounded border border-gray-700 bg-gray-800 p-3 text-white"
							value={editReplyContent}
							onChange={(e) => setEditReplyContent(e.target.value)}
						/>
						<div className="mt-2 flex justify-end gap-2">
							<button
								className="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
								onClick={() => handleReplyUpdate(reply.id)}
							>
								Actualizar
							</button>
							<button
								className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
								onClick={() => setEditingReplyId(null)}
							>
								Cancelar
							</button>
						</div>
					</div>
				) : (
					<p className="text-sm text-gray-300">{reply.content}</p>
				)}

				{/* Menú desplegable editar/eliminar respuesta */}
				{reply.userId.id === user?.id && (
					<Collapsible className="absolute top-2 right-2">
						<CollapsibleTrigger>
							<EllipsisVertical className="cursor-pointer text-gray-500 hover:text-white" />
						</CollapsibleTrigger>
						<CollapsibleContent className="absolute right-0 mt-1 flex flex-col rounded border border-gray-700 bg-gray-800 shadow-lg">
							<button
								className="px-4 py-2 text-left text-sm text-green-400 hover:bg-gray-700"
								onClick={() => {
									setEditingReplyId(reply.id);
									setEditReplyContent(reply.content);
								}}
							>
								Editar
							</button>
							<button
								className="px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
								onClick={() => handleDeleteReply(reply.id)}
							>
								Eliminar
							</button>
						</CollapsibleContent>
					</Collapsible>
				)}
			</div>
		));
	};

	// Renderizar el spinner de carga
	if (loading) {
		return (
			<main className="flex h-screen flex-col items-center justify-center">
				<div className="border-primary size-32 animate-spin rounded-full border-y-2">
					<span className="sr-only" />
				</div>
				<span className="text-primary">Cargando...</span>
			</main>
		);
	}

	const getEmailRecipients = (
		role: string,
		userEmail: string,
		forumData: Foro,
		posts: Post[],
		postReplays: PostReplay[],
		originalPost?: Post
	): string[] => {
		const emails = new Set<string>();

		if (role === 'educador') {
			posts.forEach((p) => {
				if (p.userId.email && p.userId.email !== userEmail)
					emails.add(p.userId.email);
			});
			postReplays.forEach((r) => {
				if (r.userId.email && r.userId.email !== userEmail)
					emails.add(r.userId.email);
			});
			if (
				originalPost?.userId.email &&
				originalPost.userId.email !== userEmail
			) {
				emails.add(originalPost.userId.email);
			}
		} else {
			if (forumData?.userId.email && forumData.userId.email !== userEmail) {
				emails.add(forumData.userId.email);
			}
		}

		return Array.from(emails);
	};

	return (
		<>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href="/"
						>
							Inicio
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href={`/dashboard/admin/foro`}
						>
							Foros
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href={`/dashboard/admin/foro/${forumData?.id}`}
						>
							Foro: {forumData?.title}
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="container mx-auto mt-5 rounded-lg bg-black/25 p-4 shadow-lg sm:px-6 lg:px-8">
				<div className="mx-auto my-10 max-w-5xl rounded-lg bg-gradient-to-br from-gray-800 to-black px-4 py-6 shadow-xl sm:px-6 sm:py-8">
					<div className="flex flex-col gap-4 border-b border-gray-700 pb-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h1 className="text-2xl font-semibold text-white sm:text-3xl">
								{forumData?.title}
							</h1>
							<p className="mt-1 text-sm text-gray-300">
								{forumData?.description}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-400">Educador:</span>
							<span className="rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
								{forumData?.userId.name}
							</span>
						</div>
					</div>
				</div>

				{/* Renderizar Posts */}
				<div className="mx-auto max-w-4xl space-y-6">
					{loadingPosts ? (
						<p className="text-center text-gray-400">Cargando posts...</p>
					) : (
						posts.map((post) => (
							<div
								key={post.id}
								className="relative rounded-lg bg-gray-800 p-5 shadow-lg transition-shadow duration-300 hover:shadow-2xl sm:p-6"
							>
								<div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
									<h2 className="text-lg font-semibold text-white">
										{post.userId.name}
									</h2>
									<span className="text-xs text-gray-400">
										{formatDate(post.createdAt)}
									</span>
								</div>

								{editingPostId === post.id ? (
									<div className="mb-3">
										<textarea
											className="w-full rounded border border-gray-700 bg-gray-900 p-3 text-white"
											value={editPostContent}
											onChange={(e) => setEditPostContent(e.target.value)}
										/>
										<div className="mt-2 flex justify-end gap-2">
											<button
												onClick={() => handlePostUpdate(post.id)}
												className="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
											>
												Actualizar
											</button>
											<button
												onClick={() => setEditingPostId(null)}
												className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
											>
												Cancelar
											</button>
										</div>
									</div>
								) : (
									<p className="text-gray-300">{post.content}</p>
								)}

								{/* Menú editar/eliminar */}
								{post.userId.id === user?.id && (
									<Collapsible className="absolute top-2 right-2">
										<CollapsibleTrigger>
											<EllipsisVertical className="cursor-pointer text-gray-400 hover:text-white" />
										</CollapsibleTrigger>
										<CollapsibleContent className="absolute right-0 mt-1 flex flex-col rounded border border-gray-700 bg-gray-900 shadow-lg">
											<button
												className="px-4 py-2 text-left text-sm text-green-400 hover:bg-gray-700"
												onClick={() => {
													setEditingPostId(post.id);
													setEditPostContent(post.content);
												}}
											>
												Editar
											</button>
											<button
												className="px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
												onClick={() => handleDeletePost(post.id)}
											>
												Eliminar
											</button>
										</CollapsibleContent>
									</Collapsible>
								)}

								{/* Botón responder */}
								<button
									className="mt-4 text-sm text-blue-400 hover:underline"
									onClick={() => setReplyingToPostId(post.id)}
								>
									Responder
								</button>

								{/* Formulario de respuesta */}
								{replyingToPostId === post.id && (
									<div className="mt-3">
										<textarea
											className="w-full rounded border border-gray-700 bg-gray-900 p-3 text-white"
											placeholder="Escribe tu respuesta..."
											value={replyMessage}
											onChange={(e) => setReplyMessage(e.target.value)}
										/>
										<div className="mt-2 flex justify-end gap-2">
											<button
												className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
												onClick={handleReplySubmit}
											>
												Enviar
											</button>
											<button
												className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
												onClick={() => setReplyingToPostId(null)}
											>
												Cancelar
											</button>
										</div>
									</div>
								)}

								{/* Respuestas */}
								<div className="mt-4 border-t border-gray-700 pt-3">
									{renderPostReplies(post.id)}
								</div>
							</div>
						))
					)}
				</div>

				{/* Crear nuevo post */}
				<div className="mx-auto mt-6 max-w-4xl">
					<textarea
						className="w-full rounded-lg border-2 border-gray-700 bg-white p-3 text-black outline-none"
						placeholder="Escribe un nuevo mesaje..."
						value={message}
						onChange={(e) => setMessage(e.target.value)}
					/>
					<button
						className="mt-2 rounded bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
						onClick={handlePostSubmit}
					>
						Enviar
					</button>
				</div>
			</div>
		</>
	);
};

export default ForumPage;
