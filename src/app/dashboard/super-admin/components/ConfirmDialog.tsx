import { useState } from 'react';

import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
	isOpen: boolean;
	title: string;
	message: string;
	onConfirm: () => Promise<void>; // Asegurar que sea una función async
	onCancel: () => void;
}

export function ConfirmDialog({
	isOpen,
	title,
	message,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const [loading, setLoading] = useState(false);

	if (!isOpen) return null;

	const handleConfirm = async () => {
		setLoading(true);
		await onConfirm();
		setLoading(false);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-md rounded-lg bg-gray-900 p-6 text-white shadow-xl">
				<div className="mb-4 flex items-center space-x-2 text-yellow-400">
					<AlertTriangle className="h-6 w-6" />
					<h3 className="text-lg font-semibold">{title}</h3>
				</div>
				<p className="mb-6 text-gray-300">{message}</p>
				<div className="flex justify-end space-x-3">
					<button
						onClick={onCancel}
						className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
					>
						Cancelar
					</button>
					<button
						onClick={handleConfirm}
						disabled={loading}
						className="flex items-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none"
					>
						{loading && <Loader2 className="mr-2 h-4 w-4" />}
						{loading ? 'Procesando...' : 'Confirmar'}
					</button>
				</div>
			</div>
		</div>
	);
}
