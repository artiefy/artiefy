'use client'

import { useState } from 'react'
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { DashboardMetrics } from '~/components/ui/DashboardMetrics'
import { MessageSquare, Users, AlertTriangle } from 'lucide-react'
import { ForoList } from '~/components/ui/ForoList'
import { ForoDetalle } from '~/components/ui/ForoDetalle'

type Foro = {
  id: number;
  titulo: string;
  descripcion: string;
  mensajes: number;
  ultimaActividad: string;
}

const forosIniciales: Foro[] = [
  { 
    id: 1, 
    titulo: 'Discusión General', 
    descripcion: 'Foro para discusiones generales sobre la plataforma',
    mensajes: 150,
    ultimaActividad: '2023-06-15'
  },
  { 
    id: 2, 
    titulo: 'Ayuda Técnica', 
    descripcion: 'Obtén ayuda con problemas técnicos',
    mensajes: 75,
    ultimaActividad: '2023-06-14'
  },
  { 
    id: 3, 
    titulo: 'Sugerencias de Mejora', 
    descripcion: 'Comparte tus ideas para mejorar la plataforma',
    mensajes: 50,
    ultimaActividad: '2023-06-13'
  },
]

export default function Foros() {
  const [foros, setForos] = useState<Foro[]>(forosIniciales)
  const [foroSeleccionado, setForoSeleccionado] = useState<Foro | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const forosFiltrados = foros.filter(foro => 
    foro.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    foro.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Foros de Discusión</h2>

      <DashboardMetrics
        metrics={[
          { title: "Total Foros", value: foros.length.toString(), icon: MessageSquare, href: "/foros" },
          { title: "Usuarios Activos", value: "150", icon: Users, href: "/usuarios" },
          { title: "Mensajes Totales", value: foros.reduce((acc, foro) => acc + foro.mensajes, 0).toString(), icon: AlertTriangle, href: "/foros" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Buscar Foros</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar foros..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      {foroSeleccionado ? (
        <ForoDetalle 
          foro={foroSeleccionado} 
          onVolver={() => setForoSeleccionado(null)}
        />
      ) : (
        <ForoList 
          foros={forosFiltrados} 
          onSelectForo={setForoSeleccionado}
        />
      )}
    </div>
  )
}

