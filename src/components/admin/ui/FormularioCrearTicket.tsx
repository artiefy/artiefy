"use client"

import { useState } from "react"
import { Button } from "~/components/admin/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/admin/ui/select"
import { Textarea } from "~/components/admin/ui/textarea"
import { Label } from "~/components/admin/ui/label"
import { Input } from "~/components/admin/ui/input"
import { Checkbox } from "~/components/admin/ui/checkbox"
import type { Ticket } from "./SistemaDeSoporte"


interface FormularioCrearTicketProps {
  onCerrarAction: () => void
  onEnviarAction: (nuevoTicket: Omit<Ticket, "id" | "fecha" | "fechaCreacion">) => void
  categoriasDisponibles: string[]
}

export const FormularioCrearTicket = ({ onCerrarAction, onEnviarAction, categoriasDisponibles }: FormularioCrearTicketProps) => {
  const [nuevoTicket, setNuevoTicket] = useState<Omit<Ticket, "id" | "fecha" | "fechaCreacion">>({
    titulo: "",
    estado: "pendiente",
    asignadoA: null,
    prioridad: "Media",
    descripcion: "",
    categorias: [],
  })

  const handleChange = (campo: keyof Omit<Ticket, "id" | "fecha" | "fechaCreacion">, valor: string) => {
    setNuevoTicket({ ...nuevoTicket, [campo]: valor })
  }

  const handleSubmit = () => {
    onEnviarAction(nuevoTicket)
    onCerrarAction()
  }

  return (
    <div className="grid gap-4 py-4 text-white">
      <div>
        <Label htmlFor="titulo">Título</Label>
        <Input id="titulo" value={nuevoTicket.titulo} onChange={(e) => handleChange("titulo", e.target.value)} />
      </div>
      <div>
        <Label htmlFor="estado">Estado</Label>
        <Select value={nuevoTicket.estado} onValueChange={(valor) => handleChange("estado", valor as Ticket["estado"])}>
          <SelectTrigger id="estado">
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="prioridad">Prioridad</Label>
        <Select
          value={nuevoTicket.prioridad}
          onValueChange={(valor) => handleChange("prioridad", valor as Ticket["prioridad"])}
        >
          <SelectTrigger id="prioridad">
            <SelectValue placeholder="Seleccionar prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Baja">Baja</SelectItem>
            <SelectItem value="Media">Media</SelectItem>
            <SelectItem value="Alta">Alta</SelectItem>
            <SelectItem value="Crítica">Crítica</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={nuevoTicket.descripcion}
          onChange={(e) => handleChange("descripcion", e.target.value)}
          rows={4}
        />
      </div>
      <div className="space-y-2 mb-2 ">
        <Label>Categorías</Label>
        <div className="grid grid-cols-2 gap-2 mt-2 ">
          {categoriasDisponibles.map((categoria) => (
            <div className="flex items-center space-x-2 " key={categoria}>
              <Checkbox
                id={`nueva-categoria-${categoria}`}
                checked={nuevoTicket.categorias.includes(categoria)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setNuevoTicket({ ...nuevoTicket, categorias: [...nuevoTicket.categorias, categoria] })
                  } else {
                    setNuevoTicket({
                      ...nuevoTicket,
                      categorias: nuevoTicket.categorias.filter((cat) => cat !== categoria),
                    })
                  }
                }}
              />
              <Label htmlFor={`nueva-categoria-${categoria}`}>{categoria}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-2 ">
        <Button onClick={onCerrarAction} variant="outline">
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>Crear Ticket</Button>
      </div>
    </div>
  )
}

