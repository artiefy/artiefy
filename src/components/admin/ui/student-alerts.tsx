"use client"

import { Alert, AlertDescription, AlertTitle } from "~/components/admin/ui/alert"
import { Badge } from "~/components/admin/ui/badge"
import { ScrollArea } from "~/components/admin/ui/scroll-area"
import { AlertCircle, ArrowDown, ArrowUp } from "lucide-react"

interface StudentAlert {
  id: string
  student: string
  type: "attendance" | "performance" | "participation"
  severity: "high" | "medium" | "low"
  message: string
  trend: "up" | "down"
  value: string
}

const alerts: StudentAlert[] = [
  {
    id: "1",
    student: "Carlos Martínez",
    type: "attendance",
    severity: "high",
    message: "Ausencias frecuentes en la última semana",
    trend: "down",
    value: "-15%",
  },
  {
    id: "2",
    student: "Ana García",
    type: "performance",
    severity: "medium",
    message: "Disminución en calificaciones de matemáticas",
    trend: "down",
    value: "-2.1",
  },
  {
    id: "3",
    student: "Luis Rodriguez",
    type: "participation",
    severity: "low",
    message: "Mejora significativa en participación",
    trend: "up",
    value: "+25%",
  },
]

export function StudentAlerts() {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <h3 className="text-lg font-semibold mb-4">Alertas Recientes</h3>
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Alert key={alert.id} variant={alert.severity === "high" ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              {alert.student}
              <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                {alert.type === "attendance"
                  ? "Asistencia"
                  : alert.type === "performance"
                    ? "Rendimiento"
                    : "Participación"}
              </Badge>
              <span className={`flex items-center ${alert.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                {alert.trend === "up" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {alert.value}
              </span>
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    </ScrollArea>
  )
}

