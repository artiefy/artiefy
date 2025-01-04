import LeftSidebar from "~/components/MenuDocentes/SideBarDocentes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <LeftSidebar>{children}</LeftSidebar>
    </section>
  );
}
