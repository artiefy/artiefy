import { useState } from 'react';
import { Button } from '~/components/admin/ui/button';
import { ImageUpload } from '~/components/admin/ui/ImageUpload';
import { Input } from '~/components/admin/ui/input';
import { Label } from '~/components/admin/ui/label';
import { Textarea } from '~/components/admin/ui/textarea';
import { type LocalTicket } from '~/types/Tickets';

interface NewTicket {
  estudiante: string;
  asunto: string;
  descripcion: string;
  imagen?: string | File; // Cambiado para aceptar ambos tipos
}

interface NewTicketFormProps {
  onSubmit: (ticket: Omit<LocalTicket, 'id' | 'fechaCreacion' | 'estado'> & { imagen?: string | File }) => void;
}

export function NewTicketForm({ onSubmit }: NewTicketFormProps) {
  const [newTicket, setNewTicket] = useState<NewTicket>({
    estudiante: '',
    asunto: '',
    descripcion: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewTicket({ ...newTicket, [name]: value });
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewTicket({ ...newTicket, imagen: reader.result as string }); // Convertimos el archivo a base64
    };
    reader.readAsDataURL(file); // Leemos el archivo como base64
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(newTicket as unknown as Omit<LocalTicket, 'id' | 'fechaCreacion' | 'estado'> & { imagen?: string | File });
    setNewTicket({ estudiante: '', asunto: '', descripcion: '', imagen: undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="estudiante" className="text-foreground">
          Estudiante
        </Label>
        <Input
          id="estudiante"
          name="estudiante"
          value={newTicket.estudiante}
          onChange={handleChange}
          required
          className="border-input bg-background text-foreground"
        />
      </div>
      <div>
        <Label htmlFor="asunto" className="text-foreground">
          Asunto
        </Label>
        <Input
          id="asunto"
          name="asunto"
          value={newTicket.asunto}
          onChange={handleChange}
          required
          className="border-input bg-background text-foreground"
        />
      </div>
      <div>
        <Label htmlFor="descripcion" className="text-foreground">
          Descripción
        </Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          value={newTicket.descripcion}
          onChange={handleChange}
          required
          className="border-input bg-background text-foreground"
        />
      </div>
      <div>
        <Label className="text-foreground">
          Imagen del problema (opcional)
        </Label>
        <ImageUpload onImageUploadAction={handleImageUpload} onImageUpload={function (): void {
          throw new Error('Function not implemented.');
        } } />
      </div>
      <Button
        type="submit"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Crear Ticket
      </Button>
    </form>
  );
}
