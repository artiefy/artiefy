'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import type { DropResult } from 'react-beautiful-dnd';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/admin/ui/card';

interface Curso {
	id: number;
	nombre: string;
}

interface RutaAprendizajeProps {
	cursos: Curso[];
}

export function RutaAprendizaje({ cursos }: RutaAprendizajeProps) {
	const [rutaCursos, setRutaCursos] = useState(cursos);

	const onDragEnd = (result: DropResult) => {
		if (!result.destination) {
			return;
		}

		const items = Array.from(rutaCursos);
		const [reorderedItem] = items.splice(result.source.index, 1);
		if (reorderedItem) {
			items.splice(result.destination.index, 0, reorderedItem);
		}

		setRutaCursos(items);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Ruta de Aprendizaje</CardTitle>
			</CardHeader>
			<CardContent>
				<DragDropContext onDragEnd={onDragEnd}>
					<Droppable droppableId="ruta">
						{(provided) => (
							<ul {...provided.droppableProps} ref={provided.innerRef}>
								{rutaCursos.map((curso, index) => (
									<Draggable
										key={curso.id}
										draggableId={curso.id.toString()}
										index={index}
									>
										{(provided) => (
											<li
												ref={provided.innerRef}
												{...provided.draggableProps}
												{...provided.dragHandleProps}
												className="bg-secondary mb-2 rounded-lg p-3"
											>
												{curso.nombre}
											</li>
										)}
									</Draggable>
								))}
								{provided.placeholder}
							</ul>
						)}
					</Droppable>
				</DragDropContext>
			</CardContent>
		</Card>
	);
}
