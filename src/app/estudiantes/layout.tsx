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
		<section className="relative min-h-screen">
			{children}
			<div className="fixed right-0 bottom-0 z-50">
				<TicketSupportWrapper />
			</div>
		</section>
	);
}
