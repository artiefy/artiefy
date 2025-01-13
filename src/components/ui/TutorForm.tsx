import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"

type TutorFormProps = {
  onSubmit: (tutor: { id: number; nombre: string; email: string; especialidad: string; cursos: string[] }) => void;
  tutor?: {
    id: number;
    nombre: string;
    email: string;
    especialidad: string;
    cursos: string[];
  };
}

export function TutorForm({ onSubmit, tutor }: TutorFormProps) {
  const [formData, setFormData] = useState({
    nombre: tutor?.nombre ?? '',
    email: tutor?.email ?? '',
    especialidad: tutor?.especialidad ?? '',
    cursos: tutor?.cursos.join(', ') ?? '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cursosArray = formData.cursos.split(',').map(curso => curso.trim())
    onSubmit({ ...formData, id: tutor?.id ?? Date.now(), cursos: cursosArray })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="especialidad">Especialidad</Label>
        <Input
          id="especialidad"
          name="especialidad"
          value={formData.especialidad}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="cursos">Cursos (separados por comas)</Label>
        <Textarea
          id="cursos"
          name="cursos"
          value={formData.cursos}
          onChange={handleChange}
          required
        />
      </div>
      <Button type="submit">{tutor ? 'Actualizar' : 'Agregar'} Tutor</Button>
    </form>
  )
}

