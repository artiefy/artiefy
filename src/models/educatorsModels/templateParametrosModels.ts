import { and, eq } from 'drizzle-orm';

import { db } from '~/server/db/index';
import {
  parameterTemplates,
  parametros,
  templateParametros,
} from '~/server/db/schema';

export interface ParameterTemplate {
  id: number;
  name: string;
  description: string | null;
  totalPercentage: number;
  courseId: number | null;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateParametro {
  id: number;
  templateId: number;
  parametroId: number;
  order: number;
}

export interface TemplateWithParametros extends ParameterTemplate {
  parametros: Array<{
    id: number;
    name: string;
    description: string;
    porcentaje: number;
    numberOfActivities: number;
    courseId: number | null;
  }>;
}

// Crear una plantilla
export const createParameterTemplate = async ({
  name,
  description,
  courseId,
  creatorId,
}: {
  name: string;
  description?: string;
  courseId?: number | null;
  creatorId: string;
}) => {
  try {
    const result = await db
      .insert(parameterTemplates)
      .values({
        name,
        description: description || null,
        totalPercentage: 0,
        courseId: courseId || null,
        creatorId,
      })
      .returning();

    if (!result || result.length === 0) {
      throw new Error('Error: No se pudo crear la plantilla');
    }

    return result[0];
  } catch (error) {
    console.error('Error en createParameterTemplate:', error);
    throw error;
  }
};

// Obtener plantillas por curso
export const getTemplatesByCourseId = async (
  courseId: number
): Promise<TemplateWithParametros[]> => {
  try {
    const templates = await db
      .select()
      .from(parameterTemplates)
      .where(eq(parameterTemplates.courseId, courseId));

    const templatesWithParametros: TemplateWithParametros[] = await Promise.all(
      templates.map(async (template) => {
        const templateParams = await db
          .select({
            parametro: parametros,
            order: templateParametros.order,
          })
          .from(templateParametros)
          .innerJoin(
            parametros,
            eq(templateParametros.parametroId, parametros.id)
          )
          .where(eq(templateParametros.templateId, template.id));

        return {
          ...template,
          parametros: templateParams.map((tp) => tp.parametro),
        };
      })
    );

    return templatesWithParametros;
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    throw new Error('Error al obtener las plantillas');
  }
};

// Obtener todas las plantillas (sin filtro de curso)
export const getAllParameterTemplates = async (): Promise<
  TemplateWithParametros[]
> => {
  try {
    const templates = await db.select().from(parameterTemplates);

    const templatesWithParametros: TemplateWithParametros[] = await Promise.all(
      templates.map(async (template) => {
        const templateParams = await db
          .select({
            parametro: parametros,
            order: templateParametros.order,
          })
          .from(templateParametros)
          .innerJoin(
            parametros,
            eq(templateParametros.parametroId, parametros.id)
          )
          .where(eq(templateParametros.templateId, template.id));

        return {
          ...template,
          parametros: templateParams.map((tp) => tp.parametro),
        };
      })
    );

    return templatesWithParametros;
  } catch (error) {
    console.error('Error al obtener todas las plantillas:', error);
    throw new Error('Error al obtener las plantillas');
  }
};

// Obtener una plantilla por ID
export const getTemplateById = async (
  templateId: number
): Promise<TemplateWithParametros | null> => {
  try {
    const template = await db
      .select()
      .from(parameterTemplates)
      .where(eq(parameterTemplates.id, templateId))
      .then((r) => r[0]);

    if (!template) return null;

    const templateParams = await db
      .select({
        parametro: parametros,
        order: templateParametros.order,
      })
      .from(templateParametros)
      .innerJoin(parametros, eq(templateParametros.parametroId, parametros.id))
      .where(eq(templateParametros.templateId, templateId));

    return {
      ...template,
      parametros: templateParams.map((tp) => tp.parametro),
    };
  } catch (error) {
    console.error('Error al obtener plantilla:', error);
    throw new Error('Error al obtener la plantilla');
  }
};

// Agregar parámetro a plantilla
export const addParametroToTemplate = async ({
  templateId,
  parametroId,
  order,
}: {
  templateId: number;
  parametroId: number;
  order: number;
}) => {
  try {
    // Obtener el parámetro
    const param = await db
      .select()
      .from(parametros)
      .where(eq(parametros.id, parametroId))
      .then((r) => r[0]);

    if (!param) throw new Error('Parámetro no encontrado');

    // Obtener la plantilla actual
    const template = await db
      .select()
      .from(parameterTemplates)
      .where(eq(parameterTemplates.id, templateId))
      .then((r) => r[0]);

    if (!template) throw new Error('Plantilla no encontrada');

    // Verificar que no se supere el 100%
    const newTotal = template.totalPercentage + param.porcentaje;
    if (newTotal > 100) {
      throw new Error(
        `No se puede agregar este parámetro. El total sería ${newTotal}%, máximo es 100%`
      );
    }

    // Agregar parámetro a plantilla
    const result = await db
      .insert(templateParametros)
      .values({
        templateId,
        parametroId,
        order,
      })
      .returning();

    // Actualizar total de la plantilla
    await db
      .update(parameterTemplates)
      .set({ totalPercentage: newTotal })
      .where(eq(parameterTemplates.id, templateId));

    return result[0];
  } catch (error) {
    console.error('Error al agregar parámetro a plantilla:', error);
    throw error;
  }
};

// Remover parámetro de plantilla
export const removeParametroFromTemplate = async ({
  templateId,
  parametroId,
}: {
  templateId: number;
  parametroId: number;
}) => {
  try {
    // Obtener el parámetro para conocer su porcentaje
    const param = await db
      .select()
      .from(parametros)
      .where(eq(parametros.id, parametroId))
      .then((r) => r[0]);

    if (!param) throw new Error('Parámetro no encontrado');

    // Obtener la plantilla actual
    const template = await db
      .select()
      .from(parameterTemplates)
      .where(eq(parameterTemplates.id, templateId))
      .then((r) => r[0]);

    if (!template) throw new Error('Plantilla no encontrada');

    // Remover parámetro
    await db
      .delete(templateParametros)
      .where(
        and(
          eq(templateParametros.templateId, templateId),
          eq(templateParametros.parametroId, parametroId)
        )
      );

    // Actualizar total de la plantilla
    const newTotal = Math.max(0, template.totalPercentage - param.porcentaje);
    await db
      .update(parameterTemplates)
      .set({ totalPercentage: newTotal })
      .where(eq(parameterTemplates.id, templateId));

    return true;
  } catch (error) {
    console.error('Error al remover parámetro de plantilla:', error);
    throw error;
  }
};

// Actualizar plantilla
export const updateParameterTemplate = async ({
  id,
  name,
  description,
}: {
  id: number;
  name: string;
  description?: string;
}) => {
  try {
    const result = await db
      .update(parameterTemplates)
      .set({
        name,
        description: description || null,
        updatedAt: new Date(),
      })
      .where(eq(parameterTemplates.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error al actualizar plantilla:', error);
    throw error;
  }
};

// Eliminar plantilla
export const deleteParameterTemplate = async (id: number) => {
  try {
    // Primero eliminar los parámetros asociados
    await db
      .delete(templateParametros)
      .where(eq(templateParametros.templateId, id));

    // Luego eliminar la plantilla
    const result = await db
      .delete(parameterTemplates)
      .where(eq(parameterTemplates.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error al eliminar plantilla:', error);
    throw error;
  }
};
