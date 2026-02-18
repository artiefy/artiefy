'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  addClassComment,
  addReply,
  deleteClassComment,
  deleteReply,
  editClassComment,
  getCommentsByLessonId,
  getRepliesByCommentId,
  likeClassComment,
} from '~/server/actions/estudiantes/comment/classCommentActions';

interface CommentProps {
  lessonId: number;
  onCommentsCountChange?: (count: number) => void;
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

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  userName: string;
  userId: string;
  parentCommentId: string;
}

export default function LessonComments({
  lessonId,
  onCommentsCountChange,
}: CommentProps) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para manejar el envío
  const [editMode, setEditMode] = useState<null | string>(null); // Estado para manejar el modo de edición
  const [deletingComment, setDeletingComment] = useState<null | string>(null); // Estado para manejar la eliminación
  const [likingComment, setLikingComment] = useState<null | string>(null); // Estado para manejar el "me gusta"
  const [openMenuId, setOpenMenuId] = useState<null | string>(null); // Estado para controlar qué menú está abierto
  const [replyingTo, setReplyingTo] = useState<null | string>(null); // Estado para controlar a qué comentario se está respondiendo
  const [replyContent, setReplyContent] = useState(''); // Contenido de la respuesta
  const [replies, setReplies] = useState<Record<string, Reply[]>>({}); // Respuestas por comentario
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({}); // Control de visibilidad de respuestas
  const [openReplyMenuId, setOpenReplyMenuId] = useState<null | string>(null); // Estado para controlar qué menú de respuesta está abierto
  const [deletingReply, setDeletingReply] = useState<null | string>(null); // Estado para manejar la eliminación de respuestas
  const { userId, isSignedIn } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await getCommentsByLessonId(lessonId);
        setComments(response.comments as Comment[]);
        onCommentsCountChange?.(
          Array.isArray(response.comments) ? response.comments.length : 0
        );

        // Cargar respuestas para cada comentario
        const repliesData: Record<string, Reply[]> = {};
        for (const comment of response.comments) {
          const commentReplies = await getRepliesByCommentId(comment.id);
          if (commentReplies.length > 0) {
            repliesData[comment.id] = commentReplies;
          }
        }
        setReplies(repliesData);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchComments();
  }, [lessonId, onCommentsCountChange]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

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
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      return; // No intentar enviar si no cumple los requisitos
    }

    setIsSubmitting(true); // Mostrar el spinner
    try {
      let response;
      if (editMode) {
        response = await editClassComment(editMode, content, rating); // Pasar el rating en la edición también
      } else {
        response = await addClassComment(lessonId, content, rating);
      }
      setMessage(response.message);
      if (response.success) {
        setContent('');
        setRating(0);
        setEditMode(null); // Reset edit mode
        const updatedComments = await getCommentsByLessonId(lessonId);
        setComments(updatedComments.comments as Comment[]);
        onCommentsCountChange?.(
          Array.isArray(updatedComments.comments)
            ? updatedComments.comments.length
            : 0
        );
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
      const response = await deleteClassComment(commentId);
      setMessage(response.message);
      if (response.success) {
        setComments((prevComments) => {
          const nextComments = prevComments.filter(
            (comment) => comment.id !== commentId
          );
          onCommentsCountChange?.(nextComments.length);
          return nextComments;
        });
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
      const response = await likeClassComment(commentId);
      setMessage(response.message);
      if (response.success) {
        const updatedComments = await getCommentsByLessonId(lessonId);
        setComments(updatedComments.comments as Comment[]);
        onCommentsCountChange?.(
          Array.isArray(updatedComments.comments)
            ? updatedComments.comments.length
            : 0
        );
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

  const toggleMenu = (commentId: string) => {
    setOpenMenuId(openMenuId === commentId ? null : commentId);
  };

  const handleEditFromMenu = (comment: Comment) => {
    handleEdit(comment);
    setOpenMenuId(null);
  };

  const handleDeleteFromMenu = async (commentId: string) => {
    setOpenMenuId(null);
    await handleDelete(commentId);
  };

  const handleReply = async (commentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const response = await addReply(commentId, replyContent);
      if (response.success) {
        setReplyContent('');
        setReplyingTo(null);
        // Recargar las respuestas para este comentario
        const updatedReplies = await getRepliesByCommentId(commentId);
        setReplies((prev) => ({ ...prev, [commentId]: updatedReplies }));
      }
      setMessage(response.message);
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const loadReplies = async (commentId: string) => {
    try {
      const commentReplies = await getRepliesByCommentId(commentId);
      setReplies((prev) => ({ ...prev, [commentId]: commentReplies }));
      setShowReplies((prev) => ({ ...prev, [commentId]: true }));
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const toggleReplies = (commentId: string) => {
    if (showReplies[commentId]) {
      setShowReplies((prev) => ({ ...prev, [commentId]: false }));
    } else {
      void loadReplies(commentId);
    }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    setDeletingReply(replyId);
    try {
      const response = await deleteReply(replyId);
      setMessage(response.message);
      if (response.success) {
        // Recargar las respuestas para este comentario
        const updatedReplies = await getRepliesByCommentId(commentId);
        setReplies((prev) => ({ ...prev, [commentId]: updatedReplies }));
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
    } finally {
      setDeletingReply(null);
      setOpenReplyMenuId(null);
    }
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
    <>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-100">
          Opiniones de la clase
        </h3>
        <p className="mt-1 text-sm text-slate-300">
          Comparte tu experiencia y lee lo que otros estudiantes opinan
        </p>
      </div>

      <RequirementsMessage />

      <form onSubmit={handleSubmit}>
        <div
          className={`space-y-3 rounded-xl border p-4 ${
            !isSignedIn ? 'pointer-events-none' : ''
          }`}
          style={{
            backgroundColor: '#061c3780',
            borderColor: 'hsla(217, 33%, 17%, 0.5)',
          }}
        >
          {/* Rating with connected stars */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#94a3b8]">Tu experiencia:</span>
            <div className="flex items-center gap-0">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setRating(1)}
                  className="relative cursor-pointer transition-all duration-300 hover:scale-125"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`lucide lucide-star h-5 w-5 transition-all duration-300 ${
                      1 <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-[#94a3b8]/40'
                    }`}
                  >
                    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center">
                <div
                  className={`h-0.5 w-2 transition-all duration-300 ${
                    2 <= rating ? 'bg-yellow-400' : 'bg-[#94a3b8]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setRating(2)}
                  className="relative cursor-pointer transition-all duration-300 hover:scale-125"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`lucide lucide-star h-5 w-5 transition-all duration-300 ${
                      2 <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-[#94a3b8]/40'
                    }`}
                  >
                    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center">
                <div
                  className={`h-0.5 w-2 transition-all duration-300 ${
                    3 <= rating ? 'bg-yellow-400' : 'bg-[#94a3b8]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setRating(3)}
                  className="relative cursor-pointer transition-all duration-300 hover:scale-125"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`lucide lucide-star h-5 w-5 transition-all duration-300 ${
                      3 <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-[#94a3b8]/40'
                    }`}
                  >
                    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center">
                <div
                  className={`h-0.5 w-2 transition-all duration-300 ${
                    4 <= rating ? 'bg-yellow-400' : 'bg-[#94a3b8]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setRating(4)}
                  className="relative cursor-pointer transition-all duration-300 hover:scale-125"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`lucide lucide-star h-5 w-5 transition-all duration-300 ${
                      4 <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-[#94a3b8]/40'
                    }`}
                  >
                    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center">
                <div
                  className={`h-0.5 w-2 transition-all duration-300 ${
                    5 <= rating ? 'bg-yellow-400' : 'bg-[#94a3b8]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setRating(5)}
                  className="relative cursor-pointer transition-all duration-300 hover:scale-125"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`lucide lucide-star h-5 w-5 transition-all duration-300 ${
                      5 <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-[#94a3b8]/40'
                    }`}
                  >
                    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <Textarea
            id="content"
            ref={textareaRef}
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setContent(e.target.value)
            }
            required
            placeholder="Comparte tu opinión sobre la clase..."
            className="min-h-[80px] resize-none text-slate-100 placeholder:text-slate-400"
            style={{
              backgroundColor: '#01152d80',
              borderColor: 'hsla(217, 33%, 17%, 0.5)',
            }}
          />

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Placeholder buttons for future features */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-100"
              >
                <Icons.image className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-100"
              >
                <Icons.video className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-100"
              >
                <Icons.mic className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[14px] bg-primary px-3 text-sm font-medium whitespace-nowrap text-[#080c16] ring-offset-background transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                style={{ backgroundColor: '#22c4d3' }}
              >
                {isSubmitting ? (
                  <Icons.spinner className="h-4 w-4" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-send h-4 w-4"
                  >
                    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 1-.635-.635l-19 6.5a.5.5 0 0 1-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                    <path d="m21.854 2.147-10.94 10.939" />
                  </svg>
                )}
                {editMode ? 'Actualizar' : 'Publicar'}
              </button>
              {editMode && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelEdit}
                >
                  <XMarkIcon className="h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>

      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}

      <div className="mt-6">
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border p-4"
              style={{
                backgroundColor: '#061c3780',
                borderColor: 'hsla(217, 33%, 17%, 0.5)',
              }}
            >
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-accent/20 text-sm font-semibold text-accent">
                    {comment.userName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  {/* Header with name, date and rating */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-100">
                      {comment.userName}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(comment.createdAt)}
                    </span>
                    <div className="ml-auto flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-4 w-4 ${
                            star <= comment.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-[#94a3b8]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="group flex items-start gap-2">
                    <div className="flex-1 text-sm whitespace-pre-wrap text-slate-300">
                      {comment.content}
                    </div>
                    {userId === comment.userId && (
                      <div className="relative inline-flex">
                        <button
                          onClick={() => toggleMenu(comment.id)}
                          className="ml-2 rounded-full p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-700/20 hover:text-slate-100"
                          aria-label="Abrir menú"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-ellipsis h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === comment.id && (
                          <div
                            className="absolute top-1/2 left-full z-10 ml-2 w-40 -translate-y-1/2 rounded-lg border shadow-lg"
                            style={{
                              backgroundColor: '#01152d',
                              borderColor: 'hsla(217, 33%, 17%, 0.5)',
                            }}
                          >
                            <button
                              onClick={() => handleEditFromMenu(comment)}
                              className="flex w-full items-center gap-2 rounded-t-lg px-4 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-700/20 hover:text-slate-100"
                            >
                              <PencilIcon className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteFromMenu(comment.id)}
                              disabled={deletingComment === comment.id}
                              className="flex w-full items-center gap-2 rounded-b-lg px-4 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-700/20 hover:text-red-400"
                            >
                              {deletingComment === comment.id ? (
                                <Icons.spinner className="h-4 w-4" />
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      onClick={() => handleLike(comment.id)}
                      disabled={likingComment === comment.id}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        comment.hasLiked
                          ? 'text-cyan-400'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      {likingComment === comment.id ? (
                        <Icons.spinner className="h-4 w-4" />
                      ) : (
                        <HandThumbUpIcon
                          className={`h-4 w-4 ${comment.hasLiked ? 'fill-current' : ''}`}
                        />
                      )}
                      {comment.likes}
                    </button>

                    <button
                      onClick={() => setReplyingTo(comment.id)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-100"
                    >
                      <Icons.reply className="h-4 w-4" />
                      Responder
                    </button>

                    {replies[comment.id] && replies[comment.id].length > 0 && (
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`lucide h-4 w-4 transition-transform ${showReplies[comment.id] ? 'rotate-180' : ''}`}
                        >
                          <path d="m18 15-6-6-6 6" />
                        </svg>
                        {replies[comment.id].length} respuesta
                        {replies[comment.id].length > 1 ? 's' : ''}
                      </button>
                    )}
                  </div>

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Escribe tu respuesta..."
                        className="min-h-[60px] resize-none text-slate-100 placeholder:text-slate-400"
                        style={{
                          backgroundColor: '#01152d80',
                          borderColor: 'hsla(217, 33%, 17%, 0.5)',
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReply(comment.id)}
                          className="inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap text-[#080c16] ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                          style={{ backgroundColor: '#22c4d3' }}
                        >
                          <Icons.send className="h-3 w-3" />
                          Enviar
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap text-slate-400 transition-colors hover:text-slate-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replies section */}
                  {replies[comment.id] &&
                    replies[comment.id].length > 0 &&
                    showReplies[comment.id] && (
                      <div className="mt-3">
                        <div className="space-y-3 border-l-2 border-slate-700 pl-4">
                          {replies[comment.id].map((reply) => (
                            <div key={reply.id} className="flex gap-2">
                              <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full">
                                <span className="flex h-full w-full items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                                  {reply.userName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-100">
                                    {reply.userName}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <div className="group mt-1 flex items-start gap-2">
                                  <div className="flex-1 text-sm text-slate-300">
                                    {reply.content}
                                  </div>
                                  {userId === reply.userId && (
                                    <div className="relative inline-flex">
                                      <button
                                        onClick={() =>
                                          setOpenReplyMenuId(
                                            openReplyMenuId === reply.id
                                              ? null
                                              : reply.id
                                          )
                                        }
                                        className="ml-2 rounded-full p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-700/20 hover:text-slate-100"
                                        aria-label="Abrir menú"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          className="lucide lucide-ellipsis h-4 w-4"
                                        >
                                          <circle
                                            cx="12"
                                            cy="12"
                                            r="1"
                                          ></circle>
                                          <circle
                                            cx="19"
                                            cy="12"
                                            r="1"
                                          ></circle>
                                          <circle cx="5" cy="12" r="1"></circle>
                                        </svg>
                                      </button>

                                      {openReplyMenuId === reply.id && (
                                        <div
                                          className="absolute top-1/2 left-full z-10 ml-2 w-40 -translate-y-1/2 rounded-lg border shadow-lg"
                                          style={{
                                            backgroundColor: '#01152d',
                                            borderColor:
                                              'hsla(217, 33%, 17%, 0.5)',
                                          }}
                                        >
                                          <button
                                            onClick={() =>
                                              handleDeleteReply(
                                                comment.id,
                                                reply.id
                                              )
                                            }
                                            disabled={
                                              deletingReply === reply.id
                                            }
                                            className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-700/20 hover:text-red-400"
                                          >
                                            {deletingReply === reply.id ? (
                                              <Icons.spinner className="h-4 w-4" />
                                            ) : (
                                              <TrashIcon className="h-4 w-4" />
                                            )}
                                            Eliminar
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {loading && (
          <div className="flex items-center justify-center gap-2 p-8">
            <Icons.spinner className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-300">
              Cargando comentarios...
            </span>
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div
            className="rounded-xl border p-8 text-center"
            style={{
              backgroundColor: '#061c3780',
              borderColor: 'hsla(217, 33%, 17%, 0.5)',
            }}
          >
            <p className="text-sm text-slate-300">
              Aún no hay comentarios. ¡Sé el primero en compartir tu opinión!
            </p>
          </div>
        )}
      </div>
    </>
  );
}
