"use client"

import { useState } from "react"
import { Button } from "~/components/admin/ui/button"
import { Input } from "~/components/admin/ui/input"
import { Textarea } from "~/components/admin/ui/textarea"
import { Select } from "~/components/admin/ui/select"
import { Label } from "~/components/admin/ui/label"

interface Materia {
  id: number
  nombre: string
  codigo: string
  descripcion: string
  duracion: string
  profesor: string
  estado: "Activa" | "Inactiva"
}


interface MateriaFormProps {
  onSubmitAction: (materia: Omit<Materia, "id">) => void
  initialData?: Materia
}

export function MateriaForm({ onSubmitAction, initialData }: MateriaFormProps) {
  const [formData, setFormData] = useState<Omit<Materia, "id">>({
    nombre: initialData?.nombre || "",
    codigo: initialData?.codigo || "",
    descripcion: initialData?.descripcion || "",
    duracion: initialData?.duracion || "",
    profesor: initialData?.profesor || "",
    estado: initialData?.estado || "Activa",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmitAction(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="codigo">Código</Label>
        <Input
          id="codigo"
          value={formData.codigo}
          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duracion">Duración</Label>
        <Input
          id="duracion"
          value={formData.duracion}
          onChange={(e) => setFormData({ ...formData, duracion: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="profesor">Profesor</Label>
        <Input
          id="profesor"
          value={formData.profesor}
          onChange={(e) => setFormData({ ...formData, profesor: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estado">Estado</Label>
        <Select
          value={formData.estado}
          onValueChange={(value) => setFormData({ ...formData, estado: value as "Activa" | "Inactiva" })}
        >
          <option value="Activa">Activa</option>
          <option value="Inactiva">Inactiva</option>
        </Select>
      </div>

      <Button type="submit" className="w-full">
        {initialData ? "Actualizar Materia" : "Crear Materia"}
      </Button>
    </form>
  )
}

