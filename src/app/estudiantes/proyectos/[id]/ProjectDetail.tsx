import { getProjectById } from '~/server/actions/project/getProjectById';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { Project } from '~/types';

const ProjectDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (id) {
      getProjectById(Number(id)).then(setProject);
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

export default ProjectDetail;
