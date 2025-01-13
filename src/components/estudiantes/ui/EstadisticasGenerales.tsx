import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

type Estadistica = {
  categoria: string;
  valor: number;
}

type EstadisticasGeneralesProps = {
  titulo: string;
  estadisticas: Estadistica[];
}

export function EstadisticasGenerales({ titulo, estadisticas }: EstadisticasGeneralesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{
          valor: {
            label: "Valor",
            color: "hsl(var(--chart-1))",
          },
        }} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estadisticas}>
              <XAxis dataKey="categoria" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="valor" fill="var(--color-valor)" name="Valor" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

