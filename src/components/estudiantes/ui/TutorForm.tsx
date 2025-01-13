import { useState } from 'react';
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import type { Tutor } from '~/types/tutor'

interface TutorFormProps {
  onSubmit: (tutor: Omit<Tutor, 'id' | 'estudiantes' | 'calificacion'>) => void;
  tutor?: Tutor;
}

const TutorForm: React.FC<TutorFormProps> = ({ onSubmit, tutor }) => {
  const [formData, setFormData] = useState<Omit<Tutor, 'id' | 'estudiantes' | 'calificacion'>>({
    nombre: tutor?.nombre ?? '',
    email: tutor?.email ?? '',
    especialidad: tutor?.especialidad ?? '',
    cursos: tutor?.cursos ?? [],
    name: tutor?.name ?? '',
    rating: tutor?.rating ?? 0,
    subject: tutor?.subject ?? '',
    experience: tutor?.experience ?? 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="nombre">Nombre:</Label>
        <Input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="email">Email:</Label>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="especialidad">Especialidad:</Label>
        <Input
          type="text"
          id="especialidad"
          name="especialidad"
          value={formData.especialidad}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="cursos">Cursos:</Label>
        {/* Add your cursos input here */}
        <Textarea
          id="cursos"
          name="cursos"
          value={formData.cursos.join(', ')}
          onChange={handleChange}
        />
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
};

export default TutorForm;

