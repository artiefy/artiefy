/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, UserButton } from '@clerk/nextjs'
import { createCourse, getAllCourses, updateCourse, deleteCourse, createUser, getUserById } from '~/models/courseModels'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { AspectRatio } from '~/components/ui/aspect-ratio'
import Image from 'next/image'

interface Course {
  id: number
  title: string
  description: string
  coverImageKey: string
}

export default function Page() {
  const { user } = useUser()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const router = useRouter()

  useEffect(() => {
    fetchCourses()
    if (user) {
      registerUser(user)
    }
  }, [user])

  const fetchCourses = async () => {
    const allCourses = await getAllCourses()
    setCourses(allCourses)
  }

  const registerUser = async (user: any) => {
    const { id, emailAddresses, fullName } = user
    const email = emailAddresses[0]?.emailAddress
    if (id && email) {
      const existingUser = await getUserById(id)
      if (!existingUser) {
        await createUser(id, email, fullName)
      }
    } else {
      console.error('User ID or email is missing')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!file) {
      alert('Please select a file to upload.')
      return
    }

    setUploading(true)

    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + '/api/upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      }
    )

    if (response.ok) {
      const { url, fields }: { url: string; fields: Record<string, string> } = await response.json()

      const formData = new FormData()
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value)
      })
      formData.append('file', file)

      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      if (uploadResponse.ok) {
        const coverImageKey = fields.key
        const creatorId = user?.id
        if (!creatorId) {
          console.error('User ID is missing')
          alert('User ID is missing')
          setUploading(false)
          return
        }
        if (editingCourseId) {
          await updateCourse(editingCourseId, title, description, coverImageKey)
          setEditingCourseId(null)
        } else {
          await createCourse(title, description, creatorId, coverImageKey)
        }
        alert('Upload successful!')
        fetchCourses()
      } else {
        console.error('S3 Upload Error:', uploadResponse)
        alert('Upload failed.')
      }
    } else {
      alert('Failed to get pre-signed URL.')
    }

    setUploading(false)
  }

  const handleEdit = (course: Course) => {
    setTitle(course.title)
    setDescription(course.description)
    setEditingCourseId(course.id)
  }

  const handleDelete = async (courseId: number) => {
    await deleteCourse(courseId)
    fetchCourses()
  }

  return (
    <main className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Manage Courses</h1>
      <UserButton />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editingCourseId ? 'Update Course' : 'Create Course'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Course Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mb-4 w-full p-2 border border-gray-300 rounded"
            />
            <textarea
              placeholder="Course Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mb-4 w-full p-2 border border-gray-300 rounded"
            />
            <input
              id="file"
              type="file"
              onChange={(e) => {
                const files = e.target.files
                if (files) {
                  if (files[0]) {
                    setFile(files[0])
                  }
                }
              }}
              accept="image/png, image/jpeg, video/mp4"
              className="mb-4 w-full p-2 border border-gray-300 rounded"
            />
            {uploading && <Progress value={uploadProgress} className="mb-4" />}
            <Button type="submit" disabled={uploading} className="w-full">
              {editingCourseId ? 'Update Course' : 'Create Course'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <h2 className="text-2xl font-bold mb-4">Courses List</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <CardHeader className="p-0">
              <AspectRatio ratio={16 / 9}>
                <Image
                  src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </AspectRatio>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleEdit(course)} className="mr-2">Edit</Button>
              <Button onClick={() => handleDelete(course.id)} variant="destructive">Delete</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  )
}