'use client';

import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';

export default function StudentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<section className="relative min-h-screen">
			{children}
			<div className="fixed right-0 bottom-0 z-50">
				<TicketSupportChatbot />
			</div>
		</section>
	);
}
