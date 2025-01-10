'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { ThumbsUp, MessageSquare, ImageIcon, Send } from 'lucide-react'

type Foro = {
  id: number;
  titulo: string;
  descripcion: string;
  mensajes: number;
  ultimaActividad: string;
}

type Mensaje = {
  id: number;
  autor: string;
  contenido: string;
  fecha: string;
  likes: number;
  respuestas: number;
  imagen?: string;
}

type ForoDetalleProps = {
  foro: Foro;
  onVolver: () => void;
}

const mensajesIniciales: Mensaje[] = [
  {
    id: 1,
    autor: "Ana García",
    contenido: "¡Hola a todos! ¿Alguien más está teniendo problemas con el último ejercicio del módulo 3?",
    fecha: "2023-06-15 10:30",
    likes: 5,
    respuestas: 2,
  },
  {
    id: 2,
    autor: "Carlos Rodríguez",
    contenido: "Sí, yo también tuve dificultades. Aquí hay una captura de pantalla que muestra cómo lo resolví.",
    fecha: "2023-06-15 11:15",
    likes: 8,
    respuestas: 1,
    imagen: "https://picsum.photos/seed/picsum/300/200",
  },
]

export function ForoDetalle({ foro, onVolver }: ForoDetalleProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales)
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [imagenSeleccionada, setImagenSeleccionada] = useState<File | null>(null)

  const handleEnviarMensaje = () => {
    if (nuevoMensaje.trim() === '' && !imagenSeleccionada) return

    const nuevoMensajeObj: Mensaje = {
      id: mensajes.length + 1,
      autor: "Usuario Actual",
      contenido: nuevoMensaje,
      fecha: new Date().toLocaleString(),
      likes: 0,
      respuestas: 0,
      imagen: imagenSeleccionada ? URL.createObjectURL(imagenSeleccionada) : undefined,
    }

    setMensajes([...mensajes, nuevoMensajeObj])
    setNuevoMensaje('')
    setImagenSeleccionada(null)
  }

  const handleLike = (mensajeId: number) => {
    setMensajes(mensajes.map(mensaje => 
      mensaje.id === mensajeId ? { ...mensaje, likes: mensaje.likes + 1 } : mensaje
    ))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{foro.titulo}</span>
          <Button onClick={onVolver} variant="outline">Volver a la lista</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mensajes.map((mensaje) => (
            <Card key={mensaje.id}>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${mensaje.autor}`} />
                    <AvatarFallback>{mensaje.autor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{mensaje.autor}</span>
                      <span className="text-sm text-gray-500">{mensaje.fecha}</span>
                    </div>
                    <p className="text-sm mb-2">{mensaje.contenido}</p>
                    {mensaje.imagen && (
                      <img src={mensaje.imagen} alt="Imagen adjunta" className="max-w-full h-auto rounded-lg mb-2" />
                    )}
                    <div className="flex space-x-4">
                      <Button variant="ghost" size="sm" onClick={() => handleLike(mensaje.id)}>
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        {mensaje.likes}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {mensaje.respuestas}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Textarea
            placeholder="Escribe tu mensaje..."
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            className="mb-2"
          />
          <div className="flex justify-between items-center">
            <div>
              <input
                type="file"
                id="imagen"
                className="hidden"
                accept="image/*"
                onChange={(e) => setImagenSeleccionada(e.target.files?.[0] ?? null)}
              />
              <label htmlFor="imagen">
                <Button variant="outline" size="sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Adjuntar imagen
                </Button>
              </label>
              {imagenSeleccionada && (
                <span className="ml-2 text-sm text-gray-500">{imagenSeleccionada.name}</span>
              )}
            </div>
            <Button onClick={handleEnviarMensaje}>
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

