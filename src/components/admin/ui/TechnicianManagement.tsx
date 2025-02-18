"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/admin/ui/dialog"
import { Button } from "~/components/admin/ui/button"
import { Input } from "~/components/admin/ui/input"
import { Label } from "~/components/admin/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/admin/ui/select"
import type React from "react" // Added import for React

interface Technician {
  id: string
  name: string
  role: "technician" | "admin" | "superadmin"
  assignedTickets: number
}

interface TechnicianManagementProps {
  technicians: Technician[]
  setTechniciansAction: React.Dispatch<React.SetStateAction<Technician[]>>
}

export const TechnicianManagement = ({ technicians, setTechniciansAction }: TechnicianManagementProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [newTechnician, setNewTechnician] = useState<Omit<Technician, "id" | "assignedTickets">>({
    name: "",
    role: "technician",
  })

  const addTechnician = () => {
    setTechniciansAction([
      ...technicians,
      {
        ...newTechnician,
        id: `TECH-${technicians.length + 1}`,
        assignedTickets: 0,
      },
    ])
    setIsOpen(false)
    setNewTechnician({ name: "", role: "technician" })
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="mt-4 mb-4 text-white">
        Gestionar Técnicos
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Gestión de Técnicos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {technicians.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between text-white">
                <span>
                  {tech.name} ({tech.role})
                </span>
                <span>Tickets asignados: {tech.assignedTickets}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-background text-white">
              <h3 className="text-lg font-semibold mb-2 ">Agregar Nuevo Técnico</h3>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newTechnician.name}
                  onChange={(e) => setNewTechnician({ ...newTechnician, name: e.target.value })}
                />
              </div>
              <div className="space-y-2 mt-2 ">
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={newTechnician.role}
                  onValueChange={(value) => setNewTechnician({ ...newTechnician, role: value as Technician["role"] })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technician">Técnico</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addTechnician} className="mt-4">
                Agregar Técnico
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

