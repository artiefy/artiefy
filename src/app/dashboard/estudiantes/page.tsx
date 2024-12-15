// app/dashboard/estudiante/page.tsx
import { UserButton } from "@clerk/nextjs";

export default async function DashboardEstudiantes() {
  return (
    <div>
      <header className="flex items-center justify-between bg-gray-100 p-4">
        <h1>Dashboard Estudiantes</h1>
        {/* Botón de usuario de Clerk */}
        <UserButton showName />
      </header>
    </div>
  );
}
