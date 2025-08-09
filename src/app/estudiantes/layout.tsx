import React from 'react';

import {ExtrasProvider} from '~/app/estudiantes/StudentContext';
import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';
import {TourComponent} from '~/components/estudiantes/layout/TourComponent';

import '~/styles/ticketSupportButton.css';

export default function StudentLayout({
	children,
}: {
	children: React.ReactNode;
}) {

	
	return (
		<ExtrasProvider>
		<div className="relative min-h-screen">
			{children}
			<TicketSupportChatbot />
			<TourComponent />
		</div>
		</ExtrasProvider>
	);
}
