'use client';

import dynamic from 'next/dynamic';

// Importar el componente de forma dinámica sin SSR
const TicketSupportChatbot = dynamic(
	() => import('~/components/estudiantes/layout/TicketSupportChatbot'),
	{ ssr: false }
);

// Wrapper para el layout que contendrá el chat
const StudentLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="relative min-h-screen">
			{children}
			<TicketSupportChatbot />
		</div>
	);
};

// Layout principal (Server Component)
export default function StudentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <StudentLayoutWrapper>{children}</StudentLayoutWrapper>;
}
