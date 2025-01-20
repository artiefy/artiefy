"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getUserProjectsTaken } from "~/server/actions/studentActions"
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/estudiantes/ui/card"
import type { ProjectTaken } from "~/types"
import { useUser } from "@clerk/nextjs"

export function ProjectList() {
  const [projects, setProjects] = useState<ProjectTaken[]>([])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { user } = useUser()
        if (user?.id) {
          const userProjects = await getUserProjectsTaken(user.id)
          setProjects(userProjects)
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
      }
    }

    fetchProjects().catch((error) => console.error("Error in fetchProjects:", error))
  }, [])

  return (
    <div className="grid gap-4">
      {projects.map((projectTaken) => (
        projectTaken.project && (
          <Link href={`/estudiantes/proyectos/${projectTaken.project.id}`} key={projectTaken.project.id}>
            <Card>
              <CardHeader>
                <CardTitle>{projectTaken.project.name}</CardTitle> {/* Changed from title to name */}
                <CardDescription>{projectTaken.project.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )
      ))}
      {projects.length === 0 && <p>No has creado ningún proyecto aún.</p>}
    </div>
  )
}
