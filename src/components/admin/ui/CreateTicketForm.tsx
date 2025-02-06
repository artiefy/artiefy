'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface CreateTicketFormProps {
	onClose: () => void;
}

const CreateTicketForm: React.FC<CreateTicketFormProps> = ({ onClose }) => {
	const [formData, setFormData] = useState({
		title: '',
		category: '',
		priority: 'Medium',
		description: '',
	});

	const handleChange = useCallback(
		(
			e: React.ChangeEvent<
				HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
			>
		) => {
			const { name, value } = e.target;
			setFormData((prev) => ({ ...prev, [name]: value }));
		},
		[]
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			console.log('New Ticket:', formData);
			onClose();
		},
		[formData, onClose]
	);

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
			<div className="relative w-96 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
				<button
					onClick={onClose}
					className="absolute right-3 top-3 rounded-full p-1 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
					aria-label="Close"
				>
					<X size={20} />
				</button>
				<h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
					Create New Ticket
				</h2>
				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label
							className="block text-gray-700 dark:text-gray-300"
							htmlFor="title"
						>
							Title
						</label>
						<input
							id="title"
							type="text"
							name="title"
							value={formData.title}
							onChange={handleChange}
							className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white text-black"
							required
							autoFocus
							aria-label="Ticket title"
						/>
					</div>
					<div className="mb-4">
						<label
							className="block text-black text-gray-700 dark:text-gray-300"
							htmlFor="category"
						>
							Category
						</label>
						<input
							id="category"
							type="text"
							name="category"
							value={formData.category}
							onChange={handleChange}
							className="w-full rounded border p-2 text-black dark:bg-gray-800"
							aria-label="Ticket category"
						/>
					</div>
					<div className="mb-4 ">
						<label
							className="block text-gray-700 dark:text-gray-300 "
							htmlFor="priority"
						>
							Priority
						</label>
						<select
							id="priority"
							name="priority"
							value={formData.priority}
							onChange={handleChange}
							className="w-full rounded border p-2 text-black dark:bg-gray-800"
							aria-label="Ticket priority"
						>
							<option value="Low">Low</option>
							<option value="Medium">Medium</option>
							<option value="High">High</option>
						</select>
					</div>
					<div className="mb-4">
						<label
							className="block text-black text-gray-700"
							htmlFor="description"
						>
							Description
						</label>
						<textarea
							id="description"
							name="description"
							value={formData.description}
							onChange={handleChange}
							className="w-full rounded border p-2 dark:bg-gray-800 dark:text-white text-black"
							rows={3}
							aria-label="Ticket description"
						/>
					</div>
					<div className="flex justify-end space-x-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded bg-gray-500 px-4 py-2 text-white transition hover:bg-gray-600"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
						>
							Submit
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default CreateTicketForm;
