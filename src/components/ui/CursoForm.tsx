import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"

type CursoFormProps = {
  onSubmit: (curso: any) => void;
  curso?: {
    id: number;
    nombre: string;
    descripcion: string;
    duracion: string;
    materiales: string[];
  };
}

export function CursoForm({ onSubmit, curso }: CursoFormProps) {
  const [formData, setFormData] = useState({
    nombre: curso?.nombre || '',
    descripcion: curso?.descripcion || '',
    duracion: curso?.duracion || '',
    materiales: curso?.materiales.join(', ') || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const materialesArray = formData.materiales.split(',').map(material => material.trim())
    onSubmit(curso ? { ...formData, id: curso.id, materiales: materialesArray } : { ...formData, materiales: materialesArray })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nombre">Nombre del Curso</Label>
        <Input
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="duracion">Duración</Label>
        <Input
          id="duracion"
          name="duracion"
          value={formData.duracion}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="materiales">Materiales (separados por comas)</Label>
        <Textarea
          id="materiales"
          name="materiales"
          value={formData.materiales}
          onChange={handleChange}
          required
        />
      </div>
      <Button type="submit">{curso ? 'Actualizar' : 'Agregar'} Curso</Button>
    </form>
  )
}

