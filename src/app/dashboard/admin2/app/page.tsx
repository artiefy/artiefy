'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Users, BookOpen, MessageSquare, HelpCircle, Award, BarChart, FileText, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const stats = [
    { title: "Total Estudiantes", value: "1,234", icon: Users, href: "./app/estudiantes" },
    { title: "Cursos Activos", value: "56", icon: BookOpen, href: "./app/cursos" },
    { title: "Foros Activos", value: "23", icon: MessageSquare, href: "./app/foros" },
    { title: "Tickets de Soporte", value: "15", icon: HelpCircle, href: "./app/soporte" },
    { title: "Insignias Otorgadas", value: "789", icon: Award, href: "./app/gamificacion" },
    { title: "Tasa de Finalización", value: "78%", icon: BarChart, href: "./app/analisis" },
    { title: "Total Recursos", value: "345", icon: FileText, href: "./app/recursos" },
    { title: "Tutores Activos", value: "42", icon: GraduationCap, href: "./app/tutores" },
  ]

  const quickAccess = [
    { title: "Gestionar Cursos", href: "./app/cursos" },
    { title: "Ver Estudiantes", href: "./app/estudiantes" },
    { title: "Moderar Foros", href: "./app/foros" },
    { title: "Atender Soporte", href: "./app/soporte" },
    { title: "Gestionar Gamificación", href: "./app/gamificacion" },
    { title: "Ver Análisis", href: "./app/analisis" },
    { title: "Administrar Recursos", href: "./app/recursos" },
    { title: "Gestionar Tutores", href: "./app/tutores" },
  ]

  const [insignias, setInsignias] = useState([
    { id: 1, nombre: 'Explorador Novato', descripcion: 'Completar el primer curso', puntos: 50 },
    { id: 2, nombre: 'Maestro del Foro', descripcion: 'Hacer 100 publicaciones útiles', puntos: 200 },
    { id: 3, nombre: 'Estudiante Estrella', descripcion: 'Obtener calificación perfecta en 5 cursos', puntos: 500 },
  ])

  return (
    <div className="container mx-auto px-6 py-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Dashboard Educativo</h2>
      
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <Link href={stat.href} passHref>
                <Button variant="link" className="p-0">Ver detalles</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Accesos Rápidos</h3>
      <div className="grid gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {quickAccess.map((item) => (
          <Link key={item.title} href={item.href} passHref>
            <Button className="w-full">{item.title}</Button>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>Nuevo curso añadido: "Introducción a la Inteligencia Artificial"</li>
            <li>5 nuevos estudiantes registrados en las últimas 24 horas</li>
            <li>Foro "Discusión General" alcanzó 1000 mensajes</li>
            <li>Se resolvieron 10 tickets de soporte hoy</li>
            <li>Nueva insignia creada: "Maestro del Código"</li>
            <li>Se añadieron 3 nuevos recursos al curso de "Desarrollo Web Avanzado"</li>
            <li>2 nuevos tutores se unieron a la plataforma</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

