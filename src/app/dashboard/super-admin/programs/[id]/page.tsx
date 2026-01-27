import { use } from 'react';

import ProgramDetail from './ProgramDetail'; // El componente ProgramDetail
// Importar el chatbot

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
