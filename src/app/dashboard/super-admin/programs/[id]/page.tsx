import ProgramDetail from "./ProgramDetail"; // El componente ProgramDetail

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  // Esperamos a que se resuelvan los parámetros
  const resolvedParams = await params;

  return (
    <>
      <ProgramDetail programId={resolvedParams.id} />
    </>
  );
}
