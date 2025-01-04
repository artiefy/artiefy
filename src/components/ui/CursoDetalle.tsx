import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

type Curso = {
  id: number;
  nombre: string;
  descripcion: string;
  duracion: string;
  estudiantes: number;
  materiales: string[];
}

type CursoDetalleProps = {
  curso: Curso;
}

export function CursoDetalle({ curso }: CursoDetalleProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Información del Curso</h3>
        <p><strong>Nombre:</strong> {curso.nombre}</p>
        <p><strong>Descripción:</strong> {curso.descripcion}</p>
        <p><strong>Duración:</strong> {curso.duracion}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Estudiantes Inscritos:</strong> {curso.estudiantes}</p>
        </CardContent>
      </Card>
      <div>
        <h3 className="text-lg font-semibold mb-2">Materiales del Curso</h3>
        <div className="flex flex-wrap gap-2">
          {curso.materiales.map((material, index) => (
            <Badge key={index} variant="secondary">{material}</Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

