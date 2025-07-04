import React from 'react';

import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';

import '~/styles/ticketSupportButton.css';

export default function StudentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative min-h-screen">
			{children}
			<TicketSupportChatbot />
		</div>
	);
}
