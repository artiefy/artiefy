'use client';

import React from 'react';
import { FiX } from 'react-icons/fi';

interface ModalErrorProps {
	isOpen: boolean;
	onCloseAction: () => void;
}

interface ModalErrorProps {
	isOpen: boolean;

	onClose: () => void;
}

export const ModalError: React.FC<ModalErrorProps> = ({
	isOpen,
	onCloseAction,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
				{/* Close Button */}
				<button
					onClick={onCloseAction}
					className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
				>
					<FiX size={24} />
				</button>
				{/* Modal Content */}
				<h2 className="mb-4 text-xl font-semibold text-gray-800">
					Reportar Error
				</h2>
				<p className="mb-4 text-gray-600">
					Por favor, describe el problema que estás experimentando para que
					podamos solucionarlo.
				</p>
				<textarea
					className="focus:border-primary w-full rounded border-gray-300 p-2 text-gray-800 focus:outline-none"
					rows={5}
					placeholder="Describe tu problema aquí..."
				></textarea>
				<div className="mt-4 flex justify-end">
					<button
						onClick={onCloseAction}
						className="mr-2 rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
					>
						Cancelar
					</button>
					<button className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
						Enviar
					</button>
				</div>
			</div>
		</div>
	);
};
