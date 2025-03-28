'use client';

interface ModalErrorProps {
	isOpen: boolean;
	onCloseAction: () => void;
	onRetryAction: () => void;
	message?: string;
}

export const ModalError: React.FC<ModalErrorProps> = ({
	isOpen,
	onCloseAction,
	onRetryAction,
	message = 'Ha ocurrido un error inesperado.',
}) => {
	if (!isOpen) return null;

	return (
		<div className="bg-opacity-50 fixed inset-0 flex items-center justify-center bg-black">
			<div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
				<h2 className="text-lg font-bold text-red-600">Error</h2>
				<p className="mt-4 text-gray-700">{message}</p>
				<div className="mt-6 flex justify-end space-x-4">
					<button
						className="rounded-md bg-gray-300 px-4 py-2"
						onClick={onCloseAction}
					>
						Cerrar
					</button>
					<button
						className="rounded-md bg-red-600 px-4 py-2 text-white"
						onClick={onRetryAction}
					>
						Reintentar
					</button>
				</div>
			</div>
		</div>
	);
};
