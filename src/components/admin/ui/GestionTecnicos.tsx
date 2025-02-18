"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/admin/ui/dialog"
import { Button } from "~/components/admin/ui/button"
import { Input } from "~/components/admin/ui/input"
import { Label } from "~/components/admin/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/admin/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/admin/ui/card"
import { ScrollArea } from "~/components/admin/ui/scroll-area"
import { Checkbox } from "~/components/admin/ui/checkbox"
import type React from "react"

interface Tecnico {
  id: string
  nombre: string
  apellido: string
  cedula: string
  correo: string
  rol: "tecnico" | "admin" | "superadmin"
  ticketsAsignados: number
  etiquetasAsignadas: string[]
}

interface GestionTecnicosProps {
  tecnicos: Tecnico[]
  setTecnicosAction: React.Dispatch<React.SetStateAction<Tecnico[]>>
  categoriasDisponibles: string[]
}

export const GestionTecnicos = ({ tecnicos, setTecnicosAction, categoriasDisponibles }: GestionTecnicosProps) => {
  const [estaAbierto, setEstaAbierto] = useState(false)
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<Tecnico | null>(null)

  const actualizarTecnico = (tecnicoActualizado: Tecnico) => {
    setTecnicosAction((prevTecnicos) => prevTecnicos.map((t) => (t.id === tecnicoActualizado.id ? tecnicoActualizado : t)))
    setTecnicoSeleccionado(null)
  }

  return (
    <>
      <Button onClick={() => setEstaAbierto(true)} className="mt-4">
        Gestionar Técnicos
      </Button>
      <Dialog open={estaAbierto} onOpenChange={setEstaAbierto}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestión de Técnicos</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Técnicos</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {tecnicos.map((tecnico) => (
                    <div
                      key={tecnico.id}
                      className="flex items-center justify-between py-2 border-b last:border-b-0 cursor-pointer hover:bg-accent"
                      onClick={() => setTecnicoSeleccionado(tecnico)}
                    >
                      <div>
                        <p className="font-semibold">{`${tecnico.nombre} ${tecnico.apellido}`}</p>
                        <p className="text-sm text-gray-500">{tecnico.correo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{tecnico.rol}</p>
                        <p className="text-sm text-gray-500">Tickets: {tecnico.ticketsAsignados}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
            {tecnicoSeleccionado && (
              <Card>
                <CardHeader>
                  <CardTitle>Editar Técnico</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      actualizarTecnico(tecnicoSeleccionado)
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        value={tecnicoSeleccionado.nombre}
                        onChange={(e) => setTecnicoSeleccionado({ ...tecnicoSeleccionado, nombre: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="apellido">Apellido</Label>
                      <Input
                        id="apellido"
                        value={tecnicoSeleccionado.apellido}
                        onChange={(e) => setTecnicoSeleccionado({ ...tecnicoSeleccionado, apellido: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="correo">Correo Electrónico</Label>
                      <Input
                        id="correo"
                        type="email"
                        value={tecnicoSeleccionado.correo}
                        onChange={(e) => setTecnicoSeleccionado({ ...tecnicoSeleccionado, correo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rol">Rol</Label>
                      <Select
                        value={tecnicoSeleccionado.rol}
                        onValueChange={(valor) =>
                          setTecnicoSeleccionado({
                            ...tecnicoSeleccionado,
                            rol: valor as Tecnico["rol"],
                          })
                        }
                      >
                        <SelectTrigger id="rol">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Etiquetas Asignadas</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {categoriasDisponibles.map((categoria) => (
                          <div className="flex items-center space-x-2" key={categoria}>
                            <Checkbox
                              id={`etiqueta-${categoria}`}
                              checked={tecnicoSeleccionado.etiquetasAsignadas.includes(categoria)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTecnicoSeleccionado({
                                    ...tecnicoSeleccionado,
                                    etiquetasAsignadas: [...tecnicoSeleccionado.etiquetasAsignadas, categoria],
                                  })
                                } else {
                                  setTecnicoSeleccionado({
                                    ...tecnicoSeleccionado,
                                    etiquetasAsignadas: tecnicoSeleccionado.etiquetasAsignadas.filter(
                                      (etiqueta) => etiqueta !== categoria,
                                    ),
                                  })
                                }
                              }}
                            />
                            <Label htmlFor={`etiqueta-${categoria}`}>{categoria}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button type="submit">Guardar Cambios</Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

