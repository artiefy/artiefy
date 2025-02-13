import type { Ticket } from "./SistemaDeSoporte"

export const exportarACSV = (tickets: Ticket[]) => {
  const contenidoCSV =
    "data:text/csv;charset=utf-8," + tickets.map((ticket) => Object.values(ticket).join(",")).join("\n")
  const uriCodificada = encodeURI(contenidoCSV)
  const enlace = document.createElement("a")
  enlace.setAttribute("href", uriCodificada)
  enlace.setAttribute("download", "tickets.csv")
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
}

