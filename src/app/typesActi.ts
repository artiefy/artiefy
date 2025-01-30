export interface Word {
	text: string;
	found: boolean;
}

export interface WordSearchConfig {
	words: string[];
	gridSize: number;
}

export interface Option {
	id: string;
	text: string;
}

export interface Question {
	id: string;
	text: string;
	options: Option[];
	correctOptionId: string;
}

export interface QuizConfig {
	points: number;
	timeLimit: number;
	isTimerEnabled: boolean;
}
