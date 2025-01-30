import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { StarIcon } from '@heroicons/react/24/solid';
import {
	addComment,
	getCommentsByCourseId,
} from '~/server/actions/comment/commentActions';
import { isUserEnrolled } from '~/server/actions/courses/enrollInCourse';

interface CommentProps {
	courseId: number;
}

interface Comment {
	id: string;
	content: string;
	rating: number;
	createdAt: string;
	userName: string; // Añadir el nombre del usuario
}

const Comments: React.FC<CommentProps> = ({ courseId }) => {
	const [content, setContent] = useState('');
	const [rating, setRating] = useState(0);
	const [message, setMessage] = useState('');
	const [comments, setComments] = useState<Comment[]>([]);
	const [loading, setLoading] = useState(true);
	const [isEnrolled, setIsEnrolled] = useState(false);
	const { userId } = useAuth();

	useEffect(() => {
		const fetchComments = async () => {
			try {
				const response = await getCommentsByCourseId(courseId);
				setComments(response.comments);
			} catch (error) {
				console.error('Error fetching comments:', error);
			} finally {
				setLoading(false);
			}
		};

		const checkEnrollment = async () => {
			if (userId) {
				const enrolled = await isUserEnrolled(courseId, userId);
				setIsEnrolled(enrolled);
			}
		};

		void fetchComments();
		void checkEnrollment();
	}, [courseId, userId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isEnrolled) {
			setMessage('Debes estar inscrito en el curso para dejar un comentario.');
			return;
		}
		try {
			const response = await addComment(courseId, content, rating);
			setMessage(response.message);
			if (response.success) {
				setContent('');
				setRating(0);
				setComments((prevComments) => [
					...prevComments,
					{
						id: Date.now().toString(),
						content,
						rating,
						createdAt: new Date().toISOString(),
						userName: 'Tu Nombre',
					}, // Añadir el nombre del usuario
				]);
			}
		} catch (error) {
			console.error('Error adding comment:', error);
		}
	};

	return (
		<div className="mt-8">
			<h2 className="mb-4 text-2xl font-bold">Deja un comentario</h2>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="content"
						className="block text-sm font-medium text-primary"
					>
						Comentario:
					</label>
					<textarea
						id="content"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						required
						placeholder="Escribe tu comentario"
						className="mt-1 block w-full rounded-md border-gray-300 text-background shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						style={{
							height: '100px',
							padding: '10px',
							caretColor: 'black',
							textAlign: 'left',
							verticalAlign: 'middle',
						}}
					/>
				</div>
				<div>
					<label
						htmlFor="rating"
						className="block text-sm font-medium text-primary"
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
				<button
					type="submit"
					className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95"
				>
					Enviar
				</button>
			</form>
			{message && <p className="mt-4 text-sm text-green-600">{message}</p>}
			<div className="mt-8">
				<h3 className="mb-4 text-xl font-semibold">
					Comentarios ({comments.length})
				</h3>
				{loading ? (
					<p>Cargando comentarios...</p>
				) : (
					<ul className="space-y-4">
						{comments.map((comment) => (
							<li key={comment.id} className="border-b pb-4">
								<div className="mb-2 flex items-center">
									{[1, 2, 3, 4, 5].map((star) => (
										<StarIcon
											key={star}
											className={`size-5 ${star <= comment.rating ? 'text-yellow-400' : 'text-gray-300'}`}
										/>
									))}
									<span className="ml-2 text-sm text-gray-600">
										{new Date(comment.createdAt).toLocaleDateString()}
									</span>
								</div>
								<p className="text-primary">{comment.content}</p>
								<p className="text-sm text-gray-500">
									Por: {comment.userName}
								</p>{' '}
								{/* Mostrar el nombre del usuario */}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default Comments;
