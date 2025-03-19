'use client';
import React, { useState, useEffect, useCallback } from 'react';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

import {
	Loader2,
	X,
	XCircle,
	Edit,
	Trash2,
	UserPlus,
	Check,
	Eye,
	Paperclip,
} from 'lucide-react';
import SunEditor from 'suneditor-react';

import AnuncioPreview from '~/app/dashboard/super-admin/anuncios/AnuncioPreview';
import EditUserModal from '~/app/dashboard/super-admin/users/EditUserModal'; // Ajusta la ruta según la ubicación de tu componente
import CourseCarousel from '~/components/super-admin/CourseCarousel';
import {
	setRoleWrapper,
	deleteUser,
	updateUserInfo,
} from '~/server/queries/queries';

import BulkUploadUsers from './components/BulkUploadUsers'; // Ajusta la ruta según la ubicación de tu componente
import { ConfirmDialog } from './components/ConfirmDialog';
import { InfoDialog } from './components/InfoDialog';
import 'suneditor/dist/css/suneditor.min.css';

interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	status: string;
	selected?: boolean;
	isNew?: boolean;
}

type ConfirmationState = {
	isOpen: boolean;
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel?: () => void;
} | null;

interface ViewUserResponse {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	profileImage?: string; // Opcional si viene de Clerk
	createdAt?: string; // Fecha de creación opcional
	role: string;
	status: string;
	password?: string; // Puede estar presente en algunos casos
	courses?: Course[]; // Puede incluir cursos
}

interface UserData {
	id: string;
	firstName?: string; // Puede ser opcional si a veces solo tienes `name`
	lastName?: string;
	name?: string; // En algunos casos puede venir como `name`
	email: string;
	profileImage?: string;
	createdAt?: string;
	role?: string;
	status?: string;
	password?: string;
	permissions?: string[]; // Asegurar que siempre sea un array
}

interface Course {
	id: string;
	title: string;
	coverImageKey: string | null; // Añadimos la propiedad coverImageKey
	coverImage?: string;
	instructor: string;
	modalidad?: { name: string };
	rating?: number;
}

interface CoursesData {
	courses: Course[];
}

