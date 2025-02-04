'use client';

import React, { useState, useEffect } from 'react';
import QuestionForm from '~/components/educators/layout/QuestionsForms';
import QuestionList from '~/components/educators/layout/QuestionsList';
import type { Question } from '~/types/typesActi';

interface QuestionManagerProps {
	activityId: number;
}

const QuestionManager: React.FC<QuestionManagerProps> = ({ activityId }) => {
	const [questions, setQuestions] = useState<Question[]>([]);
	const [editingQuestion, setEditingQuestion] = useState<Question | undefined>(undefined);

	useEffect(() => {
		void fetchQuestions();
	}, [activityId]);

	const fetchQuestions = async () => {
		try {
			const response = await fetch(
				`/api/educadores/question?activityId=${activityId}`
			);
			const data = (await response.json()) as {
				success: boolean;
				questions: Question[];
			};
			if (data.success) {
				setQuestions(data.questions);
			}
		} catch (error) {
			console.error('Error al cargar las preguntas:', error);
		}
	};

	const handleSubmit = async (question: Question) => {
		const method = editingQuestion ? 'PUT' : 'POST';
		try {
			const response = await fetch('/api/educadores/question', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ activityId, question }),
			});
			if (response.ok) {
				void fetchQuestions();
				setEditingQuestion(undefined);
			}
		} catch (error) {
			console.error('Error al guardar la pregunta:', error);
		}
	};

	const handleEdit = (question: Question) => {
		setEditingQuestion(question);
	};

	const handleDelete = async (questionId: string) => {
		try {
			const response = await fetch(
				`/api/educadores/question?activityId=${activityId}&questionId=${questionId}`,
				{
					method: 'DELETE',
				}
			);
			if (response.ok) {
				void fetchQuestions();
			}
		} catch (error) {
			console.error('Error al eliminar la pregunta:', error);
		}
	};

	return (
		<div className="space-y-8">
			<QuestionForm
				activityId={activityId}
				questionToEdit={editingQuestion}
				onSubmit={handleSubmit}
				onCancel={() => setEditingQuestion(undefined)}
			/>
			<QuestionList
				questions={questions}
				onEdit={handleEdit}
				onDelete={handleDelete}
			/>
		</div>
	);
};

export default QuestionManager;
