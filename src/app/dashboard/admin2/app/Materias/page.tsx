"use client"

import { useState } from "react"
import { ClipboardList, Users, Clock, Search, Pencil, Eye, Trash2, Download } from "lucide-react"
import { Button } from "~/components/admin/ui/button"
import { Card } from "~/components/admin/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/admin/ui/dialog"
import { Input } from "~/components/admin/ui/input"
import { MateriaForm } from "~/components/admin/ui/Materiaform"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/admin/ui/table"
import { VerMateria } from "~/components/admin/ui/VerMateria"


interface Materia {   
  id: number
  nombre: string
  codigo: string
  descripcion: string
  duracion: string
  profesor: string
  estado: "Activa" | "Inactiva"
}

export default function Materias() {
  const [materias, setMaterias] = useState<Materia[]>([
    {
      id: 1,
      nombre: "Programación Avanzada",
      codigo: "CS301",
      descripcion: "Curso de estructuras avanzadas.",
      duracion: "4 meses",
      profesor: "Dr. Juan Pérez",
      estado: "Activa",
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleAddMateria = (nuevaMateria: Omit<Materia, "id">) => {
    const newId = materias.length + 1
    setMaterias((prevMaterias) => [...prevMaterias, { ...nuevaMateria, id: newId }])
    toast({
      title: "Materia creada",
      description: "La materia ha sido creada exitosamente.",
    })
  }

  const handleEditMateria = (editedMateria: Omit<Materia, "id">) => {
    if (!selectedMateria) return

    setMaterias((prevMaterias) =>
      prevMaterias.map((materia) =>
        materia.id === selectedMateria.id ? { ...editedMateria, id: selectedMateria.id } : materia,
      ),
    )
    setIsEditDialogOpen(false)
    toast({
      title: "Materia actualizada",
      description: "La materia ha sido actualizada exitosamente.",
    })
  }

  const handleDeleteMateria = (id: number) => {
    setMaterias((prevMaterias) => prevMaterias.filter((materia) => materia.id !== id))
    setIsDeleteDialogOpen(false)
    toast({
      title: "Materia eliminada",
      description: "La materia ha sido eliminada exitosamente.",
    })
  }

  const filteredMaterias = materias.filter(
    (materia) =>
      materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      materia.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      materia.profesor.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const exportToCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        ["Nombre", "Código", "Descripción", "Duración", "Profesor", "Estado"].join(","),
        ...materias.map((materia) =>
          [
            materia.nombre,
            materia.codigo,
            materia.descripcion,
            materia.duracion,
            materia.profesor,
            materia.estado,
          ].join(","),
        ),
      ].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "materias.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen p-6 text-white">
      <h2 className="mb-8 text-2xl font-semibold">Gestión de Materias</h2>

      <div className="grid gap-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Materias</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{materias.length}</h3>
              </div>
              <ClipboardList className="size-8 text-cyan-400" />
            </div>
          </Card>
          <Card className="bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Materias Activas</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">
                  {materias.filter((m) => m.estado === "Activa").length}
                </h3>
              </div>
              <Users className="size-8 text-cyan-400" />
            </div>
          </Card>
          <Card className="bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Duración Promedio</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">4 meses</h3>
              </div>
              <Clock className="size-8 text-cyan-400" />
            </div>
          </Card>
        </div>

        {/* Buscador y Acciones */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar materias..."
              className="w-full border-0 bg-white pl-10 text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 text-white hover:bg-cyan-600">Crear Materia</Button>
              </DialogTrigger>
              <DialogContent className="bg-white text-gray-900">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Materia</DialogTitle>
                </DialogHeader>
                <MateriaForm onSubmitAction={handleAddMateria} />
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="border-cyan-500 text-cyan-500 hover:bg-cyan-50" onClick={exportToCSV}>
              <Download className="mr-2 size-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Tabla de Materias */}
        <Card className="overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterias.map((materia) => (
                <TableRow key={materia.id}>
                  <TableCell>{materia.nombre}</TableCell>
                  <TableCell>{materia.codigo}</TableCell>
                  <TableCell>{materia.profesor}</TableCell>
                  <TableCell>{materia.duracion}</TableCell>
                  <TableCell>{materia.estado}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="text-cyan-500 hover:bg-cyan-50"
                        onClick={() => {
                          setSelectedMateria(materia)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Pencil className="mr-2 size-4" /> Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-cyan-500 hover:bg-cyan-50"
                        onClick={() => {
                          setSelectedMateria(materia)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="mr-2 size-4" /> Ver
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => {
                          setSelectedMateria(materia)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 size-4" /> Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Editar Materia</DialogTitle>
          </DialogHeader>
          {selectedMateria && <MateriaForm initialData={selectedMateria} onSubmitAction={handleEditMateria} />}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Ver Materia</DialogTitle>
          </DialogHeader>
          {selectedMateria && <VerMateria materia={selectedMateria} />}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Eliminar Materia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>¿Estás seguro de que deseas eliminar esta materia?</p>
            <p className="font-medium">
              {selectedMateria?.nombre} ({selectedMateria?.codigo})
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => selectedMateria && handleDeleteMateria(selectedMateria.id)}>
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
function toast({ title, description }: { title: string; description: string }) {
    const toastContainer = document.createElement("div")
    toastContainer.className = "fixed bottom-4 right-4 z-50 flex flex-col gap-2"

    const toastElement = document.createElement("div")
    toastElement.className = "bg-gray-800 text-white p-4 rounded shadow-lg"
    toastElement.innerHTML = `
        <strong class="block text-lg">${title}</strong>
        <span class="block text-sm">${description}</span>
    `

    toastContainer.appendChild(toastElement)
    document.body.appendChild(toastContainer)

    setTimeout(() => {
        toastContainer.remove()
    }, 3000)
}
// Removed duplicate toast function implementation