export default function AdminDashboard() {
	const [users, setUsers] = useState<User[]>([]);
	// 🔍 Estados de búsqueda y filtros
	const [searchQuery, setSearchQuery] = useState(''); // Búsqueda por nombre o correo
	const [roleFilter, setRoleFilter] = useState(''); // Filtro por rol
	const [statusFilter, setStatusFilter] = useState(''); // Filtro por estado
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [updatingUserId, setUpdatingUserId] = useState<string | null>(
		null as string | null
	);
	if (typeof updatingUserId === 'string' && updatingUserId) {
		// Variable utilizada para evitar warnings, no afecta la lógica
	}

	const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
	const [notification, setNotification] = useState<{
		message: string;
		type: 'success' | 'error';
	} | null>(null);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [programs, setPrograms] = useState<{ id: string; title: string }[]>([]);

	const [editValues, setEditValues] = useState<{
		firstName: string;
		lastName: string;
	}>({
		firstName: '',
		lastName: '',
	});
	const [infoDialogOpen, setInfoDialogOpen] = useState(false);
	const [infoDialogTitle, setInfoDialogTitle] = useState('');
	const [infoDialogMessage, setInfoDialogMessage] = useState('');
	interface Anuncio {
		id: string;
		title: string;
	}

	const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
	if (typeof anuncios === 'string' && anuncios) {
		// Variable utilizada para evitar warnings, no afecta la lógica
	}

	const [showAnuncioModal, setShowAnuncioModal] = useState(false);
	const [showEmailModal, setShowEmailModal] = useState(false); // ✅ Nuevo estado para mostrar el modal de correos
	const [selectedEmails, setSelectedEmails] = useState<string[]>([]); // ✅ Para almacenar los emails seleccionados
	const [customEmails, setCustomEmails] = useState(''); // ✅ Para agregar emails manualmente
	const [subject, setSubject] = useState(''); // ✅ Asunto del correo
	const [message, setMessage] = useState(''); // ✅ Mensaje del correo
	const [loadingEmail, setLoadingEmail] = useState(false); // ✅ Estado de carga para el envío de correos
	const [attachments, setAttachments] = useState<File[]>([]);
	const [previewAttachments, setPreviewAttachments] = useState<string[]>([]);

	const [newAnuncio, setNewAnuncio] = useState({
		titulo: '',
		descripcion: '',
		imagen: null as File | null,
		previewImagen: null as string | null,
		tipo_destinatario: 'todos' as 'todos' | 'cursos' | 'programas' | 'custom',
		cursoId: null as number | null,
	});

	const searchParams = useSearchParams();
	const query = searchParams.get('search') ?? '';
	const [newUser, setNewUser] = useState({
		firstName: '',
		lastName: '',
		email: '',
		role: 'estudiante',
	});
	const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
	const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

	const [creatingUser, setCreatingUser] = useState(false);
	const [viewUser, setViewUser] = useState<ViewUserResponse | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	if (typeof showPassword === 'string' && showPassword) {
		// Variable utilizada para evitar warnings, no afecta la lógica
	}

	const [showCreateForm, setShowCreateForm] = useState(false);
	const handleUserSelection = useCallback((userId: string, email: string) => {
		setSelectedUsers((prevSelected) =>
			prevSelected.includes(userId)
				? prevSelected.filter((id) => id !== userId)
				: [...prevSelected, userId]
		);

		setSelectedEmails((prevEmails) => {
			if (prevEmails.includes(email)) {
				return prevEmails.filter((e) => e !== email);
			} else {
				return [...prevEmails, email];
			}
		});
	}, []);

	// 1️⃣ Filtrar usuarios
	const filteredUsers = users.filter(
		(user) =>
			(searchQuery === '' ||
				user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
			(roleFilter ? user.role === roleFilter : true) &&
			(statusFilter ? user.status === statusFilter : true)
	);

	const fetchPrograms = useCallback(async () => {
		try {
			const res = await fetch('/api/super-admin/programs'); // Ajusta la URL según tu API
			if (!res.ok) throw new Error('Error al obtener programas');

			const data = (await res.json()) as { id: string; title: string }[];
			setPrograms(data);
		} catch (error) {
			console.error('Error fetching programs:', error);
		}
	}, []);

	useEffect(() => {
		void fetchPrograms();
	}, [fetchPrograms]);

	// 2️⃣ Definir la paginación
	const [currentPage, setCurrentPage] = useState(1);
	const usersPerPage = 10;
	const indexOfLastUser = currentPage * usersPerPage;
	const indexOfFirstUser = indexOfLastUser - usersPerPage;
	const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

	const [showAssignModal, setShowAssignModal] = useState(false);
	const handleSelectStudent = (userId: string) => {
		setSelectedStudents((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId]
		);
	};

	const fetchCourses = useCallback(async () => {
		try {
			const res = await fetch('/api/educadores/courses');
			if (!res.ok) throw new Error('Error al cargar cursos');
			const rawData: unknown = await res.json();
			if (!Array.isArray(rawData)) throw new Error('Invalid data received');
			const data: { id: string; title: string }[] = rawData.filter(
				(item): item is { id: string; title: string } =>
					typeof item === 'object' &&
					item !== null &&
					'id' in item &&
					'title' in item
			);
			setCourses(data);
		} catch (err) {
			console.error('Error fetching courses:', err);
		}
	}, []);
	const fetchAnuncios = async (userId: string) => {
		try {
			const res = await fetch('/api/super-admin/anuncios/view-anuncio', {
				headers: { 'x-user-id': userId },
			});
			if (!res.ok) throw new Error('Error al obtener anuncios');

			const data = (await res.json()) as { id: string; title: string }[];
			setAnuncios(data);
		} catch (error) {
			console.error('❌ Error al obtener anuncios:', error);
		}
	};

	const sendEmail = async () => {
		console.log('📩 Enviando correo...');
		if (
			!subject ||
			!message ||
			(selectedEmails.length === 0 && !customEmails.trim())
		) {
			setNotification({
				message: 'Todos los campos son obligatorios',
				type: 'error',
			});
			console.error('❌ Error: Faltan datos obligatorios');
			return;
		}

		setLoadingEmail(true);

		const emails = Array.from(
			new Set([
				...selectedEmails,
				...customEmails.split(',').map((e) => e.trim()),
			])
		);

		try {
			const formData = new FormData();
			formData.append('subject', subject);
			formData.append('message', message);
			emails.forEach((email) => formData.append('emails[]', email));

			// Adjuntar archivos
			attachments.forEach((file) => formData.append('attachments', file));

			const response = await fetch('/api/super-admin/emails', {
				method: 'POST',
				body: formData, // ✅ Enviamos como FormData
			});

			if (!response.ok) throw new Error('Error al enviar el correo');

			console.log('✅ Correo enviado con éxito');
			setNotification({
				message: 'Correo enviado correctamente',
				type: 'success',
			});

			// Resetear los campos después del envío
			setSubject('');
			setMessage('');
			setSelectedEmails([]);
			setCustomEmails('');
			setAttachments([]);
			setPreviewAttachments([]);
			setShowEmailModal(false);
		} catch (error) {
			console.error('❌ Error al enviar el correo:', error);
			setNotification({ message: 'Error al enviar el correo', type: 'error' });
		} finally {
			setLoadingEmail(false);
		}
	};

	// Llamar la función cuando el componente se monta si hay un usuario autenticado
	useEffect(() => {
		const currentUser = users.find((u) => selectedUsers.includes(u.id));
		if (currentUser?.id) {
			void fetchAnuncios(currentUser.id);
		}
	}, [users, selectedUsers]);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files?.length) {
			const file = event.target.files[0];
			setNewAnuncio((prev) => ({
				...prev,
				imagen: file,
				previewImagen: URL.createObjectURL(file),
			}));
		}
	};
	const handleAttachmentChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		if (event.target.files?.length) {
			const files = Array.from(event.target.files);
			setAttachments((prev) => [...prev, ...files]);

			// Generar previsualizaciones
			const filePreviews = files.map((file) => URL.createObjectURL(file));
			setPreviewAttachments((prev) => [...prev, ...filePreviews]);
		}
	};

	const removeAttachment = (index: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index));
		setPreviewAttachments((prev) => prev.filter((_, i) => i !== index));
	};

	const handleManualEmailAdd = (
		event: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (event.key === 'Enter' && customEmails.trim()) {
			event.preventDefault(); // Evita que el `Enter` haga un submit del formulario

			const emails = customEmails
				.split(',')
				.map((email) => email.trim())
				.filter((email) => email !== '');

			// Agregar solo correos válidos y evitar duplicados
			setSelectedEmails((prev) => [...new Set([...prev, ...emails])]);
			setCustomEmails('');
		}
	};

	const handleCreateAnuncio = async () => {
		if (
			!newAnuncio.titulo.trim() ||
			!newAnuncio.descripcion.trim() ||
			!newAnuncio.imagen
		) {
			alert('Todos los campos son obligatorios.');
			return;
		}

		try {
			// 🔹 Subir la imagen primero a S3
			const uploadRequest = await fetch('/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contentType: newAnuncio.imagen.type,
					fileSize: newAnuncio.imagen.size,
				}),
			});

			if (!uploadRequest.ok) throw new Error('Error al obtener la URL firmada');

			const uploadData = (await uploadRequest.json()) as {
				url: string;
				fields: Record<string, string>;
				key: string;
			};
			const { url, fields, key } = uploadData;

			const formData = new FormData();
			Object.entries(fields).forEach(([key, value]) =>
				formData.append(key, value)
			);
			formData.append('file', newAnuncio.imagen);

			const s3UploadResponse = await fetch(url, {
				method: 'POST',
				body: formData,
			});

			if (!s3UploadResponse.ok) throw new Error('Error al subir la imagen');

			const imageUrl = `${key}`;

			// 🔹 Guardar el anuncio con los destinatarios seleccionados
			const destinatarios: string[] =
				newAnuncio.tipo_destinatario === 'cursos'
					? (selectedCourses ?? [])
					: newAnuncio.tipo_destinatario === 'programas'
						? (selectedPrograms ?? [])
						: newAnuncio.tipo_destinatario === 'custom'
							? (selectedUsers ?? [])
							: [];

			console.log('📌 Destinatarios enviados:', destinatarios);

			const response = await fetch('/api/super-admin/anuncios', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					titulo: newAnuncio.titulo,
					descripcion: newAnuncio.descripcion,
					imagenUrl: imageUrl,
					tipo_destinatario: newAnuncio.tipo_destinatario,
					courseIds:
						newAnuncio.tipo_destinatario === 'cursos' ? selectedCourses : [],
					programaIds:
						newAnuncio.tipo_destinatario === 'programas'
							? selectedPrograms
							: [],
					userIds:
						newAnuncio.tipo_destinatario === 'custom' ? selectedUsers : [],
				}),
			});

			if (!response.ok) throw new Error('Error al guardar el anuncio');

			alert('Anuncio guardado correctamente');
			setShowAnuncioModal(false);
		} catch (error) {
			console.error('❌ Error al guardar anuncio:', error);
			alert('Error al guardar el anuncio.');
		}
	};

	const handleAssignStudents = async () => {
		if (!selectedCourse || selectedStudents.length === 0) return;

		try {
			const res = await fetch('/api/enrollments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					courseId: selectedCourse,
					userIds: selectedStudents,
				}),
			});

			if (!res.ok) throw new Error('Error al asignar estudiantes');

			const result = (await res.json()) as {
				added: number;
				alreadyEnrolled: number;
				message: string;
			};
			const { message } = result;

			// 🔹 Cierra el modal antes de mostrar la confirmación
			setShowAssignModal(false);

			// 🔹 Espera un pequeño tiempo para evitar superposición de animaciones
			setTimeout(() => {
				setConfirmation({
					isOpen: true,
					title: 'Asignación de Estudiantes',
					message: `${message} \n\n ¿Quieres seguir asignando más estudiantes?`,
					onConfirm: () => {
						//  Si el usuario quiere seguir, vuelve a abrir el modal
						setSelectedStudents([]);
						setSelectedCourse(null);
						setShowAssignModal(true);
					},
					onCancel: () => {
						//  Si el usuario no quiere seguir, cierra la confirmación
						setConfirmation(null);
					},
				});
			}, 300); // 🔹 Esperamos 300ms para evitar superposición de animaciones
		} catch {
			showNotification('Error al asignar estudiantes', 'error');
		}
	};

	const handleViewUser = async (user: User): Promise<void> => {
		try {
			// Obtener información básica del usuario
			const userRes = await fetch(`/api/super-admin/infoUser?id=${user.id}`);
			if (!userRes.ok) throw new Error('Error al obtener datos del usuario');

			const userData: UserData = (await userRes.json()) as UserData;

			// Validar que los datos sean correctos
			if (!userData?.name || !userData?.email || !userData?.id) {
				throw new Error('Datos del usuario inválidos');
			}

			// Extraer el primer y segundo nombre de `name` (en caso de que tenga más de un nombre)
			const [firstName, lastName] = userData.name.split(' ');

			const validUserData: ViewUserResponse = {
				id: String(userData.id),
				firstName: firstName || 'Nombre no disponible',
				lastName: lastName || 'Apellido no disponible',
				email: String(userData.email),
				profileImage: userData.profileImage ?? '/default-avatar.png',
				createdAt: userData.createdAt ?? 'Fecha no disponible',
				role: userData.role ?? 'Sin rol',
				status: userData.status ?? 'Activo',
				password: userData.password ?? 'No disponible',
				courses: [], // Esto se completará con los cursos más tarde
			};

			// Guardar el usuario con los cursos en el estado
			setViewUser(validUserData);

			// Obtener los cursos
			const coursesRes = await fetch(
				`/api/super-admin/userCourses?userId=${user.id}`
			);
			if (!coursesRes.ok) throw new Error('Error al obtener los cursos');

			const coursesData = (await coursesRes.json()) as CoursesData;

			// Validar que los cursos sean correctos
			if (!coursesData || !Array.isArray(coursesData.courses)) {
				throw new Error('Error en los datos de los cursos');
			}

			// Mapear los cursos
			console.log(
				'📌 Cursos obtenidos en `handleViewUser`:',
				coursesData.courses
			);
			const courses = coursesData.courses.map((course) => ({
				id: course.id,
				title: course.title || 'Sin título',
				coverImageKey: course.coverImageKey ?? null,
				coverImage: course.coverImage ?? '/default-course.jpg',
				instructor: course.instructor || 'Instructor no disponible',
			}));

			// Actualizar el estado con los cursos
			setViewUser({
				...validUserData,
				courses,
			});

			setShowPassword(false);
		} catch (error) {
			console.error('Error al obtener usuario o cursos:', error);
		}
	};

	useEffect(() => {
		void fetchCourses();
	}, [fetchCourses]);

	const fetchUsers = useCallback(async () => {
		try {
			const res = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
			if (!res.ok) throw new Error('Error al cargar usuarios');

			const rawData: unknown = await res.json();
			if (!Array.isArray(rawData)) throw new Error('Datos inválidos recibidos');

			const data: User[] = (rawData as User[]).map((item) => ({
				id: String(item.id),
				firstName: String(item.firstName),
				lastName: String(item.lastName),
				email: String(item.email),
				role: String(item.role),
				status: String(item.status),
				permissions:
					'permissions' in item && Array.isArray(item.permissions)
						? item.permissions
						: [], // ✅ Asegura que `permissions` se guarden correctamente
			}));

			setUsers(data);
			console.log('✅ Usuarios cargados con permisos:', data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Error desconocido');
			console.error('Error fetching users:', err);
		} finally {
			setLoading(false);
		}
	}, [query]);

	// ✅ Ahora, `useEffect` ya no mostrará advertencias
	useEffect(() => {
		void fetchUsers();
	}, [fetchUsers]);

	const showNotification = useCallback(
		(message: string, type: 'success' | 'error') => {
			setNotification({ message, type });
			setTimeout(() => setNotification(null), 3000);
		},
		[]
	);

	interface CreateUserResponse {
		user: {
			id: string;
			username: string;
		};
		generatedPassword: string;
	}

	const handleCreateUser = async () => {
		if (
			!newUser.firstName.trim() ||
			!newUser.lastName.trim() ||
			!newUser.email.trim()
		) {
			showNotification('Todos los campos son obligatorios.', 'error');
			return;
		}

		try {
			setCreatingUser(true);
			const res = await fetch('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					email: newUser.email,
					role: newUser.role,
				}),
			});

			if (!res.ok) {
				throw new Error('No se pudo crear el usuario');
			}

			const rawData: unknown = await res.json();
			if (
				typeof rawData !== 'object' ||
				rawData === null ||
				!('user' in rawData) ||
				!('generatedPassword' in rawData)
			) {
				throw new Error('Respuesta de la API en formato incorrecto');
			}

			const { user: safeUser, generatedPassword } =
				rawData as CreateUserResponse;
			if (
				!safeUser ||
				typeof safeUser !== 'object' ||
				!('id' in safeUser) ||
				!('username' in safeUser)
			) {
				throw new Error('Usuario inválido en la respuesta de la API');
			}

			const username = safeUser.username;
			setUsers([
				{
					id: safeUser.id,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					email: newUser.email,
					role: newUser.role,
					status: 'activo',
					isNew: true, // 🔹 Marcar como usuario nuevo
				},
				...users,
			]);

			setInfoDialogTitle('Usuario Creado');
			setInfoDialogMessage(
				`Se ha creado el usuario "${username}" con la contraseña: ${generatedPassword}`
			);
			setInfoDialogOpen(true);

			// ✅ Cerrar el modal después de crear el usuario
			setShowCreateForm(false);

			setNewUser({
				firstName: '',
				lastName: '',
				email: '',
				role: 'estudiante',
			});
		} catch {
			showNotification('Error al crear el usuario.', 'error');
		} finally {
			setCreatingUser(false);
		}
	};

	const handleMassUpdateStatus = async (newStatus: string) => {
		if (selectedUsers.length === 0) {
			showNotification('No has seleccionado usuarios.', 'error');
			return;
		}

		try {
			await fetch('/api/users', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'updateMultipleStatus',
					userIds: selectedUsers,
					status: newStatus,
				}),
			});

			setUsers(
				users.map((user) =>
					selectedUsers.includes(user.id)
						? { ...user, status: newStatus }
						: user
				)
			);
			setSelectedUsers([]);
			showNotification(`Usuarios actualizados a ${newStatus}.`, 'success');
		} catch {
			showNotification('Error al actualizar usuarios.', 'error');
		}
	};

	const handleRoleChange = (userId: string, newRole: string) => {
		setConfirmation({
			isOpen: true,
			title: 'Actualizar Rol',
			message: `¿Estás seguro de que quieres cambiar el rol de este usuario a ${newRole}?`,
			onConfirm: () => {
				void (async () => {
					try {
						setUpdatingUserId(userId);
						await setRoleWrapper({ id: userId, role: newRole });

						setUsers(
							users.map((user) =>
								user.id === userId ? { ...user, role: newRole } : user
							)
						);

						showNotification('Rol actualizado con éxito.', 'success');
					} catch {
						showNotification('Error al actualizar el rol.', 'error');
					} finally {
						setUpdatingUserId(null);
					}
				})(); // Llamamos la función inmediatamente
			},
		});
	};

	const handleStatusChange = (userId: string, newStatus: string) => {
		setConfirmation({
			isOpen: true,
			title: 'Actualizar Estado',
			message: `¿Estás seguro de que quieres cambiar el estado del usuario a "${newStatus}"?`,
			onConfirm: () => {
				void (async () => {
					try {
						setUpdatingUserId(userId);
						await fetch('/api/users', {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								action: 'updateStatus',
								id: userId,
								status: newStatus,
							}),
						});

						setUsers(
							users.map((user) =>
								user.id === userId ? { ...user, status: newStatus } : user
							)
						);

						showNotification('Estado actualizado con éxito.', 'success');
					} catch {
						showNotification('Error al actualizar el estado.', 'error');
					} finally {
						setUpdatingUserId(null);
						setConfirmation(null);
					}
				})(); // Ejecutamos la función inmediatamente
			},
		});
	};

	const handleMassRemoveRole = () => {
		if (selectedUsers.length === 0) {
			showNotification('No has seleccionado usuarios.', 'error');
			return;
		}

		setConfirmation({
			isOpen: true,
			title: 'Eliminar Roles',
			message:
				'¿Estás seguro de que quieres eliminar el rol de los usuarios seleccionados?',
			onConfirm: () => {
				void (async () => {
					try {
						await fetch('/api/users', {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								action: 'removeRole',
								userIds: selectedUsers,
							}),
						});

						// Actualizar los usuarios en el estado local
						setUsers(
							users.map((user) =>
								selectedUsers.includes(user.id)
									? { ...user, role: 'sin-role' }
									: user
							)
						);

						setSelectedUsers([]); // Limpiar selección
						showNotification('Roles eliminados con éxito.', 'success');
					} catch {
						showNotification('Error al eliminar roles.', 'error');
					} finally {
						setConfirmation(null);
					}
				})(); // ✅ Ejecutamos la función inmediatamente
			},
		});
	};

	const handleDeleteUser = (userId: string) => {
		setConfirmation({
			isOpen: true,
			title: 'Eliminar Usuario',
			message:
				'¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.',
			onConfirm: () => {
				void (async () => {
					try {
						setUpdatingUserId(userId);
						await deleteUser(userId);

						setUsers(users.filter((user) => user.id !== userId));
						showNotification('Usuario eliminado correctamente.', 'success');
					} catch {
						showNotification('Error al eliminar el usuario.', 'error');
					} finally {
						setUpdatingUserId(null);
						setConfirmation(null);
					}
				})(); // ✅ Ejecutamos la función inmediatamente
			},
		});
	};

	const handleSaveUser = () => {
		if (!editingUser) return; // Evita que sea null

		void (async () => {
			try {
				setUpdatingUserId(editingUser.id);
				await updateUserInfo(
					editingUser.id,
					editValues.firstName,
					editValues.lastName
				);

				setUsers(
					users.map((user) =>
						user.id === editingUser.id
							? {
									...user,
									firstName: editValues.firstName,
									lastName: editValues.lastName,
								}
							: user
					)
				);

				setEditingUser(null);
				showNotification('Usuario actualizado con éxito.', 'success');
			} catch {
				showNotification('Error al actualizar usuario.', 'error');
			} finally {
				setUpdatingUserId(null);
			}
		})();
	};

	const [modalIsOpen, setModalIsOpen] = useState(false); // ✅ Asegurar que está definido
	const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
	const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

	const handleMassUserUpload = useCallback(
		(newUsers: User[]) => {
			if (!newUsers || newUsers.length === 0) return;

			// 🔹 Mantener `isNew: true` sin afectar los usuarios previos
			setUsers((prevUsers) => [
				...newUsers.map((user) => ({ ...user, isNew: true })), // Nuevos usuarios en azul
				...prevUsers, // Mantener los usuarios anteriores
			]);

			// ✅ Mostrar notificación de éxito
			showNotification(
				`Se crearon ${newUsers.length} nuevos usuarios`,
				'success'
			);

			// ✅ Cerrar el modal sin recargar la página

			if (modalIsOpen) {
				setModalIsOpen(false);
			}
		},
		[showNotification, modalIsOpen]
	);

	const handleEditUser = async (user: User) => {
		try {
			// 🔹 Obtener los datos del usuario desde Clerk
			const res = await fetch(`/api/super-admin/infoUserUpdate?id=${user.id}`);
			if (!res.ok) throw new Error('Error al obtener datos del usuario');

			const userData: UserData = (await res.json()) as UserData;

			// ✅ Extraer correctamente `firstName` y `lastName`
			const firstName = userData.firstName ?? user.firstName; // Usa `firstName` desde Clerk si existe
			const lastName = userData.lastName ?? user.lastName; // Usa `lastName` desde Clerk si existe

			// 🔹 Asegurar que los permisos sean un array
			const userWithPermissions = {
				...userData,
				firstName, // ✅ Ahora `firstName` se almacena correctamente
				lastName, // ✅ Ahora `lastName` se almacena correctamente
				permissions: Array.isArray(userData.permissions)
					? userData.permissions
					: [],
			};

			console.log('📌 Usuario con permisos:', userWithPermissions);

			// ✅ Guardar el usuario en el estado para abrir el modal con la info actualizada
			setEditingUser({
				...userWithPermissions,
				role: userWithPermissions.role ?? 'sin-role',
				status: userWithPermissions.status ?? 'sin-status',
			});

			// ✅ Asegurar que los campos de edición se actualicen con `firstName` y `lastName`
			setEditValues({
				firstName,
				lastName,
			});
		} catch (error) {
			console.error('❌ Error al obtener usuario:', error);
		}
	};

	return (
		<>
			{/* 🔎 Barra de Búsqueda y Filtro */}

			<header className="flex items-center justify-between rounded-lg bg-[#00BDD8] p-6 text-3xl font-bold text-[#01142B] shadow-md">
				<h1>Administrador de usuarios</h1>
			</header>
			{/* 🔎 Barra de Búsqueda y Filtro */}

			<div className="p-6">
				<p className="mb-6 text-lg text-white">
					Aquí puedes gestionar los usuarios y sus roles.
				</p>

				{error && (
					<div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
						<p>{error}</p>
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center p-8">
						<Loader2 className="size-6 animate-spin text-primary" />
						<span className="ml-2">Cargando usuarios...</span>
					</div>
				) : (
					<>
						{showCreateForm && (
							<div className="bg-opacity-30 fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
								<div className="relative z-50 w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-2xl">
									{/* Header del formulario con botón de cierre */}
									<div className="mb-4 flex items-center justify-between">
										<h2 className="text-lg font-bold text-white">
											Crear Nuevo Usuario
										</h2>
										<button onClick={() => setShowCreateForm(false)}>
											<X className="size-6 text-gray-300 hover:text-white" />
										</button>
									</div>

									{/* Formulario de creación */}
									<div className="space-y-4">
										<input
											type="text"
											placeholder="Nombre"
											className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
											value={newUser.firstName}
											onChange={(e) =>
												setNewUser({ ...newUser, firstName: e.target.value })
											}
										/>
										<input
											type="text"
											placeholder="Apellido"
											className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
											value={newUser.lastName}
											onChange={(e) =>
												setNewUser({ ...newUser, lastName: e.target.value })
											}
										/>
										<input
											type="email"
											placeholder="Correo electrónico"
											className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
											value={newUser.email}
											onChange={(e) =>
												setNewUser({ ...newUser, email: e.target.value })
											}
										/>
										<select
											className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white"
											value={newUser.role}
											onChange={(e) =>
												setNewUser({ ...newUser, role: e.target.value })
											}
										>
											<option value="admin">Admin</option>
											<option value="super-admin">super-admin</option>
											<option value="educador">Educador</option>
											<option value="estudiante">Estudiante</option>
										</select>
									</div>

									{/* Botón para crear usuario */}
									<button
										onClick={handleCreateUser}
										className="mt-4 flex w-full justify-center rounded-md bg-primary px-4 py-2 font-bold text-white hover:bg-secondary"
										disabled={creatingUser}
									>
										{creatingUser ? (
											<Loader2 className="size-5 animate-spin" />
										) : (
											'Crear Usuario'
										)}
									</button>
								</div>
							</div>
						)}
						{viewUser && (
							<div className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-md">
								<div className="relative z-50 w-full max-w-5xl rounded-lg bg-[#01142B] p-8 text-white shadow-[0_0px_50px_rgba(0,189,216,0.7)]">
									{/* Información del Usuario */}
									<div className="flex">
										{/* Foto de Perfil */}
										<div className="ml-20 h-48 w-48 overflow-hidden rounded-full border-4 border-[#3AF4EF]">
											{viewUser.profileImage ? (
												<Image
													src={viewUser.profileImage}
													alt="Foto de perfil"
													layout="fill"
													objectFit="cover"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center bg-gray-600 text-center text-5xl text-white">
													{viewUser.firstName?.charAt(0)}
												</div>
											)}
										</div>

										{/* Información del Usuario */}
										<div className="ml-80 flex flex-col justify-start space-x-4">
											<p className="text-4xl font-semibold">
												{viewUser.firstName} {viewUser.lastName}
											</p>
											<p className="text-lg text-gray-400">{viewUser.email}</p>
											<p className="mt-2 text-lg">
												<strong>Rol:</strong>{' '}
												<span className="font-bold text-[#3AF4EF]">
													{viewUser.role}
												</span>
											</p>
											<p className="text-lg">
												<strong>Estado:</strong>{' '}
												<span className="font-bold text-[#3AF4EF]">
													{viewUser.status}
												</span>
											</p>
											<p className="text-lg">
												<strong>Fecha de Creación:</strong>{' '}
												{viewUser.createdAt ?? 'Fecha no disponible'}
											</p>
										</div>
									</div>

									{/* 🔹 Carrusel de Cursos dentro del modal */}
									<div className="">
										<h3 className="text-2xl font-bold text-white">
											Cursos del Estudiante
										</h3>
										{viewUser.courses && viewUser.courses.length > 0 ? (
											<CourseCarousel
												courses={viewUser.courses}
												userId={viewUser.id}
											/>
										) : (
											<p className="text-gray-400">
												Este usuario no está inscrito en ningún curso.
											</p>
										)}
									</div>

									{/* Botón de Cerrar */}
									<div className="mt-0 text-center">
										<button
											onClick={() => setViewUser(null)}
											className="rounded bg-red-500 px-6 py-3 text-white transition hover:bg-red-600"
										>
											Cerrar
										</button>
									</div>
								</div>
							</div>
						)}

						{showAssignModal && (
							<div className="bg-opacity-30 fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
								<div className="w-full max-w-3xl rounded-lg bg-gray-800 p-6 shadow-2xl">
									{/* Header del Modal */}
									<div className="mb-4 flex items-center justify-between">
										<h2 className="text-lg font-bold text-white">
											Asignar Curso a Estudiantes
										</h2>
										<button onClick={() => setShowAssignModal(false)}>
											<X className="size-6 text-gray-300 hover:text-white" />
										</button>
									</div>

									{/* Contenido Principal */}
									<div className="grid grid-cols-2 gap-4">
										{/* Lista de Estudiantes */}
										{/* Lista de Estudiantes */}
										<div className="rounded-lg bg-gray-700 p-4">
											<h3 className="mb-2 font-semibold text-white">
												Seleccionar Estudiantes
											</h3>

											{/* Checkbox "Seleccionar Todos" */}
											<div className="mb-2 flex items-center justify-between rounded bg-gray-600 px-3 py-2">
												<span className="font-semibold text-white">
													Seleccionar Todos
												</span>
												<input
													type="checkbox"
													checked={
														selectedStudents.length === users.length &&
														users.length > 0
													}
													onChange={(e) => {
														if (e.target.checked) {
															setSelectedStudents(users.map((user) => user.id)); // Selecciona todos
														} else {
															setSelectedStudents([]); // Deselecciona todos
														}
													}}
													className="form-checkbox h-5 w-5 text-blue-500"
												/>
											</div>

											<div className="h-64 overflow-y-auto rounded border border-gray-600">
												{users.map((user) => (
													<label
														key={user.id}
														className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-600"
													>
														<span className="text-white">
															{user.firstName} {user.lastName}
														</span>
														<input
															type="checkbox"
															checked={selectedStudents.includes(user.id)}
															onChange={() => handleSelectStudent(user.id)}
															className="form-checkbox h-5 w-5 text-blue-500"
														/>
													</label>
												))}
											</div>
										</div>

										{/* Lista de Cursos */}
										<div className="rounded-lg bg-gray-700 p-4">
											<h3 className="mb-2 font-semibold text-white">
												Seleccionar Curso
											</h3>
											<div className="h-64 overflow-y-auto rounded border border-gray-600">
												{courses.map((course) => (
													<label
														key={course.id}
														className="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-600"
													>
														<span className="text-white">{course.title}</span>
														<input
															type="radio"
															name="selectedCourse"
															checked={selectedCourse === course.id}
															onChange={() => setSelectedCourse(course.id)}
															className="form-radio h-5 w-5 text-blue-500"
														/>
													</label>
												))}
											</div>
										</div>
									</div>

									{/* Botones de Acción */}
									<div className="mt-6 flex justify-between">
										<button
											onClick={handleAssignStudents}
											className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
											disabled={
												selectedStudents.length === 0 || !selectedCourse
											}
										>
											Asignar Estudiantes
										</button>
										<button
											onClick={() => setShowAssignModal(false)}
											className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
										>
											Salir
										</button>
									</div>
								</div>
							</div>
						)}

						{/* Contenedor de botones arriba de la tabla */}
						<div className="mb-4 flex items-center justify-between">
							{/* Contenedor de botones arriba de la tabla */}
							<div className="mb-4 flex space-x-2">
								<button
									onClick={() => handleMassUpdateStatus('activo')}
									className={`flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
										selectedUsers.length === 0
											? 'cursor-not-allowed bg-gray-500'
											: 'bg-green-500 hover:bg-green-600 focus:bg-green-600'
									}`}
									disabled={selectedUsers.length === 0}
								>
									<Check className="mr-2 size-5" /> Activar
								</button>
								<button
									onClick={() => handleMassUpdateStatus('inactivo')}
									className={`flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
										selectedUsers.length === 0
											? 'cursor-not-allowed bg-gray-500'
											: 'bg-red-500 hover:bg-red-600 focus:bg-red-600'
									}`}
									disabled={selectedUsers.length === 0}
								>
									<XCircle className="mr-2 size-5" /> Desactivar
								</button>
								<button
									onClick={handleMassRemoveRole}
									className={`flex items-center rounded-md px-4 py-2 font-semibold text-white shadow-md transition-all hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
										selectedUsers.length === 0
											? 'cursor-not-allowed bg-gray-500'
											: 'bg-yellow-500 hover:bg-yellow-600 focus:bg-yellow-600'
									}`}
									disabled={selectedUsers.length === 0}
								>
									<XCircle className="mr-2 size-5" /> Quitar Rol
								</button>
								<button
									onClick={() => setShowAssignModal(true)}
									className="flex items-center rounded-md bg-secondary px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105 hover:bg-primary"
								>
									Asignar Curso a Estudiantes
								</button>
								<button
									onClick={() => setShowAnuncioModal(true)}
									className="flex items-center rounded-md bg-secondary px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105 hover:bg-[#00A5C0]"
								>
									<UserPlus className="mr-2 size-5" /> Crear Anuncio
								</button>
								<button
									onClick={() => setShowEmailModal(true)}
									className="flex items-center rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105 hover:bg-blue-700"
								>
									<Paperclip className="mr-2 size-5" /> Enviar Correo
								</button>

								<button
									onClick={() => setShowCreateForm(true)}
									className="flex items-center rounded-md bg-secondary px-4 py-2 font-semibold text-white shadow-md transition hover:scale-105 hover:bg-[#00A5C0]"
								>
									<UserPlus className="mr-2 size-5" /> Crear Usuario
								</button>
								<BulkUploadUsers onUsersUploaded={handleMassUserUpload} />
							</div>
						</div>
						<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{/* 🔍 Buscador por Nombre o Correo */}
							<div className="flex items-center gap-2 rounded-lg bg-white p-4 text-black shadow-md">
								<input
									type="text"
									placeholder="Buscar por nombre o correo..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								/>
							</div>

							{/* 🎭 Filtro de Roles */}
							<div className="flex items-center gap-2 rounded-lg bg-white p-4 text-black shadow-md">
								<select
									className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
									value={roleFilter}
									onChange={(e) => setRoleFilter(e.target.value)}
								>
									<option value="">Todos los Roles</option>
									<option value="admin">Admin</option>
									<option value="super-admin">Super-admin</option>
									<option value="educador">Educador</option>
									<option value="estudiante">Estudiante</option>
									<option value="sin-role">Sin Rol</option>
								</select>
							</div>

							{/* ⚡ Filtro de Estado */}
							<div className="flex items-center gap-2 rounded-lg bg-white p-4 text-black shadow-md">
								<select
									className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
								>
									<option value="">Todos los Estados</option>
									<option value="activo">Activo</option>
									<option value="inactivo">Inactivo</option>
									<option value="suspendido">Suspendido</option>
								</select>
							</div>
						</div>

						<div className="mt-6 overflow-x-auto">
							<table className="bg-opacity-70 w-full border-collapse rounded-lg bg-gradient-to-br from-background to-gray-800 text-white shadow-lg backdrop-blur-lg">
								<thead className="rounded-t-lg bg-[#00BDD8] from-primary to-secondary text-[#01142B]">
									<tr>
										<th className="px-4 py-3">
											<input
												type="checkbox"
												onChange={(e) =>
													setSelectedUsers(
														e.target.checked
															? filteredUsers.map((user) => user.id)
															: []
													)
												}
												checked={selectedUsers.length === filteredUsers.length}
											/>
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
											Nombre
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
											Correo
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
											<select
												value={roleFilter}
												onChange={(e) => setRoleFilter(e.target.value)}
												className="rounded-md bg-transparent px-3 py-2 text-sm text-[#01142B]"
											>
												<option value="">Roles</option>
												<option value="admin">Admin</option>
												<option value="super-admin">super-admin</option>
												<option value="educador">Educador</option>
												<option value="estudiante">Estudiante</option>
												<option value="sin-role">Sin Rol</option>
											</select>
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
											{' '}
											<select
												value={statusFilter}
												onChange={(e) => setStatusFilter(e.target.value)}
												className="rounded-md bg-transparent px-3 py-2 text-sm text-[#01142B]"
											>
												<option value="">Estados</option>
												<option value="activo">Activo</option>
												<option value="inactivo">Inactivo</option>
												<option value="suspendido">Suspendido</option>
											</select>
										</th>
										<th className="px-4 py-3 text-left text-xs font-semibold tracking-wider">
											Acciones
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-700">
									{currentUsers.map((user) => (
										<tr
											key={user.id}
											className={`transition duration-300 hover:bg-gray-800 hover:shadow-lg ${
												user.isNew ? 'bg-primary text-black' : ''
											}`}
										>
											<td className="px-4 py-3">
												<input
													type="checkbox"
													checked={selectedUsers.includes(user.id)}
													onChange={() =>
														handleUserSelection(user.id, user.email)
													}
												/>
											</td>

											<td className="px-4 py-3 text-sm text-gray-300">
												{editingUser?.id === user.id ? (
													<div className="flex space-x-2">
														<input
															type="text"
															className="w-1/2 rounded-lg border-none bg-gray-800 px-2 py-1 text-xs text-white"
															value={editValues.firstName}
															onChange={(e) =>
																setEditValues({
																	...editValues,
																	firstName: e.target.value,
																})
															}
														/>
														<input
															type="text"
															className="w-1/2 rounded-lg border-none bg-gray-800 px-2 py-1 text-xs text-white"
															value={editValues.lastName}
															onChange={(e) =>
																setEditValues({
																	...editValues,
																	lastName: e.target.value,
																})
															}
														/>
													</div>
												) : (
													`${user.firstName} ${user.lastName}`
												)}
											</td>
											<td className="px-4 py-3 text-xs text-gray-400">
												{user.email}
											</td>
											<td className="px-4 py-3">
												<select
													className="cursor-pointer rounded-md border-none bg-gray-900 px-2 py-1 text-xs text-gray-200 transition duration-300 hover:bg-gray-800"
													value={user.role || 'sin-role'}
													onChange={(e) =>
														handleRoleChange(user.id, e.target.value)
													}
												>
													<option value="sin-role">Sin Rol</option>
													<option value="admin">Admin</option>
													<option value="super-admin">Super-admin</option>
													<option value="educador">Educador</option>
													<option value="estudiante">Estudiante</option>
												</select>
											</td>
											<td className="px-4 py-3">
												<select
													className="cursor-pointer rounded-md border-none bg-gray-900 px-2 py-1 text-xs text-gray-200 transition duration-300 hover:bg-gray-800"
													value={user.status}
													onChange={(e) =>
														handleStatusChange(user.id, e.target.value)
													}
												>
													<option value="activo">Activo</option>
													<option value="inactivo">Inactivo</option>
													<option value="suspendido">Suspendido</option>
												</select>
											</td>
											<td className="flex space-x-2 px-4 py-3">
												<button
													onClick={() => handleViewUser(user)}
													className="flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-blue-600"
												>
													<Eye size={14} className="mr-1" /> Ver
												</button>

												{editingUser?.id === user.id ? (
													<button
														onClick={handleSaveUser} // ✅ Ya no necesita recibir user.id
														className="flex items-center rounded-md bg-green-500 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-green-600"
													>
														<Edit size={14} className="mr-1" /> Guardar
													</button>
												) : (
													<button
														onClick={() => handleEditUser(user)} // ✅ Pasamos el objeto completo
														className="flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-blue-600"
													>
														<Edit size={14} className="mr-1" /> Editar
													</button>
												)}
												<button
													onClick={() => handleDeleteUser(user.id)}
													className="flex items-center rounded-md bg-red-700 px-2 py-1 text-xs font-medium shadow-md transition duration-300 hover:bg-red-800"
												>
													<Trash2 size={14} className="mr-1" /> Eliminar
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							<div className="mt-4 flex justify-center space-x-2">
								<button
									onClick={() =>
										setCurrentPage((prev) => Math.max(prev - 1, 1))
									}
									disabled={currentPage === 1}
									className="rounded bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
								>
									Anterior
								</button>

								<span className="rounded bg-gray-800 px-4 py-2 text-white">
									Página {currentPage} de{' '}
									{Math.ceil(filteredUsers.length / usersPerPage)}
								</span>

								<button
									onClick={() =>
										setCurrentPage((prev) =>
											prev < Math.ceil(filteredUsers.length / usersPerPage)
												? prev + 1
												: prev
										)
									}
									disabled={
										currentPage ===
										Math.ceil(filteredUsers.length / usersPerPage)
									}
									className="rounded bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
								>
									Siguiente
								</button>
							</div>
						</div>
					</>
				)}
			</div>
			{notification && (
				<div
					className={`fixed right-5 bottom-5 rounded-md px-4 py-2 text-white shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
				>
					{notification.message}
				</div>
			)}
			{showAnuncioModal && (
				<div className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
					<div className="relative max-h-screen w-full max-w-2xl overflow-y-auto rounded-lg bg-gray-900 p-6 text-white shadow-2xl">
						<button
							onClick={() => setShowAnuncioModal(false)}
							className="absolute top-4 right-4 text-white hover:text-red-500"
						>
							<X size={24} />
						</button>

						<h2 className="mb-6 text-center text-3xl font-bold">
							Crear Anuncio
						</h2>

						{/* Inputs que actualizan la vista previa en tiempo real */}
						{/* Tipo de destinatario */}
						<select
							className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
							value={newAnuncio.tipo_destinatario || ''}
							onChange={(e) =>
								setNewAnuncio({
									...newAnuncio,
									tipo_destinatario: e.target.value as
										| 'todos'
										| 'cursos'
										| 'programas'
										| 'custom',
								})
							}
						>
							<option value="todos">Todos</option>
							<option value="cursos">Cursos</option>
							<option value="programas">Programas</option>
							<option value="custom">Usuarios específicos</option>
						</select>
						{/* Mostrar el select de cursos si se selecciona "cursos" */}
						{newAnuncio.tipo_destinatario === 'cursos' && (
							<select
								className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
								value={selectedCourses}
								onChange={(e) => setSelectedCourses([e.target.value])}
							>
								<option value="">Selecciona un curso</option>
								{courses.map((course) => (
									<option key={course.id} value={course.id}>
										{course.title}
									</option>
								))}
							</select>
						)}

						{/* Mostrar el select de programas si se selecciona "programas" */}
						{newAnuncio.tipo_destinatario === 'programas' && (
							<select
								className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
								value={selectedPrograms}
								onChange={(e) => setSelectedPrograms([e.target.value])}
							>
								<option value="">Selecciona un programa</option>
								{/* Debes tener un array de programas similar a `courses` */}
								{programs.map((program) => (
									<option key={program.id} value={program.id}>
										{program.title}
									</option>
								))}
							</select>
						)}

						{/* Mostrar el select de usuarios si se selecciona "custom" */}
						{newAnuncio.tipo_destinatario === 'custom' && (
							<select
								className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
								value={selectedUsers}
								onChange={(e) => setSelectedUsers([e.target.value])}
							>
								<option value="">Selecciona usuarios</option>
								{users.map((user) => (
									<option key={user.id} value={user.id}>
										{user.firstName} {user.lastName}
									</option>
								))}
							</select>
						)}

						{/* Formulario de creación de anuncio */}
						<input
							type="text"
							placeholder="Título del anuncio"
							value={newAnuncio.titulo}
							onChange={(e) =>
								setNewAnuncio({ ...newAnuncio, titulo: e.target.value })
							}
							className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
						/>

						<textarea
							placeholder="Descripción"
							value={newAnuncio.descripcion}
							onChange={(e) =>
								setNewAnuncio({ ...newAnuncio, descripcion: e.target.value })
							}
							className="mb-3 w-full rounded-lg border bg-gray-800 p-3 text-white"
						/>

						<input
							type="file"
							accept="image/*"
							onChange={handleFileChange}
							className="mb-4 w-full rounded-lg border bg-gray-800 p-3 text-white"
						/>

						{/* 🔹 Componente de Vista Previa del Anuncio */}
						<AnuncioPreview
							titulo={newAnuncio.titulo}
							descripcion={newAnuncio.descripcion}
							imagenUrl={newAnuncio.previewImagen ?? ''}
						/>

						<button
							onClick={handleCreateAnuncio}
							className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-lg font-semibold text-white hover:bg-blue-700"
						>
							Guardar Anuncio
						</button>
					</div>
				</div>
			)}

			{editingUser && (
				<EditUserModal
					isOpen={!!editingUser}
					user={editingUser} // ✅ Pasamos el usuario completo
					onClose={() => setEditingUser(null)}
					onSave={(updatedUser, updatedPermissions) => {
						setUsers(
							users.map((user) =>
								user.id === updatedUser.id
									? { ...updatedUser, permissions: updatedPermissions }
									: user
							)
						);
						setEditingUser(null);
						showNotification('Usuario actualizado con éxito.', 'success');
					}}
				/>
			)}

			<ConfirmDialog
				isOpen={confirmation?.isOpen ?? false}
				title={confirmation?.title ?? ''}
				message={confirmation?.message ?? ''}
				onConfirm={async () => {
					await Promise.resolve(confirmation?.onConfirm?.());
					setConfirmation(null);
				}}
				onCancel={() => {
					confirmation?.onCancel?.();
					setConfirmation(null);
				}}
			/>

			<ConfirmDialog
				isOpen={confirmation?.isOpen ?? false}
				title={confirmation?.title ?? ''}
				message={confirmation?.message ?? ''}
				onConfirm={
					confirmation?.onConfirm
						? async () => {
								await Promise.resolve(confirmation.onConfirm?.());
							}
						: async () => Promise.resolve()
				} // Asegura que `onConfirm` siempre devuelva una Promise<void>
				onCancel={() => setConfirmation(null)}
			/>

			<InfoDialog
				isOpen={infoDialogOpen}
				title={infoDialogTitle}
				message={infoDialogMessage}
				onClose={() => setInfoDialogOpen(false)}
			/>
			{showEmailModal && (
				<div className="bg-opacity-60 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
					<div className="relative max-h-screen w-full max-w-2xl overflow-y-auto rounded-lg bg-gray-900 p-6 text-white shadow-2xl">
						{/* ❌ Botón de cierre */}
						<button
							onClick={() => setShowEmailModal(false)}
							className="absolute top-4 right-4 text-white hover:text-red-500"
						>
							<X size={24} />
						</button>

						<h2 className="mb-6 text-center text-3xl font-bold">
							Enviar Correo
						</h2>

						{/* 📌 Campo de Asunto */}
						<input
							type="text"
							placeholder="Asunto del correo"
							className="mb-4 w-full rounded-lg border-2 border-gray-700 bg-gray-800 p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
						/>

						<div className="mb-4 flex flex-wrap gap-2">
							{selectedEmails.map((email) => (
								<span
									key={email}
									className="flex items-center rounded-full bg-blue-600 px-4 py-2 text-white"
								>
									{email}
									<button
										onClick={() =>
											setSelectedEmails((prev) =>
												prev.filter((e) => e !== email)
											)
										}
										className="ml-2 text-lg text-white"
									>
										✕
									</button>
								</span>
							))}
						</div>

						{/* 📌 Agregar correos manualmente */}
						<input
							type="text"
							placeholder="Agregar correos manualmente y presiona Enter"
							className="mb-4 w-full rounded-lg border-2 border-gray-700 bg-gray-800 p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
							value={customEmails}
							onChange={(e) => setCustomEmails(e.target.value)}
							onKeyDown={handleManualEmailAdd} // ✅ Captura la tecla Enter
						/>

						{/* 📌 Editor de texto con SunEditor */}
						<SunEditor
							setContents={message}
							onChange={(content) => setMessage(content)}
							setOptions={{
								height: '200',
								buttonList: [
									['bold', 'italic', 'underline', 'strike'],
									['fontSize', 'fontColor', 'hiliteColor'],
									['align', 'list', 'table'],
									['link', 'image', 'video'],
									['removeFormat'],
								],
							}}
						/>

						{/* 📌 Adjuntar archivos con vista previa */}
						<div className="mb-4">
							<label className="mb-2 block text-sm font-medium text-white">
								Adjuntar Archivos
							</label>

							{/* Previsualización de archivos adjuntos */}
							<div className="mb-4 flex flex-wrap gap-4">
								{previewAttachments.map((src, index) => (
									<div key={index} className="relative h-24 w-24">
										<Image
											src={src}
											alt={`preview-${index}`}
											layout="fill"
											objectFit="cover"
											className="rounded-lg"
										/>
										<button
											onClick={() => removeAttachment(index)}
											className="absolute top-0 right-0 rounded-full bg-red-600 p-2 text-xs text-white"
										>
											✕
										</button>
									</div>
								))}
							</div>

							{/* Input para agregar archivos adjuntos */}
							<input
								type="file"
								multiple
								onChange={handleAttachmentChange} // ✅ Cambiamos el nombre aquí
								className="rounded-lg border-2 border-gray-700 bg-gray-800 p-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						{/* 📌 Botón de envío */}
						<div className="mt-4 flex justify-center">
							<button
								onClick={sendEmail}
								className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								disabled={loadingEmail}
							>
								{loadingEmail ? (
									<Loader2 className="animate-spin text-white" />
								) : (
									'Enviar Correo'
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
