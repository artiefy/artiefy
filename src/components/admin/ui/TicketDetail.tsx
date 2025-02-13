"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/admin/ui/dialog"
import { Button } from "~/components/admin/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/admin/ui/select"
import { Textarea } from "~/components/admin/ui/textarea"
import { Label } from "~/components/admin/ui/label"
import { Input } from "~/components/admin/ui/input"

interface Ticket {
  id: string
  title: string
  status: "critical" | "pending" | "completed"
  assignedTo: string | null
  priority: "High" | "Medium" | "Low"
  date: string
  description: string
  imageUrl?: string
  createdAt: string
  resolvedAt?: string
}

interface Technician {
  id: string
  name: string
  role: "technician" | "admin" | "superadmin"
  assignedTickets: number
}

interface TicketDetailsProps {
  ticket: Ticket
  onCloseAction: () => void
  onUpdateAction: (ticket: Ticket) => void
  technicians: Technician[]
}




export const TicketDetails = ({ ticket, onCloseAction, onUpdateAction, technicians }: TicketDetailsProps) => {
  const [editedTicket, setEditedTicket] = useState(ticket)

  const handleChange = (field: keyof Ticket, value: string) => {
    setEditedTicket({ ...editedTicket, [field]: value })
  }

  const handleSubmit = () => {
    onUpdateAction(editedTicket)
    onCloseAction()
  }

  const calculateResolutionTime = () => {
    if (!editedTicket.resolvedAt) return "Not resolved yet"
    const created = new Date(editedTicket.createdAt)
    const resolved = new Date(editedTicket.resolvedAt)
    const diff = resolved.getTime() - created.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours} hours and ${minutes} minutes`
  }

  return (
    <Dialog open={true} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-3xl w-full p-4">
        <DialogHeader>
          <DialogTitle>{editedTicket.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-white">
          <div className="grid grid-cols-2 gap-4 text-white">
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={editedTicket.status}
                onValueChange={(value) => handleChange("status", value as Ticket["status"])}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={editedTicket.priority}
                onValueChange={(value) => handleChange("priority", value as Ticket["priority"])}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">Alta</SelectItem>
                  <SelectItem value="Medium">Media</SelectItem>
                  <SelectItem value="Low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="assignedTo">Asignado a</Label>
            <Select value={editedTicket.assignedTo || ""} onValueChange={(value) => handleChange("assignedTo", value)}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.name}>
                    {tech.name} ({tech.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={editedTicket.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="image">Imagen del problema</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    handleChange("imageUrl", reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
            {editedTicket.imageUrl && (
              <img src={editedTicket.imageUrl || "/placeholder.svg"} alt="Problem" className="mt-2 max-w-full h-auto" />
            )}
          </div>
          <div>
            <Label>Tiempo de resolución</Label>
            <p>{calculateResolutionTime()}</p>
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-4 text-white ">
          <Button onClick={onCloseAction} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Guardar cambios</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

