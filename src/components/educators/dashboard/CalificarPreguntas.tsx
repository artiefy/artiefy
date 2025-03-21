'use client';
import { useState, useEffect } from 'react';

import { toast } from 'sonner';

import { Button } from '~/components/educators/ui/button';
import { Input } from '~/components/educators/ui/input';
import { Label } from '~/components/educators/ui/label';
import {
	Modal,
	ModalHeader,
	ModalBody,
	ModalFooter,
} from '~/components/educators/ui/modal';

// OJO: ESTA INTERFAZ NO ESTA TERMINADA POR TEMAS DE TIEMPO

// Interfaz para las respuestas de los estudiantes
interface StudentAnswer {
	id: string;
	studentName: string;
	questionText: string;
	answer: string;
	submissionDate: string;
	grade?: number;
	comment?: string;
}

const CalificarPreguntas: React.FC<{ activityId: number }> = ({
	activityId,
}) => {
	const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]); // Estado para las respuestas de los estudiantes
	const [selectedAnswer, setSelectedAnswer] = useState<StudentAnswer | null>(
		null
	); // Estado para la respuesta seleccionada
	const [grade, setGrade] = useState<number | undefined>(undefined); // Estado para la calificación
	const [comment, setComment] = useState<string>(''); // Estado para el comentario
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // Estado para el modal

	// Efecto para obtener las respuestas de los estudiantes
	useEffect(() => {
		const fetchStudentAnswers = async () => {
			try {
				const response = await fetch(
					`/api/educadores/answers?activityId=${activityId}`
				);
				const data = (await response.json()) as { answers: StudentAnswer[] };
				setStudentAnswers(data.answers);
			} catch (error) {
				console.error('Error fetching student answers:', error);
				toast('Error', {
					description: 'Error al cargar las respuestas de los estudiantes',
				});
			}
		};

		void fetchStudentAnswers();
	}, [activityId]);

	// Función para abrir el modal
	const handleOpenModal = (answer: StudentAnswer) => {
		setSelectedAnswer(answer);
		setGrade(answer.grade);
		setComment(answer.comment ?? '');
		setIsModalOpen(true);
	};

	// Función para cerrar el modal
	const handleCloseModal = () => {
		setSelectedAnswer(null);
		setGrade(undefined);
		setComment('');
		setIsModalOpen(false);
	};

	// Función para guardar la calificación
	const handleSave = async () => {
		if (!selectedAnswer) return;

		try {
			const response = await fetch(
				`/api/educadores/answers/${selectedAnswer.id}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ grade, comment }),
				}
			);

			if (!response.ok) {
				throw new Error('Error al guardar la calificación');
			}

			const updatedAnswer = { ...selectedAnswer, grade, comment };
			setStudentAnswers((prevAnswers) =>
				prevAnswers.map((answer) =>
					answer.id === updatedAnswer.id ? updatedAnswer : answer
				)
			);

			toast('Calificación guardada', {
				description: 'La calificación se guardó correctamente',
			});
			handleCloseModal();
		} catch (error) {
			console.error('Error saving grade:', error);
			toast('Error', {
				description: 'Error al guardar la calificación',
			});
		}
	};

	// Renderiza la vista
	return (
		<div className="container mx-auto p-4">
			<h1 className="mb-4 text-2xl font-bold">Calificar Preguntas</h1>
			<table className="min-w-full bg-white">
				<thead>
					<tr>
						<th className="py-2">Estudiante</th>
						<th className="py-2">Pregunta</th>
						<th className="py-2">Respuesta</th>
						<th className="py-2">Fecha de Envío</th>
						<th className="py-2">Acciones</th>
					</tr>
				</thead>
				<tbody>
					{studentAnswers.map((answer) => (
						<tr key={answer.id}>
							<td className="border px-4 py-2">{answer.studentName}</td>
							<td className="border px-4 py-2">{answer.questionText}</td>
							<td className="border px-4 py-2">{answer.answer}</td>
							<td className="border px-4 py-2">
								{new Date(answer.submissionDate).toLocaleString()}
							</td>
							<td className="border px-4 py-2">
								<Button onClick={() => handleOpenModal(answer)}>
									Calificar
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{isModalOpen && selectedAnswer && (
				<Modal isOpen={isModalOpen} onClose={handleCloseModal}>
					<ModalHeader>Calificar Respuesta</ModalHeader>
					<ModalBody>
						<p>
							<strong>Estudiante:</strong> {selectedAnswer.studentName}
						</p>
						<p>
							<strong>Pregunta:</strong> {selectedAnswer.questionText}
						</p>
						<p>
							<strong>Respuesta:</strong> {selectedAnswer.answer}
						</p>
						<div className="mt-4">
							<Label htmlFor="grade">Calificación</Label>
							<Input
								id="grade"
								type="number"
								value={grade ?? ''}
								onChange={(e) => setGrade(Number(e.target.value))}
								min={0}
								max={100}
								required
							/>
						</div>
						<div className="mt-4">
							<Label htmlFor="comment">Comentario</Label>
							<textarea
								id="comment"
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								placeholder="Escribe un comentario"
							/>
						</div>
					</ModalBody>
					<ModalFooter>
						<Button variant="outline" onClick={handleCloseModal}>
							Cancelar
						</Button>
						<Button onClick={handleSave}>Guardar</Button>
					</ModalFooter>
				</Modal>
			)}
		</div>
	);
};

export default CalificarPreguntas;
