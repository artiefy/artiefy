import { db } from "~/server/db/index";
import { categories } from "./schema";

export const insertCategory = async (name: string, description: string) => {
  try {
    await db.insert(categories).values({
      name,
      description,
    });
    console.log(`Categoría "${name}" insertada exitosamente`);
  } catch (error) {
    console.error(`Error al insertar la categoría "${name}":`, error);
  }
};

// Insertar todas las categorías
(async () => {
  await insertCategory(
    "Programación",
    "Categoría relacionada con programación y desarrollo de software.",
  );
  await insertCategory(
    "Diseño",
    "Categoría relacionada con diseño gráfico y UX/UI.",
  );
  await insertCategory(
    "Marketing",
    "Categoría relacionada con marketing digital y tradicional.",
  );
  // Añade más categorías según necesites
})();
