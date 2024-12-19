// app/dashboard/estudiante/page.tsx
import { UserButton } from "@clerk/nextjs";

export default async function DashboardEstudiantes() {
  return (
    <div>
      <header className="bg-[#ffff] p-5 text-2xl font-extrabold text-black">
        <h1>Dashboard Estudiantes</h1>
        {/* Botón de usuario de Clerk */}
        <UserButton showName/>
      </header>
    </div>
  );
}
