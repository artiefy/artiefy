import { Fragment, type ReactNode } from 'react';

import { Dialog, Transition } from '@headlessui/react';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
	return (
		<Transition appear show={isOpen} as={Fragment}>
			<Dialog
				as="div"
				className="fixed inset-0 z-10 overflow-y-auto"
				onClose={onClose}
			>
				<div className="min-h-screen px-4 text-center">
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0 bg-black opacity-30" />
					</Transition.Child>

					<span
						className="inline-block h-screen align-middle"
						aria-hidden="true"
					>
						&#8203;
					</span>
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<div className="my-8 inline-block w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
							{children}
						</div>
					</Transition.Child>
				</div>
			</Dialog>
		</Transition>
	);
};

export const ModalHeader: React.FC<{ children: ReactNode }> = ({
	children,
}) => (
	<Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900">
		{children}
	</Dialog.Title>
);

export const ModalBody: React.FC<{ children: ReactNode }> = ({ children }) => (
	<div className="mt-2">{children}</div>
);

export const ModalFooter: React.FC<{ children: ReactNode }> = ({
	children,
}) => <div className="mt-4 flex justify-end space-x-2">{children}</div>;
