'use client';

import dynamic from 'next/dynamic';

const TicketSupportClient = dynamic(
	() => import('~/components/estudiantes/layout/TicketSupportChatbot'),
	{ ssr: false }
);

export default function StudentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="relative min-h-screen">
			{children}
			<div className="fixed right-0 bottom-0 z-50">
				<TicketSupportClient />
			</div>
		</section>
	);
}
