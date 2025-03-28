import ResponsiveSidebar from '~/components/eduAndAdmiMenu';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {

	return (
		<section>
			<ResponsiveSidebar>{children}</ResponsiveSidebar>
		</section>
	);
}
