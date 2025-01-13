'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Users, GraduationCap, FileText, MessageSquare, Award, BarChart, PenToolIcon as Tool, Zap, Sun, Moon, LifeBuoy, Menu } from 'lucide-react'
import { Button } from "~/components/ui/button"
import { useTheme } from "next-themes"

const menuItems = [
  { icon: Home, text: 'Inicio', href: './' },
  { icon: BookOpen, text: 'Cursos', href: './app/cursos' },
  { icon: Users, text: 'Estudiantes', href: './app/estudiantes' },
  { icon: GraduationCap, text: 'Tutores', href: './app/tutores' },
  { icon: FileText, text: 'Recursos', href: './recursos' },
  { icon: MessageSquare, text: 'Foros', href: './foros' },
  { icon: LifeBuoy, text: 'Soporte', href: './soporte' },
  
  { icon: Award, text: 'Evaluaciones', href: './evaluaciones' },
  { icon: BarChart, text: 'Análisis', href: './analisis' },
  { icon: Tool, text: 'Configuración', href: './configuracion' },
  { icon: Zap, text: 'Gamificación', href: './gamificacion' },
]

export const Sidebar = () => {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      <aside className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto`}>
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
                onClick={() => setIsOpen(false)}
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
    </>
  )
}

