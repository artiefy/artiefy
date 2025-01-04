'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Users, GraduationCap, FileText, MessageSquare, Settings, HelpCircle, Award, BarChart, PenToolIcon as Tool, Zap, Sun, Moon } from 'lucide-react'
import { Button } from "~/components/ui/button"
import { useTheme } from "next-themes"

const menuItems = [
  { icon: Home, text: 'Inicio', href: '/' },
  { icon: BookOpen, text: 'Cursos', href: './app/cursos' },
  { icon: Users, text: 'Estudiantes', href: './estudiantes' },
  { icon: GraduationCap, text: 'Tutores', href: './tutores' },
  { icon: FileText, text: 'Recursos', href: './recursos' },
  { icon: MessageSquare, text: 'Foros', href: './foros' },
  { icon: HelpCircle, text: 'Soporte', href: './soporte' },
  { icon: Award, text: 'Evaluaciones', href: './evaluaciones' },
  { icon: BarChart, text: 'Análisis', href: './analisis' },
  { icon: Tool, text: 'Configuración', href: './configuracion' },
  { icon: Zap, text: 'Gamificación', href: './gamificacion' },
]

export const Sidebar = () => {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="py-4">
        <div className="px-4 py-2">
          <h1 className="text-2xl font-bold">EduDash</h1>
        </div>
        <nav className="mt-4">
          {menuItems.map((item, index) => (
            <Link 
              key={index} 
              href={item.href} 
              className={`flex items-center space-x-2 text-gray-700 dark:text-gray-200 p-2 mx-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                pathname === item.href ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.text}</span>
            </Link>
          ))}
        </nav>
        <div className="px-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newTheme = theme === "dark" ? "light" : "dark"
              setTheme(newTheme)
              // Opcional: Guardar la preferencia en localStorage
              localStorage.setItem('theme', newTheme)
            }}
            className="w-full flex items-center justify-center gap-2"
          >
            {theme === "dark" ? (
              <>
                <Sun className="h-4 w-4" />
                <span>Cambiar a modo claro</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>Cambiar a modo oscuro</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}

