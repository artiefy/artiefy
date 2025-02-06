"use client"

import { Bar, BarChart, Line, LineChart } from "recharts"
import { Card, CardContent } from "~/components/admin/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/admin/ui/chart"

const performanceData = [
  { month: "Ene", attendance: 95, participation: 85, grades: 88 },
  { month: "Feb", attendance: 92, participation: 87, grades: 85 },
  { month: "Mar", attendance: 88, participation: 82, grades: 83 },
  { month: "Abr", attendance: 90, participation: 88, grades: 87 },
  { month: "May", attendance: 94, participation: 90, grades: 89 },
  { month: "Jun", attendance: 96, participation: 92, grades: 91 },
]

const statisticsData = [
  { category: "Completados", value: 85 },
  { category: "En Progreso", value: 78 },
  { category: "No Iniciados", value: 42 },
]

export default function StudentAnalyticsDashboard() {
  return (
    <div className="flex flex-col gap-4 p-8 bg-[#0A1629] min-h-screen text-white">
      <h2 className="text-2xl font-bold">Análisis Estudiantil</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-[#111E35] border-0 text-white">
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Promedio General</p>
              <div className="text-3xl font-bold">84.00</div>
            </div>
            <button className="text-xs text-cyan-400 mt-2">Ver detalles</button>
          </CardContent>
        </Card>
        <Card className="bg-[#111E35] border-0 text-white">
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Tasa de Finalización</p>
              <div className="text-3xl font-bold">80.50%</div>
            </div>
            <button className="text-xs text-cyan-400 mt-2">Ver detalles</button>
          </CardContent>
        </Card>
        <Card className="bg-[#111E35] border-0 text-white">
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-400">Tiempo Promedio de Completado</p>
              <div className="text-3xl font-bold">43 días</div>
            </div>
            <button className="text-xs text-cyan-400 mt-2">Ver detalles</button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#111E35] border-0 text-white mt-4">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Estadísticas Generales</h3>
          <ChartContainer
            config={{
              value: {
                label: "Valor",
                color: "rgb(231, 111, 81)",
              },
            }}
            className="h-[300px]"
          >
            <BarChart data={statisticsData}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="rgb(231, 111, 81)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="bg-[#111E35] border-0 text-white mt-4">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tendencias de Rendimiento</h3>
          <ChartContainer
            config={{
              grades: {
                label: "Calificaciones",
                color: "rgb(231, 111, 81)",
              },
            }}
            className="h-[300px]"
          >
            <LineChart data={performanceData}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="grades" stroke="rgb(231, 111, 81)" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

