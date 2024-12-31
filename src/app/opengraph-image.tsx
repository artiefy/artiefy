/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OG Artiefy";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  // Font
  const montserratBold = fetch(
    new URL("../fonts/Montserrat-Bold.ttf", import.meta.url),
  ).then((res) => res.arrayBuffer());

  // Obtener la URL base
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(to bottom, #3AF4EF, #00BDD8)",
          textAlign: "center",
          padding: 50,
        }}
      >
        <img
          src={new URL("/artiefy-icon.png", baseUrl).toString()}
          alt="Logo"
          style={{ width: 200, height: 200, marginBottom: 20 }}
        />
        <div style={{ fontSize: 64, fontWeight: "bold", color: "#01142B" }}>
          Artiefy
        </div>
        <div style={{ fontSize: 32, fontWeight: "normal", color: "#01142B", marginTop: 20 }}>
          Bienvenido a Artiefy, donde el aprendizaje nunca se detiene. ¡Inspírate y crece con nosotros!
        </div>
        <div style={{ fontSize: 48, marginTop: 20 }}>
          🎓 📚
        </div>
      </div>
    ),
    {
      ...size,
      emoji: 'blobmoji',
      fonts: [
        {
          name: "Inter",
          data: await montserratBold,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
