import { Suspense } from "react"
import { ProjectList } from "~/components/estudiantes/layout/ProjectList"
import { CreateProject } from "~/components/estudiantes/layout/CreateProject"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Proyectos de Estudiantes",
  description: "Crea y visualiza proyectos relacionados con tus cursos completados.",
}

export default function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Proyectos de Estudiantes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Crear Nuevo Proyecto</h2>
          <CreateProject />
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-4">Tus Proyectos</h2>
          <Suspense fallback={<div>Cargando proyectos...</div>}>
            <ProjectList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

