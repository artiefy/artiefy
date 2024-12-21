import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    unoptimized: true, // Desactiva la optimización de imágenes
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'artiefy-upload.s3.us-east-2.amazonaws.com',
        pathname: '/**', // Permite todos los archivos del bucket
      },
    ],
  },
};

export default config;
