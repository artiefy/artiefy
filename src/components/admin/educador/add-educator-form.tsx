'use client';

import React, { useState } from 'react';

import { Button } from '~/components/admin/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/admin/ui/dialog';
import { Input } from '~/components/admin/ui/input';
import { Label } from '~/components/admin/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/admin/ui/select';

import type { Educator } from '~/types/types';

interface AddEducatorFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAddEducator: (educator: Educator) => void;
}

export function AddEducatorForm({
	open,
	onOpenChange,
	onAddEducator,
}: AddEducatorFormProps) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [specialization, setSpecialization] = useState('');
	const [role, setRole] = useState<'educador' | 'admin' | 'assistant'>(
		'educador'
	); // Cambiado de "teacher" a "educador"

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newEducator: Educator = {
			id: Date.now().toString(),
			name,
			email,
			phone,
			specialization,
			role,
			status: 'active',
			username: email.split('@')[0], // Assuming username is derived from email
			joinDate: new Date().toISOString(),
			courses: [],
			avatar: '/placeholder.svg?height=40&width=40',
			coursesTaught: 0, // Agregar propiedad coursesTaught
		};
		onAddEducator(newEducator);
		onOpenChange(false);
		// Reset form
		setName('');
		setEmail('');
		setPhone('');
		setSpecialization('');
		setRole('educador'); // Cambiado de "teacher" a "educador"
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Agregar Nuevo Educador</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Nombre</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">Teléfono</Label>
						<Input
							id="phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="specialization">Especialización</Label>
						<Input
							id="specialization"
							value={specialization}
							onChange={(e) => setSpecialization(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="role">Rol</Label>
						<Select
							value={role}
							onValueChange={(value: 'educador' | 'admin' | 'assistant') =>
								setRole(value)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Seleccionar rol" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="educador">Educador</SelectItem>
								<SelectItem value="admin">Administrador</SelectItem>
								<SelectItem value="assistant">Asistente</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<Button type="submit">Agregar Educador</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
