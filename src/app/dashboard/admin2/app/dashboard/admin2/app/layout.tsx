import { Sidebar } from '~/components/admin/ui/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-background md:flex-row">
      <Sidebar>
        <div />
      </Sidebar>
      <section>{children}</section>
    </div>
  );
}
