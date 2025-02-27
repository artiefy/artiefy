'use client';
import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { EllipsisVertical } from 'lucide-react';
import { useParams } from 'next/navigation';
import '@reach/menu-button/styles.css';
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
} from '~/components/ui/collapsible';

// Interfaces
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

const formatDate = (dateString: string | number | Date) => {
	const date = new Date(dateString);
	return isNaN(date.getTime())
		? 'Fecha inválida'
		: date.toISOString().split('T')[0];
};

const ForumPage = () => {
	const params = useParams();
	const forumId = params?.forumId;
	const { user } = useUser();
	const [forumData, setForumData] = useState<Foro | null>(null);
	const [loading, setLoading] = useState(true);
	const [posts, setPosts] = useState<Post[]>([]);
	const [postReplays, setPostReplays] = useState<PostReplay[]>([]);
	const [message, setMessage] = useState('');
	const [replyMessage, setReplyMessage] = useState('');
	const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null);
	const [loadingPosts, setLoadingPosts] = useState(false);
	const [editingPostId, setEditingPostId] = useState<number | null>(null);
	const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
	const [editPostContent, setEditPostContent] = useState<string>('');
	const [editReplyContent, setEditReplyContent] = useState<string>('');
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

	useEffect(() => {
		fetchPosts().catch((error) =>
			console.error('Error fetching posts:', error)
		);
		fetchForum().catch((error) =>
			console.error('Error fetching forum:', error)
		);
	}, [fetchPosts, fetchForum]);

	useEffect(() => {
		if (posts.length > 0) {
			fetchPostReplays().catch((error) =>
				console.error('Error fetching post replies:', error)
			);
		}
	}, [fetchPostReplays, posts]);

	// Desbloquear y actualizar la función sendForumEmail
	const sendForumEmail = async (postContent: string, recipients: string[]) => {
		try {
			if (!forumData || !user) return;

			// Verificar si el usuario tiene una cuenta de Google vinculada
			const hasGoogleAccount = user.externalAccounts?.some(
				(account) => account.provider === 'google'
			);

			if (!hasGoogleAccount) {
				// Aquí puedes mostrar un modal o mensaje pidiendo al usuario que vincule su cuenta
				alert(
					'Por favor, vincula tu cuenta de Google para poder enviar correos'
				);
				// Puedes redirigir al usuario a la página de configuración de su cuenta
				// window.location.href = '/user/settings';
				return;
			}

			console.log('Sending email with data:', {
				content: postContent,
				recipients,
				forumTitle: forumData.title,
				authorName: user.fullName,
			});

			const response = await fetch('/api/educadores/send-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					// Authorization: `Bearer ${await (user.getToken ? user.getToken({ template: 'your-template-id' }) : '')}`,
				},
				body: JSON.stringify({
					content: postContent,
					recipients: recipients,
					forumTitle: forumData.title,
					authorName: user.fullName ?? 'Usuario',
				}),
			});

			const result = (await response.json()) as {
				success: boolean;
				message: string;
			};

			if (!response.ok) {
				console.error('Failed to send email. Status:', response.status);
				console.error('Error details:', result);
				return;
			}

			console.log('Email sent successfully:', result);
		} catch (error) {
			console.error('Error in sendForumEmail:', error);
		}
	};

	// Modificar handlePostSubmit para enviar emails solo cuando el usuario es educador
	const handlePostSubmit = async () => {
		if (!message.trim() || !user) return;
		try {
			console.log('Starting handlePostSubmit...');
			console.log('User role:', user.publicMetadata?.role);
			console.log('User ID:', user.id);
			console.log('Forum creator ID:', forumData?.userId.id);

			const response = await fetch('/api/forums/posts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
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

				if (user.publicMetadata?.role === 'educador') {
					const uniqueEmails = new Set<string>();

					// Añadir emails de los participantes del foro
					posts.forEach((post) => {
						if (post.userId.email) {
							uniqueEmails.add(post.userId.email);
						}
					});

					// Añadir el email del creador del foro
					if (forumData?.userId.email) {
						uniqueEmails.add(forumData.userId.email);
					}

					const emailList = Array.from(uniqueEmails);
					const userEmail = user.emailAddresses[0]?.emailAddress;

					// No enviar email al autor del post
					const filteredEmails = emailList.filter(
						(email) => email !== userEmail
					);

					if (filteredEmails.length > 0) {
						await sendForumEmail(message, filteredEmails);
					}
				}
			}
		} catch (error) {
			console.error('Error al enviar el post:', error);
		}
	};

	// Modificar handleReplySubmit para enviar emails solo cuando el usuario es educador
	const handleReplySubmit = async () => {
		if (!replyMessage.trim() || !user || replyingToPostId === null) return;

		try {
			console.log('Starting handleReplySubmit...');
			console.log('User role:', user.publicMetadata?.rol);
			console.log('User ID:', user.id);
			console.log('Forum creator ID:', forumData?.userId.id);

			const response = await fetch('/api/forums/posts/postReplay', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
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

				if (user.publicMetadata?.role === 'educador') {
					const originalPost = posts.find((p) => p.id === replyingToPostId);
					const postReplies = postReplays.filter(
						(r) => r.postId === replyingToPostId
					);

					const uniqueEmails = new Set<string>();
					if (originalPost?.userId.email) {
						uniqueEmails.add(originalPost.userId.email);
					}
					postReplies.forEach((reply) => {
						if (reply.userId.email) {
							uniqueEmails.add(reply.userId.email);
						}
					});

					const emailList = Array.from(uniqueEmails);
					const userEmail = user.emailAddresses[0]?.emailAddress;
					const filteredEmails = emailList.filter(
						(email) => email !== userEmail
					);

					if (filteredEmails.length > 0) {
						await sendForumEmail(replyMessage, filteredEmails);
					}
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
			<div className="ml-6 mt-2 space-y-2" key={reply.id}>
				<div className="relative rounded-lg bg-gray-800 p-3">
					<p className="mb-3 font-bold text-gray-200">
						{reply.userId.name}, dijo:
					</p>
					{editingReplyId === reply.id ? (
						<div>
							<textarea
								className="w-full rounded-lg p-2 text-black outline-none"
								value={editReplyContent}
								onChange={(e) => setEditReplyContent(e.target.value)}
							/>
							<button
								onClick={() => handleReplyUpdate(reply.id)}
								className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
							>
								Actualizar Respuesta
							</button>
						</div>
					) : (
						<p className="text-justify text-gray-200">{reply.content}</p>
					)}
					<p className="mt-4 text-xs text-gray-400">
						Creado en: {formatDate(reply.createdAt)}
						{reply.updatedAt !== reply.createdAt && (
							<span className="ml-2 text-xs text-gray-500">(editado)</span>
						)}
					</p>
					{reply.userId.id === user?.id && (
						<div className="mt-4 space-x-2">
							{editingReplyId === reply.id ? (
								<Collapsible className="absolute right-3 top-4">
									<CollapsibleTrigger>
										<EllipsisVertical className="text-white" />
									</CollapsibleTrigger>
									<CollapsibleContent>
										<button
											className="mt-2 text-sm text-red-400"
											onClick={() => setEditingReplyId(null)}
										>
											Cancelar
										</button>
									</CollapsibleContent>
									<CollapsibleContent>
										<button
											className="mt-2 text-sm text-red-400"
											onClick={() => handleDeleteReply(reply.id)}
										>
											Eliminar Respuesta
										</button>
									</CollapsibleContent>
								</Collapsible>
							) : (
								<Collapsible className="absolute right-3 top-4">
									<CollapsibleTrigger>
										<EllipsisVertical className="text-white" />
									</CollapsibleTrigger>
									<CollapsibleContent>
										<button
											className="mt-2 text-sm text-yellow-400"
											onClick={() => {
												setEditingReplyId(reply.id);
												setEditReplyContent(reply.content);
											}}
										>
											Editar Respuesta
										</button>
									</CollapsibleContent>
									<CollapsibleContent>
										<button
											className="mt-2 text-sm text-red-400"
											onClick={() => handleDeleteReply(reply.id)}
										>
											Eliminar Respuesta
										</button>
									</CollapsibleContent>
								</Collapsible>
							)}
						</div>
					)}
				</div>
			</div>
		));
	};

	if (loading) {
		return (
			<main className="flex h-screen flex-col items-center justify-center">
				<div className="size-32 animate-spin rounded-full border-y-2 border-primary">
					<span className="sr-only"></span>
				</div>
				<span className="text-primary">Cargando...</span>
			</main>
		);
	}

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
							href={`/dashboard/educadores/foro`}
						>
							Foros
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink
							className="text-primary hover:text-gray-300"
							href={`/dashboard/educadores/foro/${forumData?.id}`}
						>
							Foro: {forumData?.title}
						</BreadcrumbLink>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<div className="container mx-auto mt-5 rounded-lg bg-black/25 p-5 shadow-lg">
				<div className="mx-auto w-full rounded-lg bg-slate-500/20 p-5 shadow-lg md:w-11/12 lg:w-full">
					<div className="flex justify-between">
						<h1 className="mb-4 text-2xl font-bold text-white">
							{forumData?.title}
						</h1>
						<p className="text-white">
							Del instructor: {forumData?.userId.name}
						</p>
					</div>
					<p className="mb-4 text-white">{forumData?.description}</p>
				</div>

				{/* Renderizar Posts */}
				<div className="mt-4 flex flex-col-reverse space-y-4">
					{loadingPosts ? (
						<p>Cargando posts...</p>
					) : (
						posts.map((post) => (
							<div
								className="relative rounded-lg bg-slate-500/20 p-3"
								key={post.id}
							>
								<p className="font-bold text-gray-200">
									{post.userId.name}, dijo:
								</p>
								{editingPostId === post.id ? (
									<div>
										<textarea
											className="w-full p-2 text-black"
											value={editPostContent}
											onChange={(e) => setEditPostContent(e.target.value)}
										/>
										<button
											onClick={() => handlePostUpdate(post.id)}
											className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
										>
											Actualizar Post
										</button>
									</div>
								) : (
									<p className="text-justify text-gray-200">{post.content}</p>
								)}
								<p className="mt-4 text-xs text-gray-400">
									Creado en: {formatDate(post.createdAt)}
									{post.updatedAt !== post.createdAt && (
										<span className="ml-2 text-xs text-gray-500">
											(editado)
										</span>
									)}
								</p>
								{post.userId.id === user?.id && (
									<div className="mt-4 space-x-2">
										{editingPostId === post.id ? (
											<Collapsible className="absolute right-3 top-4">
												<CollapsibleTrigger>
													<EllipsisVertical className="text-white" />
												</CollapsibleTrigger>
												<CollapsibleContent>
													<button
														className="mt-2 text-sm text-red-400"
														onClick={() => setEditingPostId(null)}
													>
														Cancelar
													</button>
												</CollapsibleContent>
												<CollapsibleContent>
													<button
														className="mt-2 text-sm text-red-400"
														onClick={() => handleDeletePost(post.id)}
													>
														Eliminar Post
													</button>
												</CollapsibleContent>
											</Collapsible>
										) : (
											<Collapsible className="absolute right-3 top-4">
												<CollapsibleTrigger>
													<EllipsisVertical className="text-white" />
												</CollapsibleTrigger>
												<CollapsibleContent>
													<button
														className="mt-2 text-sm text-yellow-400"
														onClick={() => {
															setEditingPostId(post.id);
															setEditPostContent(post.content);
														}}
													>
														Editar Post
													</button>
												</CollapsibleContent>
												<CollapsibleContent>
													<button
														className="mt-2 text-sm text-red-400"
														onClick={() => handleDeletePost(post.id)}
													>
														Eliminar Post
													</button>
												</CollapsibleContent>
											</Collapsible>
										)}
									</div>
								)}
								{/* Mostrar formulario de respuesta */}
								<div>
									{replyingToPostId === post.id ? (
										<div>
											<textarea
												className="w-full rounded-lg p-2 text-black outline-none"
												placeholder="Escribe tu respuesta..."
												value={replyMessage}
												onChange={(e) => setReplyMessage(e.target.value)}
											/>
											<button
												className="mr-2 mt-2 rounded bg-blue-500 px-4 py-2 text-white"
												onClick={handleReplySubmit}
											>
												Enviar Respuesta
											</button>
											<button
												className="mt-2 text-sm text-red-400"
												onClick={() => setReplyingToPostId(null)}
											>
												Cancelar
											</button>
										</div>
									) : (
										<button
											className="mt-2 text-sm text-green-400"
											onClick={() => setReplyingToPostId(post.id)}
										>
											Responder
										</button>
									)}
								</div>

								<div className="flex flex-col-reverse">
									{/* Renderizar Respuestas */}
									{renderPostReplies(post.id)}
								</div>
							</div>
						))
					)}
				</div>

				{/* Crear nuevo Post */}
				<div className="mt-4">
					<textarea
						className="w-full rounded-lg p-2 text-black outline-none"
						placeholder="Escribe un nuevo mensaje..."
						value={message}
						onChange={(e) => setMessage(e.target.value)}
					></textarea>
					<button
						className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
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
