'use server';

import { auth } from '@clerk/nextjs/server';
import { OpenAI } from 'openai';

import { env } from '~/env';
import {
  getGuidedActivityById,
  getGuidedObjectiveById,
  getGuidedProjectById,
} from '~/models/super-adminModels/guidedProjectsModelsSuperAdmin';

interface GeneratePromptBody {
  userInstructions?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; activityId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, activityId } = await params;
    const { userInstructions } = (await request
      .json()
      .catch(() => ({}))) as GeneratePromptBody;

    if (!userInstructions?.trim()) {
      return Response.json(
        { error: 'Falta describir qué debe hacer el agente' },
        { status: 400 }
      );
    }

    const [project, activity] = await Promise.all([
      getGuidedProjectById(parseInt(projectId)),
      getGuidedActivityById(parseInt(activityId)),
    ]);

    if (!activity) {
      return Response.json(
        { error: 'Actividad no encontrada' },
        {
          status: 404,
        }
      );
    }

    const objective = await getGuidedObjectiveById(activity.objectiveId);

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Eres un experto en diseño instruccional que redacta system prompts para agentes de IA que acompañan a estudiantes en actividades de proyectos guiados. Devuelve únicamente el texto del system prompt, en español, sin explicaciones adicionales ni markdown.',
        },
        {
          role: 'user',
          content: [
            `Lo que debe hacer el agente (indicado por el educador): ${userInstructions.trim()}`,
            '',
            'Contexto de la actividad, úsalo solo como referencia para que el prompt encaje con lo que el estudiante realmente está haciendo:',
            `Proyecto: ${project?.title ?? 'Sin título'}`,
            project?.description
              ? `Descripción del proyecto: ${project.description}`
              : null,
            objective?.title ? `Objetivo: ${objective.title}` : null,
            `Actividad: ${activity.name}`,
            activity.description
              ? `Descripción de la actividad: ${activity.description}`
              : null,
            activity.instructionText
              ? `Instrucciones para el estudiante: ${activity.instructionText}`
              : null,
            '',
            'Redacta el system prompt del agente priorizando lo que pidió el educador.',
          ]
            .filter((line) => line !== null)
            .join('\n'),
        },
      ],
    });

    const prompt = completion.choices[0]?.message?.content?.trim() ?? '';

    return Response.json({ prompt });
  } catch (error) {
    console.error('generate-prompt error:', error);
    return Response.json(
      { error: 'Error al generar el prompt' },
      { status: 500 }
    );
  }
}
