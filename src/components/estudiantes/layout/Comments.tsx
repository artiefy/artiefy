import React, { useState } from 'react';
import { addComment } from '~/server/actions/comment/commentActions';

interface CommentProps {
  courseId: number;
}

const Comments: React.FC<CommentProps> = ({ courseId }) => {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await addComment(courseId, content, rating);
    setMessage(response.message);
    if (response.success) {
      setContent('');
      setRating(0);
    }
  };

  return (
    <div>
      <h2>Deja un comentario</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="content">Comentario:</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="rating">Calificación:</label>
          <select
            id="rating"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            required
          >
            <option value={0}>Selecciona una calificación</option>
            {[1, 2, 3, 4, 5].map((star) => (
              <option key={star} value={star}>
                {star} estrella{star > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Enviar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Comments;