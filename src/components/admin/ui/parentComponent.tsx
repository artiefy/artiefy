import { useState } from 'react';
import { Button } from '~/components/admin/ui/button';
import ConfirmationDialog from '~/components/admin/ui/ConfirmDialog';

export function ParentComponent() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const handleConfirm = () => {
		// Handle confirmation logic here
		console.log('Confirmed');
		setIsDialogOpen(false);
	};

	return (
		<div>
			<Button onClick={() => setIsDialogOpen(true)}>Open Dialog</Button>
			<ConfirmationDialog
				isOpen={isDialogOpen}
				title="Confirm Action"
				description="Are you sure you want to perform this action?"
				message="This is a confirmation message"
				onClose={() => setIsDialogOpen(false)}
				onConfirm={handleConfirm}
			/>
		</div>
	);
}
