'use client';

import { Info } from "lucide-react";
import { useState } from "react";
import { ModalError } from "~/components/modals/modalError";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <section>
      {children}
      <div
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-6 hover:cursor-pointer"
        title="Información"
      >
        <Info className="size-10" />
      </div>
      <ModalError isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
