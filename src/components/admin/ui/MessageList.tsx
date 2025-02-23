"use client"

import { useRef, useEffect } from "react"
import { ScrollArea } from "~/components/admin/ui/scroll-area"
import { Badge } from "~/components/admin/ui/badge"
import { Button } from "~/components/admin/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/admin/ui/popover"
import { Check, CheckCheck, Edit, FileIcon, Reply, Smile, Trash2 } from "lucide-react"
import type { Conversacion, Mensaje } from "~/types/chat"

interface MessageListProps {
  conversacionActiva: Conversacion
  enviarMensajeAction: (
    texto: string,
    imagen?: string,
    archivo?: { nombre: string; tipo: string; url: string },
    audio?: string,
  ) => void
  escribiendo: boolean
  mensajeAResponder: Mensaje | null
  setMensajeAResponderAction: (mensaje: Mensaje | null) => void
  agregarReaccionAction: (mensajeId: string, emoji: string) => void
  editarMensajeAction: (mensajeId: string, nuevoTexto: string) => void
  eliminarMensajeAction: (mensajeId: string) => void
}

const emojis = ["👍", "❤️", "😂", "😮", "😢", "😡"]

export const MessageList = ({
  conversacionActiva,
  escribiendo,
  setMensajeAResponderAction,
  agregarReaccionAction,
  editarMensajeAction,
  eliminarMensajeAction,
}: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [scrollRef.current])

  const formatearFecha = (fecha: Date) => {
    const hoy = new Date()
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)

    if (fecha.toDateString() === hoy.toDateString()) {
      return fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (fecha.toDateString() === ayer.toDateString()) {
      return "Ayer"
    } else {
      return fecha.toLocaleDateString()
    }
  }

  if (!conversacionActiva || !conversacionActiva.mensajes) {
    return (
      <ScrollArea className="flex-1 h-[400px] p-4" ref={scrollRef}>
        <div className="flex items-center justify-center h-full">
          <p>No hay mensajes para mostrar.</p>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="flex-1 h-[400px] p-4" ref={scrollRef}>
      <div className="space-y-4">
        {conversacionActiva.mensajes.map((mensaje, index) => {
          const esNuevaFecha =
            index === 0 ||
            new Date(mensaje.fecha).toDateString() !==
              new Date(conversacionActiva.mensajes[index - 1].fecha).toDateString()

            function editarMensaje(id: string, nuevoTexto: string) {
            editarMensajeAction(id, nuevoTexto)
            }
          return (
            <div key={mensaje.id}>
              {esNuevaFecha && (
                <div className="flex justify-center my-2">
                  <Badge variant="outline" className="text-xs bg-gray-100">
                    {formatearFecha(new Date(mensaje.fecha))}
                  </Badge>
                </div>
              )}
              <div className={`flex ${mensaje.emisorId === "usuario" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    mensaje.emisorId === "usuario" ? "bg-primary text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {mensaje.respuestaA && (
                    <div className="text-xs opacity-70 mb-1">
                      Respondiendo a:{" "}
                      {conversacionActiva.mensajes.find((m) => m.id === mensaje.respuestaA)?.texto.slice(0, 20)}
                      ...
                    </div>
                  )}
                  {mensaje.imagen && (
                    <img
                      src={mensaje.imagen || "/placeholder.svg"}
                      alt="Imagen adjunta"
                      className="max-w-full h-auto rounded-lg mb-2"
                    />
                  )}
                  {mensaje.archivo && (
                    <div className="flex items-center gap-2 mb-2">
                      <FileIcon className="h-4 w-4" />
                      <a href={mensaje.archivo.url} download={mensaje.archivo.nombre} className="text-sm underline">
                        {mensaje.archivo.nombre}
                      </a>
                    </div>
                  )}
                  {mensaje.audio && (
                    <audio controls className="mb-2 w-full">
                      <source src={mensaje.audio} type="audio/mpeg" />
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                  )}
                  {mensaje.texto && <p className="text-sm">{mensaje.texto}</p>}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <p className="text-xs opacity-70">
                      {new Date(mensaje.fecha).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {mensaje.editado && <span className="text-xs opacity-70">(editado)</span>}
                    {mensaje.emisorId === "usuario" &&
                      (mensaje.leido ? (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Check className="h-3 w-3" />
                      ))}
                  </div>
                  {mensaje.reacciones.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {mensaje.reacciones.map((reaccion, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {reaccion.emoji} {reaccion.count}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col ml-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-1">
                      <div className="flex gap-1">
                        {emojis.map((emoji) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => agregarReaccionAction(mensaje.id, emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setMensajeAResponderAction(mensaje)}
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                  {mensaje.emisorId === "usuario" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() => {
                          const nuevoTexto = prompt("Editar mensaje", mensaje.texto)
                          if (nuevoTexto) editarMensaje(mensaje.id, nuevoTexto)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() => {
                          if (confirm("¿Estás seguro de que quieres eliminar este mensaje?")) {
                            eliminarMensajeAction(mensaje.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {escribiendo && (
        <div className="flex items-center gap-2 mt-2">
          <div className="animate-pulse flex space-x-1">
            <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
            <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
            <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
          </div>
          <span className="text-sm text-muted-foreground">Escribiendo...</span>
        </div>
      )}
    </ScrollArea>
  )
}

