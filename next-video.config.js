/** @type {import('next-video/video-config').VideoConfig} */
module.exports = {
  provider: 'amazon-s3',
  providerConfig: {
    'amazon-s3': {
      endpoint: process.env.NEXT_PUBLIC_AWS_S3_URL,
      bucket: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      acl: 'public-read',
      headers: {
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*',
      },
    },
  },
  path: '/api/video',
  defaultVideoConfig: {
    forceNativePlayer: true,
  },
};
