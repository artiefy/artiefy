'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '~/components/admin/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/admin/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/admin/ui/form';
import { Input } from '~/components/admin/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/admin/ui/select';

import type { Educator } from '~/types/types';

const SPECIALIZATIONS = [
	'Matemáticas',
	'Matemáticas',
	'Ciencias',
	'Literatura',
	'Historia',
	'Idiomas',
	'Arte',
	'Música',
	'Educación Física',
	'Tecnología',
	'Filosofía',
];

const roles = ['admin', 'teacher', 'assistant'] as const;
const roleEnum = z.enum(roles);

const formSchema = z.object({
	name: z.string().min(2, 'El nombre es requerido'),
	email: z.string().email('Email inválido'),
	phone: z.string().min(10, 'Teléfono inválido'),
	specialization: z.enum(SPECIALIZATIONS),
	role: roleEnum,
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
	onOpenChange: (open: boolean) => void;
	educator?: Educator;
	onSubmit: (data: z.infer<typeof formSchema>) => void;
}

export function EducatorForm({
	open,
	onOpenChange,
	educator,
	onSubmit,
}: EducatorFormProps) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: educator ?? {
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
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>
						{educator ? 'Editar Educador' : 'Nuevo Educador'}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecciona una especialización" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{SPECIALIZATIONS.map((spec) => (
												<SelectItem key={spec} value={spec}>
													{spec}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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
												<SelectItem value="teacher">Profesor</SelectItem>
												<SelectItem value="assistant">Asistente</SelectItem>
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
						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancelar
							</Button>
							<Button type="submit">
								{educator ? 'Guardar Cambios' : 'Crear Educador'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
