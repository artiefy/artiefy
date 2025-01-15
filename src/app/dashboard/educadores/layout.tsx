"use client";
import LeftSidebar from "~/components/educators/MenuDocentes/SideBarDocentes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <section>
      <LeftSidebar>
        {children}
      </LeftSidebar>
    </section>
  );
}
