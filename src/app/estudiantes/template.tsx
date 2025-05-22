'use client';

import TicketSupportChatbot from '~/components/estudiantes/layout/TicketSupportChatbot';

export default function StudentTemplate({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			{children}
			<div className="fixed right-0 bottom-0 z-50">
				<TicketSupportChatbot />
			</div>
		</>
	);
}
