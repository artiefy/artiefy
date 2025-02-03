"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@clerk/nextjs"
import { StarIcon, PencilIcon, TrashIcon, HandThumbUpIcon, XMarkIcon } from "@heroicons/react/24/solid"
import { Button } from "~/components/estudiantes/ui/button"
import { Icons } from "~/components/estudiantes/ui/icons"
import { Textarea } from "~/components/estudiantes/ui/textarea"
import {
  addClassComment,
  getCommentsByLessonId,
  editClassComment,
  deleteClassComment,
  likeClassComment,
} from "~/server/actions/comment/classCommentActions"

interface ClassCommentProps {
  lessonId: number
}

interface ClassComment {
  id: string
  content: string
  rating: number
  createdAt: string
  userName: string
  likes: number
  userId: string
}

const ClassComments: React.FC<ClassCommentProps> = ({ lessonId }) => {
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState("")
  const [comments, setComments] = useState<ClassComment[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editMode, setEditMode] = useState<null | string>(null)
  const [deletingComment, setDeletingComment] = useState<null | string>(null)
  const [likingComment, setLikingComment] = useState<null | string>(null)
  const { userId, isSignedIn } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await getCommentsByLessonId(lessonId)
        setComments(response.comments)
      } catch (error) {
        console.error("Error fetching comments:", error)
      } finally {
        setLoading(false)
      }
    }

    void fetchComments()
  }, [lessonId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let response
      if (editMode) {
        response = await editClassComment(editMode, content, rating)
      } else {
        response = await addClassComment(lessonId, content, rating)
      }
      setMessage(response.message)
      if (response.success) {
        setContent("")
        setRating(0)
        setEditMode(null)
        const updatedComments = await getCommentsByLessonId(lessonId)
        setComments(updatedComments.comments)
      }
    } catch (error) {
      console.error("Error adding/editing comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    setDeletingComment(commentId)
    try {
      const response = await deleteClassComment(commentId)
      setMessage(response.message)
      if (response.success) {
        setComments((prevComments) => prevComments.filter((comment) => comment.id !== commentId))
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
    } finally {
      setDeletingComment(null)
    }
  }

  const handleLike = async (commentId: string) => {
    setLikingComment(commentId)
    try {
      const response = await likeClassComment(commentId)
      setMessage(response.message)
      if (response.success) {
        const updatedComments = await getCommentsByLessonId(lessonId)
        setComments(updatedComments.comments)
      }
    } catch (error) {
      console.error("Error liking comment:", error)
    } finally {
      setLikingComment(null)
    }
  }

  const handleEdit = (comment: ClassComment) => {
    setContent(comment.content)
    setRating(comment.rating)
    setEditMode(comment.id)

    if (textareaRef.current) {
      textareaRef.current.scrollIntoView({ behavior: "smooth" })
      textareaRef.current.focus()
    }
  }

  const handleCancelEdit = () => {
    setContent("")
    setRating(0)
    setEditMode(null)
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-2xl font-bold">Deja un comentario</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-primary">
            Comentario:
          </label>
          <Textarea
            id="content"
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={(e) => (e.target.placeholder = "")}
            onBlur={(e) => (e.target.placeholder = "Escribe tu comentario")}
            required
            placeholder="Escribe tu comentario"
            disabled={!isSignedIn}
            className={`mt-1 block w-full rounded-md border text-primary shadow-xs placeholder:text-gray-400 focus:ring-primary sm:text-sm ${
              !isSignedIn ? "border-gray-300" : "focus:border-2 focus:border-secondary"
            }`}
            style={{
              height: "100px",
              padding: "10px",
              caretColor: "var(--color-primary)",
              textAlign: "left",
              verticalAlign: "middle",
            }}
          />
        </div>
        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-primary">
            Calificación:
          </label>
          <div className="mt-1 flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`size-6 cursor-pointer ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="submit"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-secondary px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-[#00A5C0] focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:outline-hidden active:scale-95"
            style={{ width: "100px", height: "38px" }}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Icons.spinner className="animate-spin text-white" style={{ width: "20px", height: "20px" }} />
              </div>
            ) : editMode ? (
              "Editar"
            ) : (
              "Enviar"
            )}
          </Button>
          {editMode && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-hidden active:scale-95"
            >
              <XMarkIcon className="size-5" />
            </button>
          )}
        </div>
      </form>
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-semibold">Comentarios ({comments.length})</h3>
        {loading ? (
          <p>Cargando comentarios...</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="border-b pb-2">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`size-5 ${star <= comment.rating ? "text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-center">
                      <span className={`-mt-6 text-sm ${comment.likes > 0 ? "text-primary" : "text-gray-400"}`}>
                        {comment.likes.toString()}
                      </span>
                      <button onClick={() => handleLike(comment.id)} disabled={likingComment === comment.id}>
                        {likingComment === comment.id ? (
                          <Icons.spinner
                            className="animate-spin text-blue-600"
                            style={{ width: "20px", height: "20px" }}
                          />
                        ) : (
                          <HandThumbUpIcon
                            className={`-mb-2 size-5 cursor-pointer ${comment.likes > 0 ? "text-primary" : "text-gray-400"} hover:text-blue-600`}
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
                          className={deletingComment === comment.id ? "text-red-500" : ""}
                          disabled={deletingComment === comment.id}
                        >
                          {deletingComment === comment.id ? (
                            <Icons.spinner
                              className="animate-spin text-red-500"
                              style={{ width: "20px", height: "20px" }}
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
                <p className="text-sm text-gray-500">Por: {comment.userName}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ClassComments

