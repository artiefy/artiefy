'use client';

import React, { useCallback,useEffect, useRef, useState } from 'react';

import { useAuth } from '@clerk/nextjs';
import {
	HandThumbUpIcon,
	PencilIcon,
	StarIcon,
	TrashIcon,
	XMarkIcon,
} from '@heroicons/react/24/solid';

import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { Textarea } from '~/components/estudiantes/ui/textarea';
import {
	addComment,
	deleteComment,
	editComment,
	getCommentsByCourseId,
	likeComment,
} from '~/server/actions/estudiantes/comment/courseCommentActions';
import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';

interface CommentProps {
	courseId: number;
	isEnrolled: boolean;
	onEnrollmentChange?: (enrolled: boolean) => void;
}

interface Comment {
	id: string;
	content: string;
	rating: number;
	createdAt: string;
	userName: string;
	likes: number;
	userId: string;
	hasLiked: boolean; // Añadir esta propiedad
}

export default function CourseComments({
	courseId,
	isEnrolled,
	onEnrollmentChange,
}: CommentProps) {
	const [content, setContent] = useState('');
	const [rating, setRating] = useState(0);
	const [message, setMessage] = useState('');
	const [comments, setComments] = useState<Comment[]>([]);
	const [loading, setLoading] = useState(true);
	const [localIsEnrolled, setLocalIsEnrolled] = useState(isEnrolled);
	const [isSubmitting, setIsSubmitting] = useState(false); // Estado para manejar el envío
	const [editMode, setEditMode] = useState<null | string>(null); // Estado para manejar el modo de edición
	const [deletingComment, setDeletingComment] = useState<null | string>(null); // Estado para manejar la eliminación
	const [likingComment, setLikingComment] = useState<null | string>(null); // Estado para manejar el "me gusta"
	const { userId, isSignedIn } = useAuth();
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		const fetchComments = async () => {
			try {
				const response = await getCommentsByCourseId(courseId);
				setComments(response.comments as Comment[]);
			} catch (error) {
				console.error('Error fetching comments:', error);
			} finally {
				setLoading(false);
			}
		};

		void fetchComments();
	}, [courseId]);

	useEffect(() => {
		setLocalIsEnrolled(isEnrolled);
	}, [isEnrolled]);

	const checkEnrollment = useCallback(async () => {
		if (userId) {
			try {
				const enrolled = await isUserEnrolled(courseId, userId);
				setLocalIsEnrolled(enrolled);
				onEnrollmentChange?.(enrolled);
			} catch (error) {
				console.error('Error checking enrollment:', error);
			}
		}
	}, [courseId, userId, onEnrollmentChange]);

	useEffect(() => {
		void checkEnrollment();
	}, [checkEnrollment, userId]);

	const RequirementsMessage = () => {
		if (!isSignedIn) {
			return (
				<div className="mb-4 rounded-md bg-yellow-50 p-4">
					<p className="text-yellow-700">
						Debes iniciar sesión para dejar un comentario.
					</p>
				</div>
			);
		}
		if (!localIsEnrolled) {
			return (
				<div className="mb-4 rounded-md bg-yellow-50 p-4">
					<p className="text-yellow-700">
						Debes estar inscrito en el curso para dejar un comentario.
					</p>
				</div>
			);
		}
		return null;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!isSignedIn || !localIsEnrolled) {
			return; // No intentar enviar si no cumple los requisitos
		}

		setIsSubmitting(true); // Mostrar el spinner
		try {
			let response;
			if (editMode) {
				response = await editComment(editMode, content, rating); // Pasar el rating en la edición también
			} else {
				response = await addComment(courseId, content, rating);
			}
			setMessage(response.message);
			if (response.success) {
				setContent('');
				setRating(0);
				setEditMode(null); // Reset edit mode
				const updatedComments = await getCommentsByCourseId(courseId);
				setComments(updatedComments.comments as Comment[]);
			}
		} catch (error) {
			console.error('Error adding/editing comment:', error);
		} finally {
			setIsSubmitting(false); // Ocultar el spinner
		}
	};

	const handleDelete = async (commentId: string) => {
		setDeletingComment(commentId); // Marcar el comentario como en proceso de eliminación
		try {
			const response = await deleteComment(commentId);
			setMessage(response.message);
			if (response.success) {
				setComments((prevComments) =>
					prevComments.filter((comment) => comment.id !== commentId)
				);
			}
		} catch (error) {
			console.error('Error deleting comment:', error);
		} finally {
			setDeletingComment(null); // Desmarcar el comentario como en proceso de eliminación
		}
	};

	const handleLike = async (commentId: string) => {
		setLikingComment(commentId); // Marcar el comentario como en proceso de "me gusta"
		try {
			const response = await likeComment(commentId);
			setMessage(response.message);
			if (response.success) {
				const updatedComments = await getCommentsByCourseId(courseId);
				setComments(updatedComments.comments as Comment[]);
			}
		} catch (error) {
			console.error('Error liking comment:', error);
		} finally {
			setLikingComment(null); // Desmarcar el comentario como en proceso de "me gusta"
		}
	};

	const handleEdit = (comment: Comment) => {
		setContent(comment.content);
		setRating(comment.rating); // Establecer el rating actual del comentario en el estado
		setEditMode(comment.id);

		// Scroll to the textarea
		if (textareaRef.current) {
			textareaRef.current.scrollIntoView({ behavior: 'smooth' });
			textareaRef.current.focus();
		}
	};

	const handleCancelEdit = () => {
		setContent('');
		setRating(0); // Resetear el rating al cancelar la edición
		setEditMode(null);
	};

	// Agregar función de formateo de fecha consistente
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		// Usar opciones fijas para evitar diferencias de localización
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		};
		return date.toLocaleDateString('es-ES', options);
	};

	// Remove the skeleton loader section and modify the return statement
	return (
		<div className="mt-8">
			<h2 className="mb-4 text-2xl font-bold">Deja un comentario</h2>

			<RequirementsMessage />

			<form onSubmit={handleSubmit} className="space-y-4">
				<div
					className={
						!isSignedIn || !localIsEnrolled
							? 'pointer-events-none opacity-50'
							: ''
					}
				>
					<div>
						<label
							htmlFor="content"
							className="text-primary block text-sm font-medium"
						>
							Comentario:
						</label>
						<Textarea
							id="content"
							ref={textareaRef}
							value={content}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
								setContent(e.target.value)
							}
							onFocus={(e: React.FocusEvent<HTMLTextAreaElement>) =>
								(e.target.placeholder = '')
							}
							onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) =>
								(e.target.placeholder = 'Escribe tu comentario')
							}
							required
							placeholder="Escribe tu comentario"
							className="text-primary hover:border-secondary focus:border-secondary mt-1 block w-full border-[1px] transition-colors duration-200 focus:border-[2px]"
							style={{
								height: '100px',
								padding: '10px',
								caretColor: 'var(--color-primary)',
							}}
						/>
					</div>
					<div>
						<label
							htmlFor="rating"
							className="text-primary m-1 block text-sm font-medium"
						>
							Calificación:
						</label>
						<div className="mt-1 flex items-center">
							{[1, 2, 3, 4, 5].map((star) => (
								<StarIcon
									key={star}
									className={`size-6 cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
									onClick={() => setRating(star)}
								/>
							))}
						</div>
					</div>
					<div className="mt-2 flex items-center">
						<Button
							type="submit"
							className="bg-secondary focus:ring-secondary inline-flex items-center justify-center rounded-md border border-transparent text-sm font-medium text-white shadow-xs hover:bg-[#00A5C0] focus:ring-2 focus:ring-offset-2 focus:outline-hidden active:scale-95"
							style={{ width: '100px', height: '38px' }}
						>
							{isSubmitting ? (
								<div className="flex items-center">
									<Icons.spinner
										className="text-white"
										style={{ width: '20px', height: '20px' }}
									/>
								</div>
							) : editMode ? (
								'Editar'
							) : (
								'Enviar'
							)}
						</Button>
						{editMode && (
							<button
								type="button"
								onClick={handleCancelEdit}
								className="ml-2 inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-hidden active:scale-95"
							>
								<XMarkIcon className="size-5" />
							</button>
						)}
					</div>
				</div>
			</form>
			{message && <p className="mt-4 text-sm text-green-600">{message}</p>}
			<div className="mt-8">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="flex items-center gap-2 text-xl font-semibold">
						Comentarios ({comments.length})
						{loading && (
							<div className="text-primary flex items-center gap-2">
								<Icons.spinner
									className="inline-block"
									style={{ width: '20px', height: '20px' }}
								/>
								<span className="text-base text-gray-500">
									Cargando comentarios...
								</span>
							</div>
						)}
					</h3>
				</div>
				<ul className="space-y-4">
					{comments.map((comment) => (
						<li key={comment.id} className="border-b pb-2">
							<div className="mb-2 flex items-center justify-between">
								<div className="flex items-center py-2">
									{[1, 2, 3, 4, 5].map((star) => (
										<StarIcon
											key={star}
											className={`size-5 ${star <= comment.rating ? 'text-yellow-400' : 'text-gray-300'}`}
										/>
									))}
									<span className="ml-2 text-sm text-gray-600">
										{formatDate(comment.createdAt)}
									</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="flex flex-col items-center">
										<span
											className={`-mt-6 text-sm ${comment.likes > 0 ? 'text-primary' : 'text-gray-400'}`}
										>
											{comment.likes.toString()}
										</span>{' '}
										{/* Convert likes to string */}
										<button
											onClick={() => handleLike(comment.id)}
											disabled={likingComment === comment.id}
										>
											{likingComment === comment.id ? (
												<Icons.spinner
													className="text-secondary"
													style={{ width: '20px', height: '20px' }}
												/>
											) : (
												<HandThumbUpIcon
													className={`-mb-2 size-5 cursor-pointer transition-colors duration-200 ${comment.hasLiked ? 'text-blue-500' : 'text-gray-400'} hover:text-blue-500`}
												/>
											)}
										</button>
									</div>
									{userId === comment.userId && (
										<>
											<button onClick={() => handleEdit(comment)}>
												<PencilIcon className="size-5 cursor-pointer text-gray-500 hover:text-amber-400" />
											</button>
											<button
												onClick={() => handleDelete(comment.id)}
												className={
													deletingComment === comment.id ? 'text-red-500' : ''
												}
												disabled={deletingComment === comment.id}
											>
												{deletingComment === comment.id ? (
													<Icons.spinner
														className="text-red-500"
														style={{ width: '20px', height: '20px' }}
													/>
												) : (
													<TrashIcon className="size-5 cursor-pointer text-gray-500 hover:text-red-500" />
												)}
											</button>
										</>
									)}
								</div>
							</div>
							<p className="text-primary">{comment.content}</p>
							<p className="text-sm text-gray-500">
								Por: {comment.userName}
							</p>{' '}
							{/* Mostrar el nombre del usuario */}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
