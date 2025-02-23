import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/admin/ui/table"
import { HistoryEntry } from "~/types/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface EducatorHistoryProps {
  history: HistoryEntry[]
}

export function EducatorHistory({ history }: EducatorHistoryProps) {
  const getActionText = (action: HistoryEntry["action"]) => {
    switch (action) {
      case "create":
        return "Creación"
      case "update":
        return "Actualización"
      case "delete":
        return "Eliminación"
      case "role_change":
        return "Cambio de rol"
      default:
        return action
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Acción</TableHead>
          <TableHead>Cambios</TableHead>
          <TableHead>Realizado por</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{format(new Date(entry.timestamp), "PPp", { locale: es })}</TableCell>
            <TableCell>{getActionText(entry.action)}</TableCell>
            <TableCell>
              {Object.entries(entry.changes).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">{key}:</span> {value.toString()}
                </div>
              ))}
            </TableCell>
            <TableCell>{entry.performedBy}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

