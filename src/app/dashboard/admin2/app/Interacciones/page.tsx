"use client"
import InteractionHistoryViewer from "~/components/admin/ui/InteractionHistoryViewer"

export default function InteraccionesPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Supervisión de Interacciones</h1>
      <InteractionHistoryViewer />
    </div>
  )
}

