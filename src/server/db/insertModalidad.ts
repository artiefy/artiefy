import { db } from "./index";
import { modalidades } from "./schema";

export const insertModalidad = async (name: string, description: string) => {
  try {
    await db.insert(modalidades).values({
      name,
      description,
    });
    console.log(`Modalidad "${name}" insertada exitosamente`);
  } catch (error) {
    console.error(`Error al insertar la modalidad "${name}":`, error);
  }
};

// Insertar todas las categorías
(async () => {
  await insertModalidad(
    "Presencial",
    "Modalidad relacionada con clases presenciales.",
  );
  await insertModalidad(
    "Sincronica",
    "Clases sincronicas 'virtuales en vivo, en tiempo real'.",
  );
  await insertModalidad(
    "Asincronica",
    "Clases asincronicas 'virtuales, en video, en tiempo real'.",
  );
  // Añade más categorías según necesites
})();
