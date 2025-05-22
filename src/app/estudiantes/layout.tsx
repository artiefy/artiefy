'use client';

import dynamic from 'next/dynamic';

// Importar el wrapper del chat como un componente de cliente
const TicketSupportWrapper = () => {
	const TicketSupportChatbot = dynamic(
		() => import('~/components/estudiantes/layout/TicketSupportChatbot'),
		{ ssr: false }
	);

	return <TicketSupportChatbot />;
};

export default function StudentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative min-h-screen">
			{children}
			<TicketSupportWrapper />
		</div>
	);
}
