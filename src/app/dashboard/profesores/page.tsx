import { UserButton } from "@clerk/nextjs";

export default function DashboardProfesores() {
  return (
    <div>
      <div>
        <header className="bg-[#ffff] p-5 text-2xl font-extrabold text-black">
          <h1>Dashboard Profesores</h1>
          {/* Botón de usuario de Clerk */}
          <UserButton showName />
        </header>
      </div>
    </div>
  );
}
