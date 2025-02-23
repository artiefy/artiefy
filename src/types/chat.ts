export interface Contacto {
  id: string
  nombre: string
  apellido: string
  rol: "Estudiante" | "Admin" | "Técnico"
  estado: "en_linea" | "ausente" | "ocupado" | "desconectado"
  avatar?: string
  ticketsPendientes?: number
}

export interface Reaccion {
  emoji: string
  count: number
  usuarios: string[]
}

export interface Mensaje {
  id: string
  texto: string
  fecha: Date
  emisorId: string
  receptorId: string
  leido: boolean
  imagen?: string
  archivo?: {
    nombre: string
    tipo: string
    url: string
  }
  audio?: string
  reacciones: Reaccion[]
  editado: boolean
  respuestaA?: string
}

export interface Conversacion {
  contacto: Contacto
  mensajes: Mensaje[]
}

