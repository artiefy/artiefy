'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '~/components/admin/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/admin/ui/form';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/admin/ui/dialog';
import { Input } from '~/components/admin/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/admin/ui/select';
import type { Educator } from '~/types/types';

const formSchema = z.object({
	name: z.string().min(2, 'El nombre es requerido'),
	email: z.string().email('Email inválido'),
	phone: z.string().min(10, 'Teléfono inválido'),
	specialization: z.string().min(2, 'La especialización es requerida'),
	role: z.enum(['admin', 'teacher', 'assistant', 'educador']),
	status: z.enum(['active', 'inactive']),
	username: z
		.string()
		.min(4, 'El nombre de usuario debe tener al menos 4 caracteres'),
	password: z
		.string()
		.min(6, 'La contraseña debe tener al menos 6 caracteres')
		.optional(),
});

interface EducatorFormProps {
	open: boolean;
	onOpenChangeAction: (open: boolean) => void;
	educator?: Educator;
	onSubmitAction: (data: z.infer<typeof formSchema>) => void;
}

export function EducatorForm({
	open,
	onOpenChangeAction,
	educator,
	onSubmitAction,
}: EducatorFormProps) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: educator || {
			name: '',
			email: '',
			phone: '',
			specialization: '',
			role: 'teacher',
			status: 'active',
			username: '',
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChangeAction}>
			<DialogContent className="sm:max-w-[525px w-full] bg-white">
				<DialogHeader>
					<DialogTitle>
						{educator ? 'Editar Educador' : 'Nuevo Educador'}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmitAction)}
						className="space-y-4 rounded-lg bg-white p-4 shadow sm:p-6"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nombre Completo</FormLabel>
									<FormControl>
										<Input placeholder="Juan Pérez" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input placeholder="juan@ejemplo.com" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Teléfono</FormLabel>
										<FormControl>
											<Input placeholder="+34 600000000" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="specialization"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Especialización</FormLabel>
									<FormControl>
										<Input placeholder="Matemáticas" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Rol</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar rol" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="admin">Administrador</SelectItem>
												<SelectItem value="assistant">Asistente</SelectItem>
												<SelectItem value="educador">Educador</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Estado</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Seleccionar estado" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="active">Activo</SelectItem>
												<SelectItem value="inactive">Inactivo</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nombre de Usuario</FormLabel>
										<FormControl>
											<Input placeholder="juanperez" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{!educator && (
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Contraseña</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder="••••••"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</div>
						<div className="flex justify-end gap-2 text-right text-white">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChangeAction(false)}
							>
								Cancelar
							</Button>
							<Button className="text-black" type="submit">
								{educator ? 'Guardar Cambios' : 'Crear Educador'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
