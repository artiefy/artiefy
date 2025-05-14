'use client';

import { useEffect, useState } from 'react';

interface Student {
	id: string;
	name: string;
	email: string;
	subscriptionStatus: string;
	subscriptionEndDate: string | null;
	role?: string;
	planType?: string;
	programTitle?: string; // ✅ nuevo
}

interface Course {
	id: string;
	title: string;
}

export default function EnrolledUsersPage() {
	const [students, setStudents] = useState<Student[]>([]);
	const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
	const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
	const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
	const [showModal, setShowModal] = useState(false);
	const [filters, setFilters] = useState({
		name: '',
		email: '',
		subscriptionStatus: '',
		subscriptionEndDateFrom: '',
		subscriptionEndDateTo: '',
	});
	const [page, setPage] = useState(1);
	const [limit] = useState(10);
	const [totalPages, setTotalPages] = useState(1);
	const [pageInput, setPageInput] = useState('');
	const [filteredCourseResults, setFilteredCourseResults] = useState<Course[]>(
		[]
	);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const res = await fetch('/api/super-admin/enroll_user_program');
			const data = await res.json();

			const enrolledMap = new Map(
				(data.enrolledUsers || []).map((u: any) => [u.id, u.programTitle])
			);

			// Filtrar estudiantes por rol
			const studentsFilteredByRole = (
				Array.isArray(data.students) ? data.students : []
			)
				.filter((s: Student) => s.role === 'estudiante')
				.map((s: Student) => ({
					...s,
					programTitle: enrolledMap.get(s.id) || 'No inscrito',
				}));

			setStudents(studentsFilteredByRole);
			setAvailableCourses(data.courses || []);
		} catch (err) {
			console.error('Error fetching data:', err);
		}
	};

	useEffect(() => {
		const totalFiltered = students
			.filter((s) =>
				filters.name
					? s.name.toLowerCase().includes(filters.name.toLowerCase())
					: true
			)
			.filter((s) =>
				filters.email
					? s.email.toLowerCase().includes(filters.email.toLowerCase())
					: true
			)
			.filter((s) =>
				filters.subscriptionStatus
					? s.subscriptionStatus === filters.subscriptionStatus
					: true
			)
			.filter((s) =>
				filters.subscriptionEndDateFrom
					? new Date(s.subscriptionEndDate || '') >=
						new Date(filters.subscriptionEndDateFrom)
					: true
			)
			.filter((s) =>
				filters.subscriptionEndDateTo
					? new Date(s.subscriptionEndDate || '') <=
						new Date(filters.subscriptionEndDateTo)
					: true
			);

		const pages = Math.ceil(totalFiltered.length / limit) || 1;
		setTotalPages(pages);
	}, [students, filters, limit]);

	const filteredStudents = students
		.filter((s) =>
			filters.name
				? s.name.toLowerCase().includes(filters.name.toLowerCase())
				: true
		)
		.filter((s) =>
			filters.email
				? s.email.toLowerCase().includes(filters.email.toLowerCase())
				: true
		)
		.filter((s) =>
			filters.subscriptionStatus
				? s.subscriptionStatus === filters.subscriptionStatus
				: true
		)
		.filter((s) =>
			filters.subscriptionEndDateFrom
				? new Date(s.subscriptionEndDate || '') >=
					new Date(filters.subscriptionEndDateFrom)
				: true
		)
		.filter((s) =>
			filters.subscriptionEndDateTo
				? new Date(s.subscriptionEndDate || '') <=
					new Date(filters.subscriptionEndDateTo)
				: true
		);
	const sortedStudents = [...filteredStudents].sort((a, b) => {
		if (a.subscriptionStatus === 'active' && b.subscriptionStatus !== 'active')
			return -1;
		if (a.subscriptionStatus !== 'active' && b.subscriptionStatus === 'active')
			return 1;
		return 0;
	});

	const paginatedStudents = sortedStudents.slice(
		(page - 1) * limit,
		page * limit
	);

	const goToPage = (p: number) => {
		if (p < 1 || p > totalPages) return;
		setPage(p);
	};

	const handleEnroll = async () => {
		try {
			const response = await fetch('/api/super-admin/enroll_user_program', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userIds: selectedStudents,
					courseIds: selectedCourses,
				}),
			});
			const data = await response.json();
			if (response.ok) {
				alert('Estudiantes matriculados exitosamente');
				setSelectedStudents([]);
				setSelectedCourses([]);
				setShowModal(false);
			} else {
				alert(`Error: ${data.error}`);
			}
		} catch (err) {
			console.error('Error al matricular:', err);
		}
	};

	return (
		<div className="min-h-screen space-y-8 bg-gray-900 p-6 text-white">
			<h1 className="text-2xl font-bold">Matricular Estudiantes</h1>

			{/* Filtros */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
				<input
					type="text"
					placeholder="Nombre"
					value={filters.name}
					onChange={(e) => setFilters({ ...filters, name: e.target.value })}
					className="rounded border border-gray-700 bg-gray-800 p-2"
				/>
				<input
					type="email"
					placeholder="Correo"
					value={filters.email}
					onChange={(e) => setFilters({ ...filters, email: e.target.value })}
					className="rounded border border-gray-700 bg-gray-800 p-2"
				/>
				<select
					value={filters.subscriptionStatus}
					onChange={(e) =>
						setFilters({ ...filters, subscriptionStatus: e.target.value })
					}
					className="rounded border border-gray-700 bg-gray-800 p-2"
				>
					<option value="">Estado</option>
					<option value="active">Activa</option>
					<option value="inactive">Inactiva</option>
				</select>
				<input
					type="date"
					value={filters.subscriptionEndDateFrom}
					onChange={(e) =>
						setFilters({ ...filters, subscriptionEndDateFrom: e.target.value })
					}
					className="rounded border border-gray-700 bg-gray-800 p-2"
				/>
				<input
					type="date"
					value={filters.subscriptionEndDateTo}
					onChange={(e) =>
						setFilters({ ...filters, subscriptionEndDateTo: e.target.value })
					}
					className="rounded border border-gray-700 bg-gray-800 p-2"
				/>
			</div>

			{/* Tabla de estudiantes */}
			<div>
				<h2 className="mb-2 text-xl font-semibold">Seleccionar Estudiantes</h2>
				<div className="overflow-x-auto">
					<table className="min-w-full table-auto border-collapse">
						<thead>
							<tr className="border-b border-gray-700 bg-gradient-to-r from-[#3AF4EF] via-[#00BDD8] to-[#01142B] text-white">
								<th className="w-12 px-2 py-3">
									<input
										type="checkbox"
										checked={
											paginatedStudents.length > 0 &&
											paginatedStudents.every((s) =>
												selectedStudents.includes(s.id)
											)
										}
										onChange={(e) =>
											setSelectedStudents(
												e.target.checked
													? Array.from(
															new Set([
																...selectedStudents,
																...paginatedStudents.map((s) => s.id),
															])
														)
													: selectedStudents.filter(
															(id) =>
																!paginatedStudents.find((s) => s.id === id)
														)
											)
										}
										className="rounded border-white/20"
									/>
								</th>
								<th>Nombre</th>
								<th>Correo</th>
								<th>Estado</th>
								<th>Programa</th>
								<th>Rol</th>
								<th>Plan</th>
								<th>Fin Suscripción</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-700/50">
							{paginatedStudents.map((s) => (
								<tr key={s.id} className="hover:bg-gray-800">
									<td className="px-2 py-2">
										<input
											type="checkbox"
											checked={selectedStudents.includes(s.id)}
											onChange={() =>
												setSelectedStudents((prev) =>
													prev.includes(s.id)
														? prev.filter((id) => id !== s.id)
														: [...prev, s.id]
												)
											}
										/>
									</td>
									<td>{s.name}</td>
									<td>{s.email}</td>
									<td>{s.subscriptionStatus}</td>
									<td>{s.programTitle}</td>
									<td>{s.role || 'Sin rol'}</td>
									<td>{s.planType || 'Sin plan'}</td>
									<td>
										{s.subscriptionEndDate
											? new Date(s.subscriptionEndDate).toLocaleDateString()
											: 'N/A'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* Paginación */}
			<div className="flex items-center gap-2 text-sm">
				<button
					onClick={() => goToPage(page - 1)}
					disabled={page === 1}
					className="rounded bg-gray-700 px-3 py-1 disabled:opacity-40"
				>
					Anterior
				</button>
				{Array.from({ length: totalPages }, (_, i) => i + 1)
					.filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
					.map((n, i, arr) => (
						<span key={n} className="px-1">
							{arr[i - 1] && n - arr[i - 1] > 1 && '...'}
							<button
								onClick={() => goToPage(n)}
								className={`rounded px-2 py-1 ${page === n ? 'bg-blue-500' : 'bg-gray-700'}`}
							>
								{n}
							</button>
						</span>
					))}
				<input
					type="number"
					value={pageInput}
					onChange={(e) => setPageInput(e.target.value)}
					placeholder="Ir a"
					className="w-20 rounded bg-gray-800 px-2 py-1 text-white"
				/>
				<button
					onClick={() => {
						const n = parseInt(pageInput);
						if (!isNaN(n)) goToPage(n);
						setPageInput('');
					}}
					className="rounded bg-gray-700 px-2 py-1"
				>
					Ir
				</button>
			</div>

			{/* Botón de modal */}
			<button
				disabled={selectedStudents.length === 0}
				onClick={() => {
					setSelectedCourses([]);
					setShowModal(true);
				}}
				className="mt-4 rounded bg-green-600 px-6 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
			>
				Matricular a curso
			</button>

			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
					<div className="w-full max-w-md space-y-4 rounded-lg bg-gray-800 p-6">
						<h3 className="text-lg font-semibold">
							Matricular {selectedStudents.length} estudiante(s)
						</h3>

						{/* Lista de estudiantes seleccionados */}
						<div className="max-h-32 overflow-y-auto rounded border border-gray-600 p-2 text-sm text-gray-300">
							{students
								.filter((s) => selectedStudents.includes(s.id))
								.map((s) => (
									<div key={s.id}>{s.name}</div>
								))}
						</div>

						{/* Selector de cursos con búsqueda */}
						<div>
							<label className="mb-1 block text-sm font-medium">
								Seleccionar Cursos
							</label>
							<input
								type="text"
								placeholder="Buscar curso..."
								className="mb-2 w-full rounded bg-gray-700 p-2 text-white"
								onChange={(e) => {
									const term = e.target.value.toLowerCase();
									const filtered = availableCourses.filter((c) =>
										c.title.toLowerCase().includes(term)
									);
									setFilteredCourseResults(filtered);
								}}
							/>

							<div className="max-h-40 space-y-1 overflow-y-auto rounded border border-gray-600 bg-gray-700 p-2">
								{(filteredCourseResults.length > 0
									? filteredCourseResults
									: availableCourses
								).map((c) => (
									<div
										key={c.id}
										className={`cursor-pointer rounded px-2 py-1 ${
											selectedCourses.includes(c.id)
												? 'bg-blue-600 text-white'
												: 'hover:bg-gray-600'
										}`}
										onClick={() =>
											setSelectedCourses((prev) =>
												prev.includes(c.id)
													? prev.filter((id) => id !== c.id)
													: [...prev, c.id]
											)
										}
									>
										{c.title}
									</div>
								))}
							</div>
						</div>

						{/* Acciones */}
						<div className="flex justify-end gap-2">
							<button
								onClick={() => setShowModal(false)}
								className="rounded bg-gray-700 px-4 py-2"
							>
								Cancelar
							</button>
							<button
								disabled={selectedCourses.length === 0}
								onClick={handleEnroll}
								className="rounded bg-blue-600 px-4 py-2 font-semibold disabled:opacity-40"
							>
								Matricular
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
