import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/admin/ui/avatar"
import { Input } from "~/components/admin/ui/input"
import { ScrollArea } from "~/components/admin/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/admin/ui/tabs"
import { Search } from "lucide-react"
import type { Contacto, Conversacion } from "~/types/chat"

interface ContactListProps {
  mostrarSeleccionContactos: boolean
  busqueda: string
  setBusqueda: (busqueda: string) => void
  iniciarConversacion: (contacto: Contacto) => void
  contactos: Contacto[]
  conversaciones: Conversacion[]
  setConversacionActiva: (conversacion: Conversacion) => void
}

export const ContactList = ({
  mostrarSeleccionContactos,
  busqueda,
  setBusqueda,
  iniciarConversacion,
  contactos,
  conversaciones,
  setConversacionActiva,
}: ContactListProps) => {
  const [tabActiva, setTabActiva] = useState<"recientes" | "contactos">("recientes")

  const contactosFiltrados = contactos.filter(
    (contacto) =>
      contacto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      contacto.apellido.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const conversacionesFiltradas = conversaciones.filter((conversacion) =>
    conversacion.contacto.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const renderContacto = (contacto: Contacto, esConversacion = false) => (
    <div
      key={contacto.id}
      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded-lg"
      onClick={() => esConversacion 
        ? setConversacionActiva(conversaciones.find((c) => c.contacto.id === contacto.id)!) 
        : iniciarConversacion(contacto)}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={contacto.avatar || "/placeholder.svg"} />
        <AvatarFallback>{contacto.nombre[0]}</AvatarFallback>
      </Avatar>
      <div className="ml-4 flex-1">
        <p className="font-semibold">
          {contacto.nombre} {contacto.apellido}
        </p>
        {esConversacion && (
          <p className="text-sm text-gray-500 truncate">
            {conversaciones.find((c) => c.contacto.id === contacto.id)?.mensajes.slice(-1)[0]?.texto || ""}
          </p>
        )}
      </div>
      {contacto.ticketsPendientes && contacto.ticketsPendientes > 0 && (
        <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
          {contacto.ticketsPendientes}
        </div>
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <Tabs
        value={tabActiva}
        onValueChange={(value) => setTabActiva(value as "recientes" | "contactos")}
        className="flex-1"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recientes">Recientes</TabsTrigger>
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
        </TabsList>
        <TabsContent value="recientes" className="flex-1">
          <ScrollArea className="h-[calc(100vh-200px)]">
            {conversacionesFiltradas.map((conversacion) => renderContacto(conversacion.contacto, true))}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="contactos" className="flex-1">
          <ScrollArea className="h-[calc(100vh-200px)]">
            {contactosFiltrados.map((contacto) => renderContacto(contacto))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

