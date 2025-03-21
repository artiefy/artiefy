// Representa una opción de una pregunta de opción múltiple
export interface OptionOM {
	id: string; // Identificador único de la opción
	text: string; // Texto de la opción
}

// Representa una opción de una pregunta de verdadero o falso
export interface OptionVOF {
	id: string; // Identificador único de la opción
	text: string; // Texto de la opción
}

// filepath: src/types/api.ts
export interface Materia {
	id: number;
	title: string;
	description: string;
	courseId?: number;
	programaId?: number;
  }

// Representa una pregunta de opción múltiple
export interface Question {
	id: string; // Identificador único de la pregunta
	text: string; // Texto de la pregunta
	options: OptionOM[]; // Lista de opciones de la pregunta
	correctOptionId: string; // Identificador de la opción correcta
	pesoPregunta: number; // Peso de la pregunta en la evaluación
}

// Representa una pregunta de verdadero o falso
export interface VerdaderoOFlaso {
	id: string; // Identificador único de la pregunta
	text: string; // Texto de la pregunta
	correct: boolean; // Indica si la respuesta es verdadera o falsa
	options: OptionVOF[]; // Lista de opciones de la pregunta
	correctOptionId: string; // Identificador de la opción correcta
	pesoPregunta: number; // Peso de la pregunta en la evaluación
}

// Representa una pregunta de completado
export interface Completado {
	id: string; // Identificador único de la pregunta
	text: string; // Texto de la pregunta
	correctAnswer: string; // Respuesta correcta de la pregunta
	answer?: string; // Respuesta proporcionada por el usuario (opcional)
	pesoPregunta: number; // Peso de la pregunta en la evaluación
}

// Representa una pregunta de completado con un segundo formato
export interface Completado2 {
	id: string; // Identificador único de la pregunta
	text: string; // Texto de la pregunta
	correctAnswer: string; // Respuesta correcta de la pregunta
	answer?: string; // Respuesta proporcionada por el usuario (opcional)
	pesoPregunta: number; // Peso de la pregunta en la evaluación
}

// Representa una pregunta que requiere la subida de archivos
export interface QuestionFilesSubida {
	id: string; // Identificador único de la pregunta
	text: string; // Texto de la pregunta
	parametros: string; // Parámetros adicionales de la pregunta
}
