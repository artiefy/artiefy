"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createProject, getAllCategories, getUserCoursesTaken } from "~/server/actions/studentActions"
import { Button } from "~/components/estudiantes/ui/button"
import { Input } from "~/components/estudiantes/ui/input"
import { Textarea } from "~/components/estudiantes/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/estudiantes/ui/select"
import { toast } from "~/hooks/use-toast"
import { useUser, useAuth } from "@clerk/nextjs"
import type { Category, CourseTaken } from "~/types"

export function CreateProject() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [courseId, setCourseId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [content, setContent] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [courses, setCourses] = useState<CourseTaken[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { user } = useUser()
        if (user?.id) {
          const [categoriesData, coursesData] = await Promise.all([getAllCategories(), getUserCoursesTaken(user.id)])
          setCategories(categoriesData)
          setCourses(coursesData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    void fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { userId } = useAuth()
      if (!userId) throw new Error("Usuario no autenticado")

      await createProject(userId, {
        name: title,
        description,
        courseId: Number.parseInt(courseId),
        categoryId: Number.parseInt(categoryId),
        content,
      })

      toast({
        title: "Proyecto creado",
        description: "Tu proyecto ha sido creado exitosamente.",
      })

      router.refresh()
      setTitle("")
      setDescription("")
      setCourseId("")
      setCategoryId("")
      setContent("")
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al crear el proyecto. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input placeholder="Título del proyecto" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <Textarea
        placeholder="Descripción del proyecto"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <Select value={courseId} onValueChange={setCourseId}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un curso" />
        </SelectTrigger>
        <SelectContent>
          {courses.map((course) => (
            course.course && (
              <SelectItem key={course.courseId} value={course.courseId.toString()}>
                {course.course.title}
              </SelectItem>
            )
          ))}
        </SelectContent>
      </Select>
      <Select value={categoryId} onValueChange={setCategoryId}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una categoría" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Contenido del proyecto"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <Button type="submit">Crear Proyecto</Button>
    </form>
  )
}
