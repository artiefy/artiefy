'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { ImageUpload } from "~/components/ui/ImageUpload"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { Ticket } from '~/types/Tickets'

type TicketDetailProps = {
  ticket: Ticket;
  onUpdateTicket: (ticket: Ticket, newImage?: File) => void;
  onDeleteTicket: () => void;
}

export function TicketDetail({ ticket, onUpdateTicket, onDeleteTicket }: TicketDetailProps) {
  const [editedTicket, setEditedTicket] = useState(ticket)
  const [newImage, setNewImage] = useState<File | undefined>(undefined)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedTicket({ ...editedTicket, [name]: value })
  }

  const handleSelectChange = (value: string) => {
    setEditedTicket({ ...editedTicket, estado: value as Ticket['estado'] })
  }

  const handleImageUpload = (file: File) => {
    setNewImage(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateTicket(editedTicket, newImage)
  }

  return (
    <Card className="bg-background text-foreground">
      <CardHeader>
        <CardTitle>Detalles del Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="estudiante" className="text-foreground">Estudiante</Label>
            <Input id="estudiante" name="estudiante" value={editedTicket.estudiante} onChange={handleChange} className="bg-background text-foreground border-input" />
          </div>
          <div>
            <Label htmlFor="asunto" className="text-foreground">Asunto</Label>
            <Input id="asunto" name="asunto" value={editedTicket.asunto} onChange={handleChange} className="bg-background text-foreground border-input" />
          </div>
          <div>
            <Label htmlFor="descripcion" className="text-foreground">Descripción</Label>
            <Textarea id="descripcion" name="descripcion" value={editedTicket.descripcion} onChange={handleChange} className="bg-background text-foreground border-input" />
          </div>
          <div>
            <Label htmlFor="estado" className="text-foreground">Estado</Label>
            <Select onValueChange={handleSelectChange} defaultValue={editedTicket.estado}>
              <SelectTrigger className="bg-background text-foreground border-input">
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
            <Label className="text-foreground">Imagen del problema</Label>
            <ImageUpload onImageUpload={handleImageUpload} initialImage={editedTicket.imagen} />
          </div>
          <div className="flex justify-between">
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Actualizar Ticket</Button>
            <Button type="button" onClick={onDeleteTicket} variant="destructive">Eliminar Ticket</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

