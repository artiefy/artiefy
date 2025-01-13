'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import type { DropResult } from 'react-beautiful-dnd'
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"

type Curso = {
  id: number;
  nombre: string;
}

type RutaAprendizajeProps = {
  cursos: Curso[];
}

export function RutaAprendizaje({ cursos }: RutaAprendizajeProps) {
  const [rutaCursos, setRutaCursos] = useState(cursos)

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
  }

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
                  <Draggable key={curso.id} draggableId={curso.id.toString()} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-secondary p-3 mb-2 rounded-lg"
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
  )
}

