import { useState } from 'react';
import {
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/admin/ui/dialog';
import { Button } from '~/components/admin/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/admin/ui/select';
import { Textarea } from '~/components/admin/ui/textarea';
import { Label } from '~/components/admin/ui/label';
import { Input } from '~/components/admin/ui/input';

interface NewTicket {
	title: string;
	status: 'critical' | 'pending' | 'completed';
	assignedTo: string | null;
	priority: 'High' | 'Medium' | 'Low';
	description: string;
	imageUrl?: string;
}

interface CreateTicketFormProps {
	onClose: () => void;
	onSubmitAction: (newTicket: NewTicket) => void;
}

export const CreateTicketForm = ({
	onClose,
	onSubmitAction,
	
}: CreateTicketFormProps) => {
	const [newTicket, setNewTicket] = useState<NewTicket>({
		title: '',
		status: 'pending',
		assignedTo: null,
		priority: 'Medium',
		description: '',
	});

	const handleChange = (field: keyof NewTicket, value: string) => {
		setNewTicket({ ...newTicket, [field]: value });
	};

	const handleSubmit = () => {
		onSubmitAction(newTicket);
		onClose();
	};

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle className="text-white">Crear Nuevo Ticket</DialogTitle>
			</DialogHeader>
			<div className="grid w-full max-w-md gap-4 space-y-4 rounded-lg bg-background p-4 py-4 text-sm text-white">
				<div>
					<Label htmlFor="title">Título</Label>
					<Input
						id="title"
						value={newTicket.title}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							handleChange('title', e.target.value)
						}
					/>
				</div>
				<div>
					<Label htmlFor="status">Estado</Label>
					<Select
						value={newTicket.status}
						onValueChange={(value: string) =>
							handleChange('status', value as NewTicket['status'])
						}
					>
						<SelectTrigger id="status">
							<SelectValue placeholder="Select status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pending">Pendiente</SelectItem>
							<SelectItem value="critical">Crítico</SelectItem>
							<SelectItem value="completed">Completado</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor="priority">Prioridad</Label>
					<Select
						value={newTicket.priority}
						onValueChange={(value: string) =>
							handleChange('priority', value as NewTicket['priority'])
						}
					>
						<SelectTrigger id="priority">
							<SelectValue placeholder="Select priority" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="High">Alta</SelectItem>
							<SelectItem value="Medium">Media</SelectItem>
							<SelectItem value="Low">Baja</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<Label htmlFor="description">Descripción</Label>
					<Textarea
						id="description"
						value={newTicket.description}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							handleChange('description', e.target.value)
						}
						rows={4}
					/>
				</div>
				<div>
					<Label htmlFor="image">Imagen del problema</Label>
					<Input
						id="image"
						type="file"
						accept="image/*"
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							const file: File | undefined = e.target.files?.[0];
							if (file) {
								const reader: FileReader = new FileReader();
								reader.onloadend = () => {
									handleChange('imageUrl', reader.result as string);
								};
								reader.readAsDataURL(file);
							}
						}}
					/>
				</div>
			</div>
			<div className="flex justify-end space-x-2 mt-4 text-white text-sm font-semibold text-right">
				<Button onClick={onClose} variant="outline">
					Cancelar
				</Button>
				<Button onClick={handleSubmit}>Crear Ticket</Button>
			</div>
		</DialogContent>
	);
};
