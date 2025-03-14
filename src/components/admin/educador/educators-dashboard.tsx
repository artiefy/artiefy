'use client';

import { useState } from 'react';

import {
	Filter,
	Plus,
	FileOutputIcon as FileExport,
	MoreHorizontal,
	History,
} from 'lucide-react';

import { EducatorProfile } from '~/components/admin/educador/educator-profile (1)';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/admin/ui/alert-dialog';
import { Badge } from '~/components/admin/ui/badge';
import { Button } from '~/components/admin/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';
import { Checkbox } from '~/components/admin/ui/checkbox';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '~/components/admin/ui/dropdown-menu';
import { Input } from '~/components/admin/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/admin/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/admin/ui/table';

import { CourseDetails } from './course-details';
import { EducatorForm } from './educator-form';
import { EducatorHistory } from './educator-history';

import type { HistoryEntry, Course, } from '~/types/types';

const SPECIALIZATIONS = [
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

interface Educator {
	id: string;
	name: string;
	email: string;
	phone: string;
	username: string;
	specialization: (typeof SPECIALIZATIONS)[number];
	coursesTaught: number;
	courses: Course[];
	status: 'active' | 'inactive';
	role: 'teacher' | 'admin' | 'assistant';
	joinDate: string;
	avatar: string;
}

// Actualizar los datos mock
const mockEducators: Educator[] = [
	{
		id: 'EDU-001',
		name: 'María González',
		username: 'maria.gonzalez',
		email: 'maria.gonzalez@example.com',
		specialization: 'Matemáticas',
		coursesTaught: 2,
		phone: '+34 600000001',
		courses: [
			{
				id: 'COURSE-001',
				title: 'Matemáticas Avanzadas',
				imageUrl: '/placeholder.svg?height=200&width=400',
				students: [], // Actualizar a tipo Student[]
				name: 'Curso de Matemáticas',
				email: 'curso@ejemplo.com',
				status: 'active',
				lessons: [],
			},
			{
				id: 'COURSE-002',
				title: 'Cálculo I',
				imageUrl: '/placeholder.svg?height=200&width=400',
				students: [], // Actualizar a tipo Student[]
				name: 'Curso de Matemáticas',
				email: 'curso@ejemplo.com',
				status: 'active',
				lessons: [],
			},
		],
		status: 'active',
		role: 'teacher',
		joinDate: '2024-01-15',
		avatar: '/placeholder.svg?height=40&width=40',
	},
	// Puedes agregar más educadores aquí
];

const mockHistory: HistoryEntry[] = [
	{
		id: '1',
		educatorId: 'EDU-001',
		action: 'create',
		changes: { status: 'active', role: 'teacher' },
		timestamp: '2024-01-15T10:00:00Z',
		performedBy: 'Admin',
		userId: 'admin-001',
		content: 'Created educator with status active and role teacher',
		createdAt: '2024-01-15T10:00:00Z',
	},
	// ... más entradas de historial
];

export default function EducatorsDashboard() {
	const [educators, setEducators] = useState<Educator[]>(mockEducators);
	const [searchQuery, setSearchQuery] = useState('');
	const [formOpen, setFormOpen] = useState(false);
	const [selectedEducator, setSelectedEducator] = useState<
		Educator | undefined
	>();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
	const [currentHistory, setCurrentHistory] = useState<HistoryEntry[]>([]);
	const [profileOpen, setProfileOpen] = useState(false);
	const [courseDetailsOpen, setCourseDetailsOpen] = useState(false);
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

	const filteredEducators = educators.filter(
		(educator) =>
			educator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			educator.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			educator.specialization.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handleCreateEducator = (_data: Partial<Educator>) => {
		// Implementar lógica de creación
		setFormOpen(false);
	};

	const handleEditEducator = (educator: Educator) => {
		setSelectedEducator(educator);
		setFormOpen(true);
	};

	const handleDeleteEducator = (educator: Educator) => {
		setSelectedEducator(educator);
		setDeleteDialogOpen(true);
	};

	const handleViewHistory = (educator: Educator) => {
		setCurrentHistory(mockHistory.filter((h) => h.educatorId === educator.id));
		setHistoryDialogOpen(true);
	};

	const handleSpecializationChange = (
		educatorId: string,
		newSpecialization: string
	) => {
		setEducators((prevEducators) =>
			prevEducators.map((educator) =>
				educator.id === educatorId
					? { ...educator, specialization: newSpecialization }
					: educator
			)
		);
	};

	const handleViewProfile = (educator: Educator) => {
		setSelectedEducator(educator);
		setProfileOpen(true);
	};

	const handleViewCourse = (course: Course) => {
		setSelectedCourse(course);
		setCourseDetailsOpen(true);
	};

	return (
		<div className="min-h-screen space-y-6 bg-background p-4 text-foreground md:p-6">
			<h1 className="text-2xl font-bold text-primary md:text-3xl">
				Gestión de Educadores
			</h1>

			<div className="grid gap-4 md:grid-cols-2">
				<Card className="bg-secondary">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total de Educadores
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{educators.length}</div>
					</CardContent>
				</Card>
				<Card className="bg-green-600">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Educadores Activos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{educators.filter((e) => e.status === 'active').length}
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<Input
						placeholder="Buscar educadores..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-[300px] bg-secondary text-foreground"
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="bg-secondary text-foreground"
							>
								<Filter className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="bg-popover text-popover-foreground">
							<DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>Estado</DropdownMenuLabel>
							<DropdownMenuItem>
								<Checkbox id="active" className="mr-2" />
								<label htmlFor="active">Activos</label>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Checkbox id="inactive" className="mr-2" />
								<label htmlFor="inactive">Inactivos</label>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>Especialización</DropdownMenuLabel>
							{SPECIALIZATIONS.map((spec) => (
								<DropdownMenuItem key={spec}>
									<Checkbox id={`spec-${spec}`} className="mr-2" />
									<label htmlFor={`spec-${spec}`}>{spec}</label>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="flex space-x-2">
					<Button
						variant="default"
						className="bg-primary text-primary-foreground"
						onClick={() => {
							setSelectedEducator(undefined);
							setFormOpen(true);
						}}
					>
						<Plus className="mr-2 h-4 w-4" />
						Nuevo Educador
					</Button>
					<Button variant="outline" className="bg-secondary text-foreground">
						<FileExport className="mr-2 h-4 w-4" />
						Exportar
					</Button>
				</div>
			</div>

			<div className="space-y-4">
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[100px]">ID</TableHead>
								<TableHead>Nombre</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Especialización</TableHead>
								<TableHead>Cursos Asociados</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead>Rol</TableHead>
								<TableHead className="text-right">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredEducators.map((educator) => (
								<TableRow
									key={educator.id}
									className="cursor-pointer hover:bg-accent/50"
									onClick={() => handleViewProfile(educator)}
								>
									<TableCell className="font-medium">{educator.id}</TableCell>
									<TableCell>{educator.name}</TableCell>
									<TableCell>{educator.email}</TableCell>
									<TableCell>
										<Select
											value={educator.specialization}
											onValueChange={(value) =>
												handleSpecializationChange(educator.id, value)
											}
										>
											<SelectTrigger className="w-[180px]">
												<SelectValue>{educator.specialization}</SelectValue>
											</SelectTrigger>
											<SelectContent>
												{SPECIALIZATIONS.map((spec) => (
													<SelectItem key={spec} value={spec}>
														{spec}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{educator.courses.map((course) => (
												<Badge
													key={course.id}
													variant="secondary"
													className="bg-accent text-accent-foreground"
												>
													{course.title}
												</Badge>
											))}
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={
												educator.status === 'active' ? 'default' : 'secondary'
											}
											className={
												educator.status === 'active'
													? 'bg-green-600'
													: 'bg-secondary'
											}
										>
											{educator.status === 'active' ? 'Activo' : 'Inactivo'}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant="outline"
											className="bg-secondary text-foreground"
										>
											{educator.role}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													className="text-foreground"
												>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="bg-popover text-popover-foreground"
											>
												<DropdownMenuItem
													onClick={() => handleEditEducator(educator)}
												>
													Editar
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleViewHistory(educator)}
												>
													<History className="mr-2 h-4 w-4" />
													Ver historial
												</DropdownMenuItem>
												<DropdownMenuItem
													className="text-destructive"
													onClick={() => handleDeleteEducator(educator)}
												>
													Eliminar
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>

			<EducatorForm
				open={formOpen}
				onOpenChange={setFormOpen}
				educator={selectedEducator}
				onSubmit={handleCreateEducator}
			/>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent className="bg-background text-foreground">
					<AlertDialogHeader>
						<AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
						<AlertDialogDescription>
							Esta acción no se puede deshacer. Se eliminará permanentemente el
							educador y todos sus datos asociados.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="bg-secondary text-foreground">
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction className="bg-destructive text-destructive-foreground">
							Eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
				<AlertDialogContent className="max-w-3xl bg-background text-foreground">
					<AlertDialogHeader>
						<AlertDialogTitle>Historial de Cambios</AlertDialogTitle>
					</AlertDialogHeader>
					<div className="max-h-[60vh] overflow-y-auto">
						<EducatorHistory history={currentHistory} />
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel className="bg-secondary text-foreground">
							Cerrar
						</AlertDialogCancel>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{selectedEducator && (
				<EducatorProfile
					open={profileOpen}
					onOpenChange={setProfileOpen}
					educator={selectedEducator}
					onViewCourse={handleViewCourse}
				/>
			)}

			{selectedCourse && (
				<CourseDetails
					open={courseDetailsOpen}
					onOpenChange={setCourseDetailsOpen}
					course={selectedCourse}
				/>
			)}
		</div>
	);
}
