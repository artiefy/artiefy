'use client';
import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';
<<<<<<< HEAD

import { getProjectById } from '~/server/actions/estudiantes/project/getProjectById';

=======
import { getProjectById } from '~/server/actions/estudiantes/project/getProjectById';
>>>>>>> 106ed634249738e068cde72c88c34ba752c1728a
import type { Project } from '~/types';

const ProjectDetailPage = () => {
	const router = useRouter();
	const { id } = router.query;
	const [project, setProject] = useState<Project | null>(null);

	useEffect(() => {
		if (id) {
			getProjectById(Number(id)).then(setProject).catch(console.error);
		}
	}, [id]);

	if (!project) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<h1>{project.name}</h1>
			<p>{project.description}</p>
			{/* Mostrar más detalles del proyecto */}
		</div>
	);
};

export default ProjectDetailPage;
