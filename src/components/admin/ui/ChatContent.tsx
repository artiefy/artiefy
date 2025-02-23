import { CardContent } from "~/components/admin/ui/card"
import { ContactList } from "~/components/admin/ui/ContactList"
import { MessageList } from "~/components/admin/ui/MessageList"
import type { Conversacion, Mensaje, Contacto } from "~/types/chat"

interface ChatContentProps {
  conversacionActiva: Conversacion | null
  mostrarSeleccionContactos: boolean
  busqueda: string
  setBusqueda: (busqueda: string) => void
  iniciarConversacion: (contacto: Contacto) => void
  enviarMensaje: (
    texto: string,
    imagen?: string,
    archivo?: { nombre: string; tipo: string; url: string },
    audio?: string,
  ) => void
  escribiendo: boolean
  mensajeAResponder: Mensaje | null
  setMensajeAResponder: (mensaje: Mensaje | null) => void
  agregarReaccion: (mensajeId: string, emoji: string) => void
  editarMensaje: (mensajeId: string, nuevoTexto: string) => void
  eliminarMensaje: (mensajeId: string) => void
  contactos: Contacto[]
  conversaciones: Conversacion[]
  setConversacionActiva: (conversacion: Conversacion) => void
}

export const ChatContent = ({
  conversacionActiva,
  mostrarSeleccionContactos,
  busqueda,
  setBusqueda,
  iniciarConversacion,
  enviarMensaje,
  escribiendo,
  mensajeAResponder,
  setMensajeAResponder,
  agregarReaccion,
  editarMensaje,
  eliminarMensaje,
  contactos,
  conversaciones,
  setConversacionActiva,
}: ChatContentProps) => {
  return (
    <CardContent className="flex-1 p-0">
      {conversacionActiva && !mostrarSeleccionContactos ? (
        <MessageList
          conversacionActiva={conversacionActiva}
          enviarMensajeAction={enviarMensaje}
          escribiendo={escribiendo}
          mensajeAResponder={mensajeAResponder}
          setMensajeAResponderAction={setMensajeAResponder}
          agregarReaccionAction={agregarReaccion}
          editarMensajeAction={editarMensaje}
          eliminarMensajeAction={eliminarMensaje}
        />
      ) : (
        <ContactList
          mostrarSeleccionContactos={mostrarSeleccionContactos}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          iniciarConversacion={iniciarConversacion}
          contactos={contactos}
          conversaciones={conversaciones}
          setConversacionActiva={setConversacionActiva}
        />
      )}
    </CardContent>
  )
}

