import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { S3Client } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const { contentType } = (await request.json()) as { contentType: string };

  try {
    const client = new S3Client({ region: process.env.AWS_REGION });
    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME is not defined');
    }

    const { url, fields } = await createPresignedPost(client, {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uuidv4(),
      Conditions: [
        ['content-length-range', 0, 524288000], // Hasta 500 MB
        ['starts-with', '$Content-Type', contentType],
      ],
      Fields: {
        acl: 'public-read',
        'Content-Type': contentType,
      },
      Expires: 3600, // 1 hora
    });

    return Response.json({ url, fields });
  } catch (error) {
    return Response.json({ error: (error as Error).message });
  }
}
