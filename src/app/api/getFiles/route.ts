import { NextResponse } from 'next/server';

import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get('lessonId');

  if (!lessonId || isNaN(Number(lessonId))) {
    return NextResponse.json(
      { message: 'lessonId no válido' },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query<{ resource_key: string }>(
      'SELECT resource_key FROM lessons WHERE id = $1',
      [Number(lessonId)]
    );

    if (result.rows.length > 0) {
      const resourceKeys = result.rows[0]?.resource_key ?? '';
      const keys = resourceKeys
        ? resourceKeys.split(',').filter((key) => key)
        : [];

      const bucketName = process.env.AWS_BUCKET_NAME;
      if (!bucketName) {
        throw new Error('AWS_S3_BUCKET_NAME is not defined');
      }

      const filesInfo = await Promise.all(
        keys.map(async (key) => {
          const params = {
            Bucket: bucketName,
            Key: key,
          };
          try {
            const headData = await s3Client.send(new HeadObjectCommand(params));
            return { key, fileName: headData.Metadata?.filename ?? key };
          } catch (err) {
            console.error(
              `Error al obtener metadata para el archivo ${key}`,
              err
            );
            return { key, fileName: key };
          }
        })
      );

      return NextResponse.json(filesInfo);
    }

    return NextResponse.json(
      { message: 'Archivos no encontrados' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error en la consulta:', error);
    return NextResponse.json(
      { message: 'Error en el servidor' },
      { status: 500 }
    );
  }
}
