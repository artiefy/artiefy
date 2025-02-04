'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import QuestionList from '~/components/verActividades/PreguntasOM';

import { toast } from '~/hooks/use-toast';

interface ActivityDetails {
	id: number;
	name: string;
	description: string;
	typeid: number;
	type: {
		id: number;
		name: string;
		description: string;
	};
	lesson: {
		id: number;
		title: string;
		coverImageKey: string;
		courseId: number;
		courseTitle: string;
		courseDescription: string;
		courseInstructor: string;
	};
}

const RealizarActividad: React.FC = () => {
	const params = useParams();
	const actividadIdUrl = params?.activityId ?? null;
	const [loading, setLoading] = useState(true);
	const [actividad, setActividad] = useState<ActivityDetails | null>(null);
	const [error, setError] = useState<string | null>(null);
	const actividadIdString = Array.isArray(actividadIdUrl)
		? actividadIdUrl[0]
		: actividadIdUrl;
	const actividadIdNumber = actividadIdString
		? parseInt(actividadIdString)
		: null;
	const fetchActividad = useCallback(async () => {
		if (actividadIdNumber !== null) {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(
					`/api/educadores/actividades/${actividadIdNumber}`
				);

				if (response.ok) {
					const data = (await response.json()) as ActivityDetails;
					setActividad(data);
				} else {
					const errorData = (await response.json()) as { error?: string };
					const errorMessage = errorData.error ?? response.statusText;
					setError(`Error al cargar la actividad: ${errorMessage}`);
					toast({
						title: 'Error',
						description: `No se pudo cargar la actividad: ${errorMessage}`,
						variant: 'destructive',
					});
				}
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : 'Error desconocido';
				setError(`Error al cargar la actividad: ${errorMessage}`);
				toast({
					title: 'Error',
					description: `No se pudo cargar la actividad: ${errorMessage}`,
					variant: 'destructive',
				});
			} finally {
				setLoading(false);
			}
		}
	}, [actividadIdNumber]);

	useEffect(() => {
		void fetchActividad();
	}, [fetchActividad]);

	if (loading) return <div>Cargando...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<div className="h-auto rounded-lg bg-gradient-to-br from-primary to-indigo-500 p-8 text-indigo-500">
			<div className="mx-auto max-w-6xl px-4">
				<header className="mb-8 text-center">
					{actividad && (
						<>
							<h1 className="mb-2 text-3xl font-bold text-gray-800">
								{actividad.name}
							</h1>
							<p className="text-gray-600">{actividad.description}</p>
						</>
					)}
				</header>

				{actividad && (
					<>
						{actividad.type.id === 1 && <div>En construccion</div>}
						{actividad.type.id === 2 && (
							<QuestionList activityId={actividadIdNumber} />
						)}
						{actividad.type.id === 3 && <div>Actividad tipo 3</div>}
						{actividad.type.id !== 1 &&
							actividad.type.id !== 2 &&
							actividad.type.id !== 3 && (
								<div className="text-center text-xl text-red-500">
									No se encontró la actividad.
								</div>
							)}
					</>
				)}
			</div>
		</div>
	);
};

export default RealizarActividad;
