import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function deleteFromS3(key: string) {
  if (!key) return;
  const Bucket = process.env.AWS_S3_BUCKET_NAME!;
  await s3.send(
    new DeleteObjectCommand({
      Bucket,
      Key: key.startsWith('/') ? key.slice(1) : key,
    })
  );
}
