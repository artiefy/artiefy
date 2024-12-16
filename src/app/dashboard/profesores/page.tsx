import { UserButton } from "@clerk/nextjs";

export default function DashboardProfesores() {
  return (
    <div>
      <header className="flex items-center justify-between bg-gray-100 p-4">
        <h1>Dashboard Profesores</h1>

        {/* Botón de usuario de Clerk con redirección configurada */}
        <UserButton showName />
      </header>
    </div>
  );
}
