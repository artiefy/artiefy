"use client";

import { useEffect, useState } from "react";

const usePageTimeTracker = (userId: string | null) => {
  const [isInactivePopupOpen, setIsInactivePopupOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPopupActive, setIsPopupActive] = useState(false); // Nuevo estado para evitar el reinicio automático

  useEffect(() => {
    if (!userId) return;

    console.log(`✅ Iniciando rastreo de tiempo para el usuario: ${userId}`);

    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    const resetTimer = () => {
      if (isPopupActive) return; // ❌ Evita que el temporizador se resetee si el popup está abierto

      console.log("🔄 Usuario activo, reseteando temporizador de inactividad...");
      setIsInactivePopupOpen(false);
      setIsPaused(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log("⏳ Usuario inactivo, mostrando popup...");
        setIsInactivePopupOpen(true);
        setIsPaused(true);
        setIsPopupActive(true); // ✅ Marcar el popup como activo
      },5* 60 * 1000); // 10 segundos sin interacción
    };

    const sendTime = async () => {
      if (isPaused) return; // Si está pausado, no enviar datos

      const entryTime = parseInt(localStorage.getItem("entryTime") ?? "0", 10);
      const now = Date.now();
      const elapsedMinutes = Math.floor((now - entryTime) / 60000);

      if (elapsedMinutes > 0) {
        try {
          console.log(`⏳ Enviando ${elapsedMinutes} minutos para usuario ${userId}`);

          const response = await fetch("/api/super-admin/user-time", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, elapsedMinutes }),
          });

          if (!response.ok) {
            console.error("❌ Error al registrar el tiempo:", await response.text());
          } else {
            console.log("✅ Tiempo registrado correctamente.");
            localStorage.setItem("entryTime", Date.now().toString());
          }
        } catch (error) {
          console.error("❌ Error al enviar tiempo al backend:", error);
        }
      }
    };

    localStorage.setItem("entryTime", Date.now().toString());

    document.addEventListener("mousemove", resetTimer);
    document.addEventListener("keydown", resetTimer);
    document.addEventListener("click", resetTimer);

    interval = setInterval(sendTime, 60000);
    resetTimer();

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      document.removeEventListener("mousemove", resetTimer);
      document.removeEventListener("keydown", resetTimer);
      document.removeEventListener("click", resetTimer);
    };
  }, [userId, isPaused, isPopupActive]);

  // ✅ Nueva función para cerrar el popup y reanudar el seguimiento
  const handleContinue = () => {
    console.log("✅ Usuario quiere continuar, reanudando seguimiento...");
    setIsInactivePopupOpen(false);
    setIsPaused(false);
    setIsPopupActive(false);
  };

  return { isInactivePopupOpen, handleContinue };
};

export default usePageTimeTracker;
