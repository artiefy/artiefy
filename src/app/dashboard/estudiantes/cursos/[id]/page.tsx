import { useParams } from 'next/navigation'

export default function CoursePage() {
  const { id } = useParams() // Captura el valor dinámico de la URL
  return <div>El ID del curso es: {id}</div>
}
