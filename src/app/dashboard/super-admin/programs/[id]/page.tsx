import { use } from 'react';

import ProgramDetail from './ProgramDetail'; // El componente ProgramDetail

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// Importar el chatbot

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // Usar React.use() para resolver la promesa de params
  const { id } = use(params);
  const idNumber = Number(id);
  if (!id || isNaN(idNumber)) {
    return <div>Id de programa inválido</div>;
  }
  return (
    <>
      <ProgramDetail programId={idNumber} />
    </>
  );
}
