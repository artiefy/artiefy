export default function ProyectoCard() {
  return (
    <div
      className="relative mx-auto mt-10 w-full max-w-md rounded-lg bg-cover bg-center p-10 text-white"
      style={{ backgroundImage: "url('/m1.png')" }} // <-- Ruta desde public
    >
      <h2 className="mb-2 text-xl font-bold text-cyan-300">
        Titulo del Proyecto
      </h2>
      <p className="mb-4">Descripcion del proyecto</p>

      <div className="mb-2">
        <span className="font-semibold rounded bg-cyan-900 px-3 py-1 text-cyan-300">
          Rama de investigacion
        </span>
      </div>

      <div className="font-semibold mt-4 flex items-center gap-4">
        <span className="rounded bg-gray-800 px-3 py-1 text-purple-400">
          # Integrantes
        </span>
        <button className="font-semibold rounded bg-cyan-300 px-3 py-1 text-black hover:bg-cyan-200">
          <a href=""> Ver más</a>
        </button>
      </div>
    </div>
  );
}
