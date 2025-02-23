"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Input } from "~/components/admin/ui/input"
import { Button } from "~/components/admin/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/admin/ui/tooltip"
import { ImageIcon, Mic, Send, X } from "lucide-react"
import type { Mensaje } from "~/types/chat"

interface ChatInputProps {
  enviarMensajeAction: (
    texto: string,
    imagen?: string,
    archivo?: { nombre: string; tipo: string; url: string },
    audio?: string,
  ) => void
  mensajeAResponder: Mensaje | null
  setMensajeAResponderAction: (mensaje: Mensaje | null) => void
}

export const ChatInput = ({ enviarMensajeAction, mensajeAResponder, setMensajeAResponderAction }: ChatInputProps) => {
  const [inputValue, setInputValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      enviarMensajeAction(inputValue)
      setInputValue("")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (file.type.startsWith("image/")) {
          enviarMensajeAction("", reader.result as string)
        } else {
          enviarMensajeAction("", undefined, {
            nombre: file.name,
            tipo: file.type,
            url: URL.createObjectURL(file),
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        enviarMensajeAction("", undefined, undefined, reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      {mensajeAResponder && (
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md mb-2">
          <p className="text-sm truncate">Respondiendo a: {mensajeAResponder.texto.slice(0, 30)}...</p>
          <Button variant="ghost" size="sm" onClick={() => setMensajeAResponderAction(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escriba su mensaje..."
          className="flex-1"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enviar archivo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" size="icon" variant="ghost" onClick={() => audioInputRef.current?.click()}>
                <Mic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enviar nota de voz</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <input type="file" ref={audioInputRef} onChange={handleAudioUpload} accept="audio/*" className="hidden" />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

