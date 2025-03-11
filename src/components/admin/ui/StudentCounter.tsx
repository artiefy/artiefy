'use client';

import { useState, useEffect } from 'react';

const StudentCounter: React.FC = () => {
	const [totalStudents, setTotalStudents] = useState<number | null>(null);
	const [role, setRole] = useState<string>('student');

	useEffect(() => {
		const fetchStudentCount = async () => {
			try {
				const response = await fetch(`/api/users/count-students?role=${role}`);
				if (!response.ok) throw new Error('Error en la petición');

				const data = (await response.json()) as { totalStudents: number };
				setTotalStudents(data.totalStudents);
			} catch (error) {
				console.error('Error al obtener la cantidad de estudiantes:', error);
			}
		};

		void fetchStudentCount();
	}, [role]);

	return (
		<div className="w-80 rounded-lg bg-gray-100 p-4 shadow-md">
			<h2 className="mb-2 text-xl font-bold">Cantidad de Estudiantes</h2>

			<select
				className="mb-2 w-full rounded border p-2"
				value={role}
				onChange={(e) => setRole(e.target.value)}
			>
				<option value="student">Student</option>
				<option value="estudiante">Estudiante</option>
			</select>

			<p className="text-lg">
				Total:{' '}
				<span className="font-bold">
					{totalStudents ?? 'Cargando...'}
				</span>
			</p>
		</div>
	);
};

export default StudentCounter;
