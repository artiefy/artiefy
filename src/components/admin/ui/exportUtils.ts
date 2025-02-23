import type { Ticket } from "~/components/admin/ui/SistemaDeSoporte"

export const exportToCSV = (tickets: Ticket[]) => {
  const csvContent =
    "data:text/csv;charset=utf-8," + tickets.map((ticket) => Object.values(ticket).join(",")).join("\n")
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", "tickets.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

