export interface Word {
	text: string;
	found: boolean;
	clue: string;
	startX: number;
	startY: number;
	direction: 'across' | 'down';
}

export interface WordCruci {
	word: string;
	clue: string;
	startX: number;
	startY: number;
	direction: 'across' | 'down';
	text: string;
	found: boolean;
}

export interface WordSearchConfig {
	words: Word[];
	timeLimit: number;
	gridSize: number;
	isTimerEnabled: boolean;
	points: number;
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

export interface CrosswordConfig {
	words: Word[];
	timeLimit: number;
}
