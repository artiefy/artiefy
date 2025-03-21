'use client'; // ✅ Es necesario porque usa React Hooks
import { useUser } from '@clerk/nextjs';

import ResponsiveSidebar from '~/components/eduAndAdmiMenu';
import usePageTimeTracker from '~/hooks/usePageTimeTracker';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user } = useUser();

	// 🔥 Activa el rastreo de tiempo dentro del Dashboard
	usePageTimeTracker(user?.id ?? null);

	return (
		<section>
			<ResponsiveSidebar>{children}</ResponsiveSidebar>
		</section>
	);
}
