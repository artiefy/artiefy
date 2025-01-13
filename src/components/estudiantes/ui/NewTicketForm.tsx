import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Label } from "~/components/ui/label"
import { ImageUpload } from "~/components/ui/ImageUpload"

type NewTicket = {
    estudiante: string;
    asunto: string;
    descripcion: string;
    imagen?: File;
  }
  
  type NewTicketFormProps = {
    onSubmit: (ticket: NewTicket) => void;
  }
  
  export function NewTicketForm({ onSubmit }: NewTicketFormProps) {
    const [newTicket, setNewTicket] = useState<NewTicket>({
      estudiante: '',
      asunto: '',
      descripcion: '',
    })
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setNewTicket({ ...newTicket, [name]: value })
    }
  
    const handleImageUpload = (file: File) => {
      setNewTicket({ ...newTicket, imagen: file })
    }
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(newTicket)
      setNewTicket({ estudiante: '', asunto: '', descripcion: '' })
    }
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="estudiante" className="text-foreground">Estudiante</Label>
          <Input 
            id="estudiante" 
            name="estudiante" 
            value={newTicket.estudiante} 
            onChange={handleChange} 
            required 
            className="bg-background text-foreground border-input"
          />
        </div>
        <div>
          <Label htmlFor="asunto" className="text-foreground">Asunto</Label>
          <Input 
            id="asunto" 
            name="asunto" 
            value={newTicket.asunto} 
            onChange={handleChange} 
            required 
            className="bg-background text-foreground border-input"
          />
        </div>
        <div>
          <Label htmlFor="descripcion" className="text-foreground">Descripción</Label>
          <Textarea 
            id="descripcion" 
            name="descripcion" 
            value={newTicket.descripcion} 
            onChange={handleChange} 
            required 
            className="bg-background text-foreground border-input"
          />
        </div>
        <div>
          <Label className="text-foreground">Imagen del problema (opcional)</Label>
          <ImageUpload onImageUpload={handleImageUpload} />
        </div>
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Crear Ticket</Button>
      </form>
    )
  }