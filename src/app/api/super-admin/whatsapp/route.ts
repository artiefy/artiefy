import { NextRequest, NextResponse } from "next/server";

const PHONE_NUMBER_ID = "687425254451016";
const ACCESS_TOKEN =
  "EAAgXFWT4Gt8BO1x5vjDLeLcsZBWcedoZC155kqxCaVF2cBazAIb816lNvhOZCaLmrrGzAtD5FrpXJDKmi33A5rJTU1tBcSZADTMnxnojZB84Vi0pUAD8Lv4HsZBTCpiwj9PLP1X7xz6ZC3BKelOwS0fDtLq1FOQP5StVJm1UQeA9zTbWqngDKZCo8HUBLwUfJ8o65OOToqvJfY0AzZBWCAJxev2eRnhGB2tKUyvULMF0JezpEhQZDZD";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { to, message, forceTemplate } = await req.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Falta el parámetro "to"' },
        { status: 400 },
      );
    }

    // 🔥 Lógica simulada para saber si está dentro de ventana de 24h
    // En la vida real aquí mirarías tu DB para ver si el usuario te habló hace menos de 24h
    const isIn24hWindow = !forceTemplate; // si forceTemplate true, obligamos plantilla

    // 👇 Construir payload dinámico
    const whatsappPayload = isIn24hWindow
      ? {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: {
            body: message ?? "Hola! Esto es un mensaje libre.",
          },
        }
      : {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: "hello_world",
            language: { code: "en_US" },
          },
        };

    // Enviar a la Graph API
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(whatsappPayload),
      },
    );

    const data = await res.json();
    const err = data as { error?: { message?: string } };

    if (!res.ok) {
      console.error("❌ Error al enviar WhatsApp:", data);
      return NextResponse.json(
        { error: err.error?.message ?? "Error enviando WhatsApp" },
        { status: 400 },
      );
    }

    console.log("✅ WhatsApp enviado correctamente:", data);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("❌ Error en backend WhatsApp:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
