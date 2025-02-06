"use client"

import { useState } from "react"
import { ClipboardList, Users, Clock, Search, Eye, Download } from "lucide-react"
import { Button } from "~/components/admin/ui/button"
import { Card } from "~/components/admin/ui/card"
import { Dialog, DialogContent } from "~/components/admin/ui/dialog"
import { Input } from "~/components/admin/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/admin/ui/table"
import { WhatsAppStyleModal } from "~/components/admin/ui/WhatsAppStyleModal"

interface Interaction {
  id: number
  from: string
  to: string
  messages: { sender: string; content: string; timestamp: Date }[]
  subject: string
  lastUpdate: Date
}

export default function InteractionHistoryViewer() {
  const [interactions, setInteractions] = useState<Interaction[]>([
    {
      id: 1,
      from: "profesor@ejemplo.com",
      to: "estudiante@ejemplo.com",
      subject: "Consulta sobre tarea de matemáticas",
      lastUpdate: new Date("2023-05-01T11:30:00"),
      messages: [
        {
          sender: "profesor@ejemplo.com",
          content: "Hola, ¿cómo vas con la tarea de matemáticas?",
          timestamp: new Date("2023-05-01T10:00:00"),
        },
        {
          sender: "estudiante@ejemplo.com",
          content: "Hola profesor, tengo algunas dudas sobre el ejercicio 3.",
          timestamp: new Date("2023-05-01T10:05:00"),
        },
        {
          sender: "profesor@ejemplo.com",
          content: "Claro, dime qué parte no entiendes.",
          timestamp: new Date("2023-05-01T10:10:00"),
        },
        {
          sender: "estudiante@ejemplo.com",
          content: "No estoy seguro de cómo aplicar la fórmula en este caso.",
          timestamp: new Date("2023-05-01T10:15:00"),
        },
        {
          sender: "profesor@ejemplo.com",
          content: "Entiendo. Vamos a revisarlo paso a paso. Primero...",
          timestamp: new Date("2023-05-01T10:20:00"),
        },
      ],
    },
    {
      id: 2,
      from: "estudiante2@ejemplo.com",
      to: "profesor@ejemplo.com",
      subject: "Entrega de proyecto final",
      lastUpdate: new Date("2023-05-02T15:45:00"),
      messages: [
        {
          sender: "estudiante2@ejemplo.com",
          content: "Profesor, adjunto mi proyecto final para revisión.",
          timestamp: new Date("2023-05-02T15:30:00"),
        },
        {
          sender: "profesor@ejemplo.com",
          content: "Gracias por tu entrega. Lo revisaré y te daré feedback pronto.",
          timestamp: new Date("2023-05-02T15:45:00"),
        },
      ],
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const filteredInteractions = interactions.filter(
    (interaction) =>
      interaction.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interaction.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const exportToCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        ["De", "Para", "Asunto", "Última Actualización", "Mensajes"].join(","),
        ...interactions.map((interaction) =>
          [
            interaction.from,
            interaction.to,
            interaction.subject,
            interaction.lastUpdate.toLocaleString(),
            interaction.messages.length,
          ].join(","),
        ),
      ].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "interacciones.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen p-6 text-white">
      <h2 className="mb-8 text-2xl font-semibold">Historial de Interacciones</h2>

      <div className="grid gap-6">
        {/* Métricas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Interacciones</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">{interactions.length}</h3>
              </div>
              <ClipboardList className="size-8 text-cyan-400" />
            </div>
            <button className="mt-4 text-sm text-cyan-500 hover:text-cyan-600">Ver detalles →</button>
          </Card>

          <Card className="bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuarios Únicos</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">
                  {new Set([...interactions.map((i) => i.from), ...interactions.map((i) => i.to)]).size}
                </h3>
              </div>
              <Users className="size-8 text-cyan-400" />
            </div>
            <button className="mt-4 text-sm text-cyan-500 hover:text-cyan-600">Ver detalles →</button>
          </Card>

          <Card className="bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tiempo Promedio de Respuesta</p>
                <h3 className="mt-1 text-3xl font-bold text-gray-900">30 min</h3>
              </div>
              <Clock className="size-8 text-cyan-400" />
            </div>
            <button className="mt-4 text-sm text-cyan-500 hover:text-cyan-600">Ver detalles →</button>
          </Card>
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 items-center justify-between gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          <Button
            variant="outline"
            className="h-12 items-center border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:text-white"
          >
            Gestionar Interacciones
          </Button>
          <Button
            variant="outline"
            className="h-12 items-center border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:text-white"
          >
            Ver Usuarios
          </Button>
        </div>

        {/* Buscador y Exportar */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar interacciones..."
              className="w-full border-0 bg-white pl-10 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={exportToCSV}
            className="w-full bg-cyan-500 text-white hover:bg-cyan-600 sm:ml-4 sm:mt-0 sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Tabla */}
        <Card className="overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                <TableHead className="text-gray-600">Asunto</TableHead>
                <TableHead className="text-gray-600">De</TableHead>
                <TableHead className="text-gray-600">Para</TableHead>
                <TableHead className="text-gray-600">Última Actualización</TableHead>
                <TableHead className="text-gray-600">Mensajes</TableHead>
                <TableHead className="text-gray-600">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInteractions.map((interaction) => (
                <TableRow key={interaction.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="text-gray-900">{interaction.subject}</TableCell>
                  <TableCell className="text-gray-900">{interaction.from}</TableCell>
                  <TableCell className="text-gray-900">{interaction.to}</TableCell>
                  <TableCell className="text-gray-900">{interaction.lastUpdate.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-900">{interaction.messages.length}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cyan-500 hover:bg-cyan-50 hover:text-cyan-600"
                      onClick={() => {
                        setSelectedInteraction(interaction)
                        setIsViewDialogOpen(true)
                      }}
                    >
                      <Eye className="mr-2 size-4" />
                      Ver Conversación
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Modal estilo WhatsApp */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md p-0">
          {selectedInteraction && (
            <WhatsAppStyleModal interaction={selectedInteraction} onClose={() => setIsViewDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

