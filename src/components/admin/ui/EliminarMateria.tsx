import { Button } from "~/components/admin/ui/button"

interface Materia {
  id: number
  nombre: string
  codigo: string
}

interface EliminarMateriaProps {
  materia: Materia
  onDelete: (id: number) => void
}

export function EliminarMateria({ materia, onDelete }: EliminarMateriaProps) {
  const handleDelete = () => {
    if (confirm(`¿Estás seguro de que deseas eliminar la materia "${materia.nombre}"?`)) {
      onDelete(materia.id)
    }
  }

  return (
    <div className="space-y-4">
      <p>¿Estás seguro de que deseas eliminar la siguiente materia?</p>
      <p>
        <strong>{materia.nombre}</strong> ({materia.codigo})
      </p>
      <Button onClick={handleDelete} className="w-full bg-red-500 text-white hover:bg-red-600">
        Confirmar Eliminación
      </Button>
    </div>
  )
}

