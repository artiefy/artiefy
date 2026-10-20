import { and, eq, isNull } from 'drizzle-orm';
import OpenAI from 'openai';

import { env } from '~/env';
import { db } from '~/server/db';
import { projects } from '~/server/db/schema';
import { uploadMediaToS3 } from '~/server/lib/s3-upload';

import type { ImageGenerateParamsNonStreaming } from 'openai/resources/images';

import 'server-only';

/**
 * Models tried in order. `gpt-image-1-mini` is the cheapest, but the
 * `gpt-image` family needs a verified OpenAI organization; `dall-e-3` does
 * not, so it keeps covers working while the organization is unverified.
 */
const COVER_MODELS: ImageGenerateParamsNonStreaming[] = [
  {
    model: 'gpt-image-1-mini',
    size: '1536x1024',
    quality: 'low',
    output_format: 'webp',
    output_compression: 80,
    prompt: '',
  },
  {
    model: 'dall-e-3',
    size: '1792x1024',
    quality: 'standard',
    response_format: 'b64_json',
    prompt: '',
  },
];

/** Keeps the request small and the prompt about the idea, not the format. */
const MAX_DESCRIPTION_LENGTH = 400;

interface ProjectCoverInput {
  projectId: number;
  userId: string;
  name: string;
  description?: string | null;
}

function buildCoverPrompt({ name, description }: ProjectCoverInput) {
  const summary = (description ?? '').slice(0, MAX_DESCRIPTION_LENGTH);
  return [
    `Cover illustration for a student project called "${name}".`,
    summary ? `The project is about: ${summary}` : '',
    'Show a scene that represents the idea, in a modern, cinematic digital',
    'art style with deep blue and cyan tones. Landscape composition.',
    'No text, letters, words, numbers or logos anywhere in the image.',
  ]
    .filter(Boolean)
    .join(' ');
}

async function generateImage(prompt: string) {
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  let lastError: unknown;

  for (const params of COVER_MODELS) {
    try {
      const result = await client.images.generate({ ...params, prompt });
      const base64 = result.data?.[0]?.b64_json;
      if (base64) {
        const mimeType =
          params.output_format === 'webp' ? 'image/webp' : 'image/png';
        return { bytes: Buffer.from(base64, 'base64'), mimeType };
      }
    } catch (error) {
      lastError = error;
      console.warn(
        `Project cover: ${params.model} failed, trying the next model.`,
        error instanceof Error ? error.message : error
      );
    }
  }

  throw lastError ?? new Error('No image model returned a cover');
}

/**
 * Generates a cover that matches the project's idea and stores it, unless the
 * learner set their own cover in the meantime. Runs after the create request
 * has answered (`after()`), so a failure only leaves the generic cover.
 */
export async function generateProjectCover(input: ProjectCoverInput) {
  try {
    const { bytes, mimeType } = await generateImage(buildCoverPrompt(input));
    const extension = mimeType === 'image/webp' ? 'webp' : 'png';
    const file = new File([new Uint8Array(bytes)], `cover.${extension}`, {
      type: mimeType,
    });
    const { key } = await uploadMediaToS3(file, 'image', input.userId);

    await db
      .update(projects)
      .set({ coverImageKey: key })
      .where(
        and(
          eq(projects.id, input.projectId),
          eq(projects.userId, input.userId),
          isNull(projects.coverImageKey)
        )
      );
  } catch (error) {
    console.error(
      `Project cover: could not generate one for project ${input.projectId}.`,
      error
    );
  }
}
