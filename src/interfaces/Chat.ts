export interface Chat {
  id: number;
  title: string;
  curso_id: number | null;
  type?: 'ticket' | 'chat' | 'project';
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
