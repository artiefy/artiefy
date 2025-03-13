import { getProgramById } from '~/server/actions/estudiantes/programs/getProgramById';

import ProgramDetailsClient from './ProgramDetailsClient';

interface Props {
	params: {
		id: string;
	};
}

export default async function ProgramDetailsPage({ params }: Props) {
	const program = await getProgramById(params.id);

	if (!program) {
		return <div>Programa no encontrado</div>;
	}

	return <ProgramDetailsClient program={program} />;
}
