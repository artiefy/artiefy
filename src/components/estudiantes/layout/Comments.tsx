import React, { useState, useEffect } from 'react';
import { addComment, getCommentsByCourseId } from '~/server/actions/comment/commentActions';
import { StarIcon } from '@heroicons/react/24/solid';

interface CommentProps {
  courseId: number;
}

interface Comment {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
}

const Comments: React.FC<CommentProps> = ({ courseId }) => {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

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

    void fetchComments();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await addComment(courseId, content, rating);
      setMessage(response.message);
      if (response.success) {
        setContent('');
        setRating(0);
        setComments((prevComments) => [
          ...prevComments,
          { id: Date.now().toString(), content, rating, createdAt: new Date().toISOString() },
        ]);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Deja Un Comentario :</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="text-primary block text-sm font-medium text-gray-700">
            Comentario:
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Escribe tu comentario"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-background placeholder-gray-400"
            style={{ height: '100px', padding: '10px', caretColor: 'black', textAlign: 'left', verticalAlign: 'middle' }}
          />
        </div>
        <div>
          <label htmlFor="rating" className="text-primary block text-sm font-medium text-gray-700">
            Calificación:
          </label>
          <div className="flex items-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`h-6 w-6 cursor-pointer ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Enviar
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Comentarios ({comments.length})</h3>
        {loading ? (
          <p>Cargando comentarios...</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="border-b pb-4">
                <div className="flex items-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      className={`h-5 w-5 ${star <= comment.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Comments;