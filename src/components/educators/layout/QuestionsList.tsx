import type React from 'react';
import { Edit, Trash } from 'lucide-react';
import { Button } from '~/components/educators/ui/button';
import { Card, CardContent, CardFooter } from '~/components/educators/ui/card';
import type { Question } from '~/types/typesActi';

interface QuestionListProps {
	questions: Question[];
	onEdit: (question: Question) => void;
	onDelete: (questionId: string) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({
	questions,
	onEdit,
	onDelete,
}) => {
	return (
		<div className="space-y-4">
			{questions.map((question) => (
				<Card key={question.id}>
					<CardContent className="pt-6">
						<h3 className="mb-2 text-lg font-semibold">{question.text}</h3>
						<ul className="list-inside list-disc space-y-1">
							{question.options.map((option) => (
								<li
									key={option.id}
									className={
										option.id === question.correctOptionId
											? 'font-bold text-indigo-500'
											: ''
									}
								>
									{option.text}
								</li>
							))}
						</ul>
					</CardContent>
					<CardFooter className="flex justify-end space-x-2">
						<Button
							onClick={() => onEdit(question)}
							variant="outline"
							className="text-blue-600 hover:text-blue-800"
							size="sm"
						>
							<Edit className="mr-2 size-4" /> Editar
						</Button>
						<Button
							onClick={() => onDelete(question.id)}
							variant="outline"
							className="text-red-600 hover:text-red-800"
							size="sm"
						>
							<Trash className="mr-2 size-4" /> Eliminar
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	);
};

export default QuestionList;
