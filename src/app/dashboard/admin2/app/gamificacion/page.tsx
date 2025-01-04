'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { DashboardMetrics } from '~/components/ui/DashboardMetrics'
import { Award, Users, Star } from 'lucide-react'

export default function Gamificacion() {
  const [insignias, setInsignias] = useState([
    { id: 1, nombre: 'Explorador Novato', descripcion: 'Completar el primer curso', puntos: 50 },
    { id: 2, nombre: 'Maestro del Foro', descripcion: 'Hacer 100 publicaciones útiles', puntos: 200 },
    { id: 3, nombre: 'Estudiante Estrella', descripcion: 'Obtener calificación perfecta en 5 cursos', puntos: 500 },
  ])

  const [newInsignia, setNewInsignia] = useState({ nombre: '', descripcion: '', puntos: 0 })

  const handleAddInsignia = () => {
    setInsignias([...insignias, { id: insignias.length + 1, ...newInsignia }])
    setNewInsignia({ nombre: '', descripcion: '', puntos: 0 })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Gestión de Gamificación</h2>

      <DashboardMetrics
        metrics={[
          { title: "Insignias Otorgadas", value: "789", icon: Award, href: "/gamificacion" },
          { title: "Estudiantes Participantes", value: "1,023", icon: Users, href: "/estudiantes" },
          { title: "Puntos Totales Otorgados", value: "56,789", icon: Star, href: "/analisis" },
        ]}
      />

      <Dialog>
        <DialogTrigger asChild>
          <Button>Crear Nueva Insignia</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Insignia</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={newInsignia.nombre}
                onChange={(e) => setNewInsignia({...newInsignia, nombre: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descripcion" className="text-right">
                Descripción
              </Label>
              <Input
                id="descripcion"
                value={newInsignia.descripcion}
                onChange={(e) => setNewInsignia({...newInsignia, descripcion: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="puntos" className="text-right">
                Puntos
              </Label>
              <Input
                id="puntos"
                type="number"
                value={newInsignia.puntos}
                onChange={(e) => setNewInsignia({...newInsignia, puntos: parseInt(e.target.value)})}
                className="col-span-3"
              />
            </div>
          </div>
          <Button onClick={handleAddInsignia}>Crear Insignia</Button>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Puntos</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {insignias.map((insignia) => (
            <TableRow key={insignia.id}>
              <TableCell>{insignia.id}</TableCell>
              <TableCell>{insignia.nombre}</TableCell>
              <TableCell>{insignia.descripcion}</TableCell>
              <TableCell>{insignia.puntos}</TableCell>
              <TableCell>
                <Button variant="outline" className="mr-2">Editar</Button>
                <Button variant="destructive">Eliminar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

