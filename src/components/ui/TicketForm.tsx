import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"

type TicketFormProps = {
  onSubmit: (ticket: { id: number; asunto: string; estudiante: string; estado: 'Abierto' | 'En Progreso' | 'Resuelto'; prioridad: 'Baja' | 'Media' | 'Alta'; }) => void;
  ticket?: {
    id: number;
    asunto: string;
    estudiante: string;
    estado: 'Abierto' | 'En Progreso' | 'Resuelto';
    prioridad: 'Baja' | 'Media' | 'Alta';
  };
}

export function TicketForm({ onSubmit, ticket }: TicketFormProps) {
  const [formData, setFormData] = useState({
    asunto: ticket?.asunto ?? '',
    estudiante: ticket?.estudiante ?? '',
    estado: ticket?.estado ?? 'Abierto',
    prioridad: ticket?.prioridad ?? 'Media',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...formData, id: ticket ? ticket.id : Date.now() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="asunto">Asunto</Label>
        <Input
          id="asunto"
          name="asunto"
          value={formData.asunto}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="estudiante">Estudiante</Label>
        <Input
          id="estudiante"
          name="estudiante"
          value={formData.estudiante}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="estado">Estado</Label>
        <Select name="estado" onValueChange={(value: string) => handleSelectChange('estado', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Abierto">Abierto</SelectItem>
            <SelectItem value="En Progreso">En Progreso</SelectItem>
            <SelectItem value="Resuelto">Resuelto</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="prioridad">Prioridad</Label>
        <Select name="prioridad" onValueChange={(value: string) => handleSelectChange('prioridad', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Baja">Baja</SelectItem>
            <SelectItem value="Media">Media</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">{ticket ? 'Actualizar' : 'Crear'} Ticket</Button>
    </form>
  )
}

