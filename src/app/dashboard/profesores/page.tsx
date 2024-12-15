import { UserButton } from '@clerk/nextjs'

export default async function DashboardProfesores() {
  return (
    <div>
      <header className="flex justify-between items-center p-4 bg-gray-100">
        <h1>Dashboard Profesores</h1>
        {/* Botón de usuario de Clerk */}
        <UserButton showName />
      </header>
    </div>
  )
}
