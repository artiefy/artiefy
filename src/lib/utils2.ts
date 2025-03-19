export const formatDate = (date: Date | string): string => {
	return new Date(date).toLocaleDateString('es-ES', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};

export interface GradesApiResponse {
	materias: {
		id: number;
		title: string;
		grade: number;
	}[];
	error?: string;
}
