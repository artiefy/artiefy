import { Progress } from "~/components/ui/progress"

type Estudiante = {
  id: number;
  nombre: string;
  email: string;
  fechaNacimiento: string;
  cursos: { nombre: string; progreso: number }[];
}

type EstudianteDetalleProps = {
  estudiante: Estudiante;
}

export function EstudianteDetalle({ estudiante }: EstudianteDetalleProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Información Personal</h3>
        <p><strong>Nombre:</strong> {estudiante.nombre}</p>
        <p><strong>Email:</strong> {estudiante.email}</p>
        <p><strong>Fecha de Nacimiento:</strong> {estudiante.fechaNacimiento}</p>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Progreso en Cursos</h3>
        {estudiante.cursos.map((curso, index) => (
          <div key={index} className="mt-2">
            <p>{curso.nombre}</p>
            <Progress value={curso.progreso} className="w-full" />
            <p className="text-sm text-right">{curso.progreso}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

