"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  FaBell,
  FaBook,
  FaChalkboardTeacher,
  FaCog,
  FaGraduationCap,
} from "react-icons/fa";
import { MdDashboard, MdMenu } from "react-icons/md";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import Logo from "../../../public/artiefy-icon.png";

export default function LeftSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      title: "Panel de control",
      icon: <MdDashboard className="h-7 w-7" />,
      url: "/dashboard/educadores",
    },
    {
      title: "Cursos",
      icon: <FaChalkboardTeacher className="h-7 w-7" />,
      url: "/dashboard/educadores/cursos",
    },
    {
      title: "Alumnos",
      icon: <FaGraduationCap className="h-7 w-7" />,
      url: "/docentes/alumnos",
    },
    {
      title: "Recursos",
      icon: <FaBook className="h-7 w-7" />,
      url: "/profesores/recursos",
    },
    {
      title: "Configuración",
      icon: <FaCog className="h-7 w-7" />,
      url: "/profesores/configuracion",
    },
  ];

  return (
    <div className="flex">
      {/* Top Navigation Bar */}
      <div className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-gray-400/40 bg-background shadow-md">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center">
            <Button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded-lg border-none border-transparent p-2"
              aria-label="Toggle Menu"
            >
              <MdMenu className="text-gray-300" />
            </Button>
            <span className="ml-4 text-xl font-semibold text-gray-300">
              Enseñanza con Artiefy
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="rounded-lg border-none border-transparent p-2">
              <FaBell className="h-5 w-5 text-gray-300" />
            </Button>
            <Button className="flex items-center space-x-2 rounded-lg border-none border-transparent p-0">
              <UserButton showName />
            </Button>
          </div>
        </div>
      </div>

      {/* Left Sidebar */}
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] border-r border-gray-400/40 bg-background shadow-lg transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}
      >
        <nav className="mt-8">
          <ul className="space-y-10">
            {menuItems.map((item, index) => (
              <li key={index}>
                <Link href={item.url}>
                  <Button
                    className={`flex w-full items-center border-none border-transparent ${isCollapsed ? "justify-center" : "justify-start"} p-4 text-gray-700 transition-colors duration-200 hover:text-blue-600`}
                    aria-label={item.title}
                  >
                    <span className="flex items-center text-base text-gray-300">
                      {item.icon}
                      {!isCollapsed && (
                        <span className="ml-3 font-medium">{item.title}</span>
                      )}
                    </span>
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div
          className={`absolute bottom-0 w-full p-4 ${isCollapsed ? "px-2" : "px-6"}`}
        >
          <Card className="border-primary bg-background/50 p-2">
            <div className="text-center">
              {isCollapsed ? (
                <Image
                  src={Logo}
                  alt="Logo Portal Docentes"
                  width={42}
                  height={42}
                  className="mx-auto cursor-pointer rounded-full"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                />
              ) : (
                <>
                  <p className="text-sm font-medium text-primary">
                    Portal de educadores
                  </p>
                  <p className="mt-1 text-sm text-gray-300">v1.0.0</p>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`min-h-screen ${
          isCollapsed ? "ml-20" : "ml-64"
        } mt-16 flex-1 p-6 transition-all duration-300`}
      >
        {children}
      </div>
    </div>
  );
}
