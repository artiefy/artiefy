import { useState, useEffect } from "react"

interface Interaction {
  id: string
  from: string
  to: string
  content: string
  type: "message" | "file" | "note"
  timestamp: Date
}

interface FilterOptions {
  user?: string
  startDate?: Date
  endDate?: Date
  keyword?: string
  type?: "message" | "file" | "note"
}

export function useInteractionHistory() {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [filteredInteractions, setFilteredInteractions] = useState<Interaction[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({})

  useEffect(() => {
    // Simular la carga de interacciones desde una API
    const fetchInteractions = async () => {
      // Aquí iría la llamada real a la API
      const mockInteractions: Interaction[] = [
        {
          id: "1",
          from: "profesor@ejemplo.com",
          to: "estudiante@ejemplo.com",
          content: "Hola, ¿cómo vas con la tarea?",
          type: "message",
          timestamp: new Date("2023-05-01T10:00:00"),
        },
        {
          id: "2",
          from: "estudiante@ejemplo.com",
          to: "profesor@ejemplo.com",
          content: "Tarea_Matematicas.pdf",
          type: "file",
          timestamp: new Date("2023-05-01T11:30:00"),
        },
        // ... más interacciones
      ]
      setInteractions(mockInteractions)
    }

    void fetchInteractions()
  }, [])

  useEffect(() => {
    const filtered = interactions.filter((interaction) => {
      const { user, startDate, endDate, keyword, type } = filterOptions
      return (
        (!user || interaction.from.includes(user) || interaction.to.includes(user)) &&
        (!startDate || interaction.timestamp >= startDate) &&
        (!endDate || interaction.timestamp <= endDate) &&
        (!keyword || interaction.content.toLowerCase().includes(keyword.toLowerCase())) &&
        (!type || interaction.type === type)
      )
    })
    setFilteredInteractions(filtered)
  }, [interactions, filterOptions])

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilterOptions((prevFilters) => ({ ...prevFilters, ...newFilters }))
  }

  return { filteredInteractions, updateFilters }
}

