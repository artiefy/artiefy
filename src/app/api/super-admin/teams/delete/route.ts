// src/app/api/super-admin/teams/class-meeting/delete/route.ts
import { NextResponse } from 'next/server';

import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { classMeetings } from '~/server/db/schema';

const s3 = new S3Client({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(req: Request) {
  try {
    const { id, video_key } = (await req.json()) as {
      id: number;
      video_key?: string | null;
    };

    // 1) Borrar de BD
    await db.delete(classMeetings).where(eq(classMeetings.id, id));

    // 2) Borrar video de S3 si existe
    if (video_key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: 'artiefy-upload',
          Key: `video_clase/${video_key}`,
        })
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Error eliminando clase:', err);
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });
  }
}
