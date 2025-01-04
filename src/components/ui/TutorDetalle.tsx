import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"

type Tutor = {
  id: number;
  nombre: string;
  email: string;
  especialidad: string;
  cursos: string[];
  estudiantes: number;
  calificacion: number;
}

type TutorDetalleProps = {
  tutor: Tutor;
}

export function TutorDetalle({ tutor }: TutorDetalleProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Información Personal</h3>
        <p><strong>Nombre:</strong> {tutor.nombre}</p>
        <p><strong>Email:</strong> {tutor.email}</p>
        <p><strong>Especialidad:</strong> {tutor.especialidad}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Estudiantes Asignados</p>
            <p className="text-2xl font-bold">{tutor.estudiantes}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Calificación Promedio</p>
            <p className="text-2xl font-bold">{tutor.calificacion.toFixed(1)}</p>
          </div>
        </CardContent>
      </Card>
      <div>
        <h3 className="text-lg font-semibold mb-2">Cursos Impartidos</h3>
        <div className="flex flex-wrap gap-2">
          {tutor.cursos.map((curso, index) => (
            <Badge key={index} variant="secondary">{curso}</Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

