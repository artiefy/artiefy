import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"

type Foro = {
  id: number;
  titulo: string;
  descripcion: string;
  mensajes: number;
  ultimaActividad: string;
}

type ForoListProps = {
  foros: Foro[];
  onSelectForo: (foro: Foro) => void;
}

export function ForoList({ foros, onSelectForo }: ForoListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {foros.map((foro) => (
        <Card key={foro.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{foro.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{foro.descripcion}</p>
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <span>{foro.mensajes} mensajes</span>
              <span>Última actividad: {foro.ultimaActividad}</span>
            </div>
          </CardContent>
          <CardContent className="pt-0">
            <Button onClick={() => onSelectForo(foro)} className="w-full">
              Ver Foro
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

