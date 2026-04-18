---
name: aws-s3
description: Configure and use AWS S3 for file storage in Next.js apps. Covers SDK v3 setup, presigned URLs for uploads/downloads, bucket policies, CORS configuration, and environment variables via @t3-oss/env-nextjs. Use when working with file uploads, static assets, or any S3 bucket operation.
---

# AWS S3

Use this skill for all AWS S3 operations in the project stack.

## Before Implementing

Always verify current stable versions before writing code:

- Check `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` latest stable on https://www.npmjs.com/package/@aws-sdk/client-s3
- Check AWS SDK v3 official docs: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/

## Setup

### Install

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Environment Variables (via @t3-oss/env-nextjs in src/env.ts)

```ts
AWS_ACCESS_KEY_ID: z.string().min(1),
AWS_SECRET_ACCESS_KEY: z.string().min(1),
AWS_REGION: z.string().min(1),
AWS_S3_BUCKET_NAME: z.string().min(1),
```

### Client Utility (src/lib/s3.ts)

```ts
import { S3Client } from '@aws-sdk/client-s3';
import { env } from '@/env';

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});
```

## Common Patterns

### Presigned Upload URL (Server Action)

```ts
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '@/lib/s3';
import { env } from '@/env';

export async function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
```

### Presigned Download URL

```ts
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function getDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}
```

### Delete Object

```ts
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function deleteFile(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: key,
    })
  );
}
```

## CORS Configuration

Configure on the S3 bucket for browser-direct uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## Security Rules

- Never expose `AWS_SECRET_ACCESS_KEY` to the client — all S3 operations go through Server Actions or API routes.
- Use presigned URLs with short expiry (max 1 hour) for client uploads.
- Restrict bucket policy to least-privilege access.
- Validate file type and size server-side before generating presigned URLs.

## MCP

- No dedicated MCP for S3. Use official AWS docs and context7 for current patterns.
- Official SDK v3 reference: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
