import { type NextRequest, NextResponse } from "next/server";
import { updateUserSubscription } from "~/server/actions/estudiantes/confirmation/updateUserSubscription";
import { verifySignature } from "~/utils/verifySignature";

interface PaymentData {
  email_buyer: string;
  state_pol: string;
  merchant_id: string;
  reference_sale: string;
  value: string;
  currency: string;
  sign: string; // ✅ Ahora `sign` es obligatorio
}

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await req.formData();

    // ✅ Verificar que `sign` existe antes de asignarlo
    const sign = formData.get("sign") as string | null;
    if (!sign) {
      console.error("❌ Error: No se recibió la firma.");
      return NextResponse.json({ message: "Missing signature" }, { status: 400 });
    }

    // ✅ Ahora `sign` nunca será undefined
    const paymentData: PaymentData = {
      email_buyer: formData.get("email_buyer") as string,
      state_pol: formData.get("state_pol") as string,
      merchant_id: formData.get("merchant_id") as string,
      reference_sale: formData.get("reference_sale") as string,
      value: formData.get("value") as string,
      currency: formData.get("currency") as string,
      sign: sign, // ✅ Garantizamos que sign es `string`
    };

    console.log("✅ Datos recibidos de PayU:", paymentData);

    if (!verifySignature(paymentData)) {
      console.error("❌ Firma inválida.");
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    if (paymentData.state_pol === "4") {
      console.log("✅ Pago aprobado. Actualizando suscripción...");
      await updateUserSubscription(paymentData);
    } else {
      console.warn(`⚠️ Pago con estado ${paymentData.state_pol}, no se actualiza suscripción.`);
    }

    return NextResponse.json({ message: "Payment confirmed" });

  } catch (error) {
    console.error("❌ Error en el endpoint de confirmación:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
