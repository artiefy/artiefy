'use client'; // ✅ Es necesario porque usa React Hooks

import { useUser } from '@clerk/nextjs';
import usePageTimeTracker from '~/hooks/usePageTimeTracker';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { user } = useUser();

	// 🔥 Activa el rastreo de tiempo dentro del Dashboard
	usePageTimeTracker(user?.id ?? null);

	return <section className="p-4">Luis es una bitch {children}</section>;
}
