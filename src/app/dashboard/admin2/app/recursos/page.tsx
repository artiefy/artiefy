'use client'

import { BookOpen, Download, FileText, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import ConfirmDialog from '~/components/ui/ConfirmDialog'
import { DashboardMetrics } from '~/components/ui/DashboardMetrics'
import { GenericForm } from '~/components/ui/GenericForm'
import { GenericTable } from '~/components/ui/GenericTable'
import { RecursoViewer } from '~/components/ui/RecursoViewer'
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination"

type Recurso = {
  id: number;
  nombre: string;
  tipo: 'documento' | 'video' | 'enlace' | 'youtube' | 'drive';
  curso: string;
  url: string;
  descargas: number;
}

const ITEMS_PER_PAGE = 10;

export default function Recursos() {
  const [recursos, setRecursos] = useState<Recurso[]>([
    { 
      id: 1, 
      nombre: 'Introducción a la Programación - PDF', 
      tipo: 'documento',
      curso: 'Introducción a la Programación',
      url: 'https://ejemplo.com/intro-programacion.pdf',
      descargas: 120
    },
    { 
      id: 2, 
      nombre: 'Tutorial de Diseño UX/UI', 
      tipo: 'video',
      curso: 'Diseño UX/UI',
      url: 'https://ejemplo.com/tutorial-uxui.mp4',
      descargas: 85
    },
    {
      id: 3,
      nombre: 'Documentación de React',
      tipo: 'enlace',
      curso: 'Desarrollo Web Avanzado',
      url: 'https://reactjs.org/docs/getting-started.html',
      descargas: 200
    },
    {
      id: 4,
      nombre: 'Introducción a Machine Learning - YouTube',
      tipo: 'youtube',
      curso: 'Inteligencia Artificial',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      descargas: 150
    },
    {
      id: 5,
      nombre: 'Presentación de Big Data - Google Drive',
      tipo: 'drive',
      curso: 'Análisis de Datos',
      url: 'https://drive.google.com/file/d/1234567890/preview',
      descargas: 75
    },
  ])

  const [recursoSeleccionado, setRecursoSeleccionado] = useState<Recurso | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filterType, setFilterType] = useState('all')

  const handleAddRecurso = useCallback((nuevoRecurso: Omit<Recurso, 'id' | 'descargas'>) => {
    setRecursos(prev => [...prev, { ...nuevoRecurso, id: prev.length + 1, descargas: 0 }])
  }, [])

  const handleEditRecurso = useCallback((recursoEditado: Recurso) => {
    setRecursos(prev => prev.map(recurso => recurso.id === recursoEditado.id ? recursoEditado : recurso))
    setIsEditDialogOpen(false)
  }, [])

  const handleDeleteRecurso = useCallback((id: number) => {
    setRecursos(prev => prev.filter(recurso => recurso.id !== id))
    setIsDeleteDialogOpen(false)
  }, [])

  const handleViewRecurso = useCallback((recurso: Recurso) => {
    setRecursoSeleccionado(recurso)
    setIsViewerOpen(true)
  }, [])

  const filteredRecursos = useMemo(() => {
    return recursos.filter(recurso => 
      recurso.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterType === 'all' || recurso.tipo === filterType)
    )
  }, [recursos, searchTerm, filterType])

  const paginatedRecursos = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredRecursos.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredRecursos, currentPage])

  const totalPages = Math.ceil(filteredRecursos.length / ITEMS_PER_PAGE)

  const columns = useMemo(() => [
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Tipo', accessor: 'tipo' },
    { header: 'Curso', accessor: 'curso' },
    { header: 'Descargas', accessor: 'descargas' },
  ], [])

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Gestión de Recursos</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardMetrics
          metrics={[
            { title: "Total Recursos", value: recursos.length.toString(), icon: FileText, href: "/recursos" },
            { title: "Cursos con Recursos", value: new Set(recursos.map(r => r.curso)).size.toString(), icon: BookOpen, href: "/cursos" },
            { title: "Total Descargas", value: recursos.reduce((acc, r) => acc + r.descargas, 0).toString(), icon: Download, href: "/analisis" },
          ]}
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="w-full md:w-1/3 relative">
          <Input
            placeholder="Buscar recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-1/4">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="documento">Documento</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="enlace">Enlace</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="drive">Google Drive</SelectItem>
          </SelectContent>
        </Select>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Agregar Recurso</Button>
          </DialogTrigger>
          <DialogContent className="w-full sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Recurso</DialogTitle>
            </DialogHeader>
            <GenericForm
              fields={[
                { name: 'nombre', label: 'Nombre del Recurso', type: 'text' },
                { name: 'tipo', label: 'Tipo de Recurso', type: 'select', options: ['documento', 'video', 'enlace', 'youtube', 'drive'] },
                { name: 'curso', label: 'Curso Asociado', type: 'text' },
                { name: 'url', label: 'URL del Recurso', type: 'text' },
              ]}
              onSubmit={handleAddRecurso}
              submitLabel="Agregar Recurso"
            />
          </DialogContent>
        </Dialog>
      </div>

      <GenericTable
        columns={columns}
        data={paginatedRecursos}
        actions={(recurso: Recurso) => (
          <>
            <Button variant="outline" className="mr-2" onClick={() => handleViewRecurso(recurso)}>Ver</Button>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="mr-2" onClick={() => setIsEditDialogOpen(true)}>Editar</Button>
              </DialogTrigger>
              <DialogContent className="w-full sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Editar Recurso</DialogTitle>
                </DialogHeader>
                <GenericForm
                  fields={[
                    { name: 'nombre', label: 'Nombre del Recurso', type: 'text' },
                    { name: 'tipo', label: 'Tipo de Recurso', type: 'select', options: ['documento', 'video', 'enlace', 'youtube', 'drive'] },
                    { name: 'curso', label: 'Curso Asociado', type: 'text' },
                    { name: 'url', label: 'URL del Recurso', type: 'text' },
                  ]}
                  onSubmit={handleEditRecurso}
                  initialData={recurso}
                  submitLabel="Actualizar Recurso"
                />
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(true)}>Eliminar</Button>
            {isDeleteDialogOpen && (
              <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                message="¿Estás seguro de que quieres eliminar este recurso? Esta acción no se puede deshacer."
                onConfirm={() => handleDeleteRecurso(recurso.id)}
                title="Confirmar eliminación"
                description="Esta acción no se puede deshacer."
              />
            )}
          </>
        )}
      />

      <div className="flex justify-center mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      <RecursoViewer 
        recurso={recursoSeleccionado}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </div>
  )
}

