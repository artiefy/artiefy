import { useState } from "react"
import { useInteractionHistory } from "~/hooks/useInteractionHistory"
import { Input } from "~/components/admin/ui/input"
import { Button } from "~/components/admin/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/admin/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/admin/ui/card"

export default function InteractionHistory() {
  const { filteredInteractions, updateFilters } = useInteractionHistory()
  const [userFilter, setUserFilter] = useState("")
  const [keywordFilter, setKeywordFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState<"message" | "file" | "note" | "all">("all")

  const handleSearch = () => {
    updateFilters({
      user: userFilter,
      keyword: keywordFilter,
      type: typeFilter === "all" ? undefined : typeFilter,
    })
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Historial de Interacciones</h1>
      <div className="flex gap-4 mb-4">
        <Input placeholder="Filtrar por usuario" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
        <Input
          placeholder="Buscar por palabra clave"
          value={keywordFilter}
          onChange={(e) => setKeywordFilter(e.target.value)}
        />
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "message" | "file" | "note" | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de interacción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="message">Mensaje</SelectItem>
            <SelectItem value="file">Archivo</SelectItem>
            <SelectItem value="note">Nota</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>Buscar</Button>
      </div>
      <div className="space-y-4">
        {filteredInteractions.map((interaction) => (
          <Card key={interaction.id}>
            <CardHeader>
              <CardTitle>
                {interaction.type === "message" ? "Mensaje" : interaction.type === "file" ? "Archivo" : "Nota"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>De:</strong> {interaction.from}
              </p>
              <p>
                <strong>Para:</strong> {interaction.to}
              </p>
              <p>
                <strong>Contenido:</strong> {interaction.content}
              </p>
              <p>
                <strong>Fecha:</strong> {interaction.timestamp.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

