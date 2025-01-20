import { getProjectById } from "~/server/actions/studentActions";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/estudiantes/ui/card";

export default async function ProjectDetails({ params }: { params: { id: string } }) {
  const projectId = Number.parseInt(params.id);
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>Categoría: {project.category?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{project.description}</p>
          {/* Temporarily removed content */}
        </CardContent>
      </Card>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const projectId = Number.parseInt(params.id);
  const project = await getProjectById(projectId);

  if (!project) {
    return {
      title: "Proyecto no encontrado",
    };
  }

  return {
    title: `Proyecto: ${project.name}`,
    description: project.description,
  };
}
