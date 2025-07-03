'use client';
import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';

//import { getProjectById } from '~/server/actions/estudiantes/project/getProjectById';

import type { Project } from '~/types';

const ProjectDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (id) {
      //			getProjectById(Number(id)).then(setProject).catch(console.error);
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
