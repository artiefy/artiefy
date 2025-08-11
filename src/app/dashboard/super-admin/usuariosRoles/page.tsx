"use client";

import { useState } from "react";

import PermisosTab from "./components/PermisosTab";
import RolesTab from "./components/RolesTab";

export default function UsuariosRolesPage() {
  const [activeTab, setActiveTab] = useState<"permisos" | "roles">("permisos");

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 lg:px-10">
      <header className="group relative mb-6 overflow-hidden rounded-lg p-[1px]">
        <div className="animate-gradient absolute -inset-0.5 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] opacity-75 blur transition duration-500" />
        <div className="relative flex flex-col rounded-lg bg-gray-800 p-4 text-white shadow-lg group-hover:bg-gray-800/95 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-center text-lg font-bold sm:text-left sm:text-xl md:text-2xl">
            Gestión de Permisos y Roles Secundarios
          </h1>
        </div>
      </header>

      <div className="mb-4 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => setActiveTab("permisos")}
          className={`w-full rounded px-4 py-2 text-center sm:w-auto ${
            activeTab === "permisos"
              ? "bg-primary text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Permisos
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`w-full rounded px-4 py-2 text-center sm:w-auto ${
            activeTab === "roles"
              ? "bg-primary text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Roles Secundarios
        </button>
      </div>

      <div className="w-full overflow-auto">
        {activeTab === "permisos" ? <PermisosTab /> : <RolesTab />}
      </div>
    </div>
  );
}
