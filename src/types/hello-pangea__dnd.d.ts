declare module '@hello-pangea/dnd' {
  import * as React from 'react';

  export interface DropResult {
    draggableId: string;
    type: string;
    source: {
      index: number;
      droppableId: string;
    };
    destination?: {
      index: number;
      droppableId: string;
    } | null;
    reason: 'DROP' | 'CANCEL';
    mode: 'FLUID' | 'SNAP';
    combine?: unknown;
  }

  export interface DraggableProvided {
    innerRef: (element?: HTMLElement | null) => any;
    draggableProps: React.HTMLAttributes<HTMLElement>;
    dragHandleProps: React.HTMLAttributes<HTMLElement> | null;
  }

  export interface DroppableProvided {
    innerRef: (element?: HTMLElement | null) => any;
    droppableProps: React.HTMLAttributes<HTMLElement>;
    placeholder: React.ReactNode;
  }

  export const DragDropContext: React.ComponentType<{
    onDragEnd: (result: DropResult) => void;
    children?: React.ReactNode;
  }>;

  export const Draggable: React.ComponentType<{
    draggableId: string;
    index: number;
    children: (provided: DraggableProvided, snapshot: any) => React.ReactNode;
  }>;

  export const Droppable: React.ComponentType<{
    droppableId: string;
    children: (provided: DroppableProvided, snapshot: any) => React.ReactNode;
  }>;
}
