import { clerkClient, type User } from "@clerk/nextjs/server";
import { formatInTimeZone } from "date-fns-tz";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";

const SUBSCRIPTION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos
const TIME_ZONE = "America/Bogota";

interface PaymentData {
  email_buyer: string;
  state_pol: string;
  reference_sale: string;
  value?: string;
}

export async function updateUserSubscription(paymentData: PaymentData) {
  const { email_buyer, state_pol, reference_sale } = paymentData;
  console.log("📩 Recibido pago de:", email_buyer, "con estado:", state_pol);

  if (state_pol !== "4") {
    console.warn(
      `⚠️ Pago con estado ${state_pol}, no se actualizó la suscripción.`,
    );
    return;
  }

  // Extraer el tipo de plan del reference_sale
  const planType = reference_sale.includes("pro")
    ? "Pro"
    : reference_sale.includes("premium")
      ? "Premium"
      : reference_sale.includes("enterprise")
        ? "Enterprise"
        : "Pro";

  // Obtener la fecha actual en Bogotá y calcular el fin de suscripción
  const now = new Date();
  const bogotaNow = formatInTimeZone(now, TIME_ZONE, "yyyy-MM-dd HH:mm:ss");
  const subscriptionEndDate = new Date(now.getTime() + SUBSCRIPTION_DURATION);
  const subscriptionEndBogota = formatInTimeZone(
    subscriptionEndDate,
    TIME_ZONE,
    "yyyy-MM-dd HH:mm:ss",
  );

  try {
    // Buscar el usuario en Clerk primero para obtener su ID real
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({
      emailAddress: [email_buyer],
    });

    if (clerkUsers.totalCount === 0) {
      console.warn(`⚠️ Usuario no encontrado en Clerk: ${email_buyer}`);
      return;
    }

    const clerkUser = clerkUsers.data[0] as User;
    const clerkUserId = clerkUser.id;

    // Buscar usuario en la base de datos por email Y rol estudiante
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.email, email_buyer), eq(users.role, "estudiante")),
    });

    if (!existingUser) {
      // Crear nuevo usuario con el ID de Clerk
      await db.insert(users).values({
        id: clerkUserId,
        name: clerkUser.fullName ?? "Usuario",
        email: email_buyer,
        role: "estudiante",
        subscriptionStatus: "active",
        subscriptionEndDate: new Date(subscriptionEndBogota),
        planType: planType,
        purchaseDate: new Date(bogotaNow),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(
        `✅ Usuario estudiante creado en la base de datos con ID de Clerk: ${email_buyer}`,
      );
    } else {
      // Actualizar usuario existente (estudiante)
      await db
        .update(users)
        .set({
          subscriptionStatus: "active",
          subscriptionEndDate: new Date(subscriptionEndBogota),
          planType: planType,
          purchaseDate: new Date(bogotaNow),
          updatedAt: new Date(),
        })
        .where(and(eq(users.email, email_buyer), eq(users.role, "estudiante")));
      console.log(
        `✅ Usuario estudiante existente actualizado a activo: ${email_buyer}`,
      );
    }

    // Actualizar metadata en Clerk
    await clerk.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: {
        subscriptionStatus: "active",
        subscriptionEndDate: subscriptionEndBogota,
        planType: planType,
      },
    });

    console.log(`✅ Clerk metadata actualizado para ${email_buyer}`);

    // Logs de depuración
    console.log(`📅 Inicio suscripción (Bogotá): ${bogotaNow}`);
    console.log(`📅 Fin suscripción (Bogotá): ${subscriptionEndBogota}`);
    console.log(`👤 Usuario ID utilizado: ${clerkUserId}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error:", errorMessage);
    throw new Error(errorMessage);
  }
}
