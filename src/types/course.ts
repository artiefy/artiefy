export interface Course {
	id: string;
	title: string;
	description?: string;
	imageUrl?: string;
	coverImageKey: string | null;
	category: {
		id: number;
		name: string;
		imageUrl?: string;
	};
	instructor: string;
	rating: number | null;
	createdAt: string;
	updatedAt: string;
	totalStudents: number;
	modalidad: {
		name: string;
	};
	lessons: {
		id: number;
		title: string;
		duration: number;
		description: string | null;
	}[];
	students?: string[];
}
