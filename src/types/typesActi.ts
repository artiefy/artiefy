export interface OptionOM {
	id: string;
	text: string;
}
export interface OptionVOF {
	id: string;
	text: string;
}

export interface Question {
	id: string;
	text: string;
	options: OptionOM[];
	correctOptionId: string;
}

export interface VerdaderoOFlaso {
	id: string;
	text: string;
	correct: boolean;
	options: OptionVOF[];
	correctOptionId: string;
}

export interface Completado {
	id: string;
	text: string;
	correctAnswer: string;
	answer?: string;
}

export interface QuestionFilesSubida {
	id: string;
	text: string;
	parametros: string;
}
