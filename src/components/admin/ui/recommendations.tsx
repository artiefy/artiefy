"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/admin/ui/card"
import { ScrollArea } from "~/components/admin/ui/scroll-area"
import { Brain, BookOpen, Users, Trophy } from "lucide-react"

interface Recommendation {
  id: string
  title: string
  description: string
  type: "resource" | "activity" | "strategy" | "achievement"
  icon: typeof Brain | typeof BookOpen | typeof Users | typeof Trophy
}

const recommendations: Recommendation[] = [
  {
    id: "1",
    title: "Recursos de Aprendizaje Adaptativo",
    description: "Implementar ejercicios personalizados basados en el nivel actual del estudiante",
    type: "resource",
    icon: Brain,
  },
  {
    id: "2",
    title: "Material Complementario",
    description: "Proporcionar lecturas adicionales y videos explicativos",
    type: "resource",
    icon: BookOpen,
  },
  {
    id: "3",
    title: "Actividades Grupales",
    description: "Fomentar el aprendizaje colaborativo mediante proyectos en equipo",
    type: "activity",
    icon: Users,
  },
  {
    id: "4",
    title: "Sistema de Logros",
    description: "Implementar insignias y reconocimientos por mejoras en el rendimiento",
    type: "achievement",
    icon: Trophy,
  },
]

export function Recommendations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recomendaciones IA</CardTitle>
        <CardDescription>Sugerencias personalizadas basadas en el análisis de datos</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="rounded-full p-2 bg-primary/10">
                    <rec.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium leading-none">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

