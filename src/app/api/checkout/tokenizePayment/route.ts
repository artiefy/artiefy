import { type NextRequest, NextResponse } from 'next/server';

import { clerkClient } from '@clerk/nextjs/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { env } from '~/env';
import { updateUserSubscription } from '~/server/actions/estudiantes/confirmation/updateUserSubscription';
import { enrollUserInCourse } from '~/server/actions/estudiantes/courses/enrollIndividualCourse';
import { db } from '~/server/db';
import { courses, courseTypes } from '~/server/db/schema';
import { getAuthConfig } from '~/utils/paygateway/auth';
import { getProductById } from '~/utils/paygateway/products';
import {
  buildDeviceSessionId,
  createCreditCardToken,
  detectCardNetwork,
  isValidCardNumber,
  normalizeCardNumber,
  submitTokenizedTransaction,
} from '~/utils/paygateway/tokenization';

import type { TokenizedPaymentResult } from '~/types/checkout';

/**
 * Charges a card through PayU's tokenization API so the buyer never leaves the
 * checkout modal.
 *
 * Two rules this route exists to enforce:
 *
 *  - The price is read from the database, never from the request body. The
 *    client picks *what* to buy; the server decides what it costs.
 *  - Card data lives only inside this request. Nothing here persists or logs
 *    the PAN or the security code, and only the masked number is returned.
 *
 * PSE never reaches this route: that method redirects to PayU's WebCheckout,
 * which keeps card handling entirely on PayU's side.
 */

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// A public endpoint that charges cards is a card-testing target. Five attempts
// per identity per ten minutes leaves room for a mistyped CVV without leaving
// the door open to enumeration.
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  prefix: 'checkout:tokenize',
});

const requestSchema = z.object({
  purchaseKind: z.enum(['unit', 'subscription']),
  productId: z.number().int().positive(),
  buyerEmail: z.email().max(255),
  buyerFullName: z.string().trim().min(3).max(120),
  buyerPhone: z.string().trim().min(7).max(20),
  card: z.object({
    number: z.string().trim().min(13).max(25),
    holderName: z.string().trim().min(3).max(60),
    // Already normalized to `YYYY/MM` by the client before it gets here.
    expirationDate: z.string().regex(/^\d{4}\/\d{2}$/),
    securityCode: z
      .string()
      .trim()
      .regex(/^\d{3,4}$/),
    documentNumber: z
      .string()
      .trim()
      .regex(/^\d{5,15}$/),
    installments: z.number().int().min(1).max(36),
  }),
});

/** What the buyer is paying for, priced by the server. */
interface ResolvedPurchase {
  amount: number;
  description: string;
  referenceCode: string;
  notifyUrl: string;
}

function buildErrorResult(message: string): TokenizedPaymentResult {
  return { state: 'ERROR', message };
}

async function resolveCoursePurchase(
  courseId: number,
  timestamp: number
): Promise<ResolvedPurchase | null> {
  const [row] = await db
    .select({
      title: courses.title,
      courseTypeId: courses.courseTypeId,
      individualPrice: courses.individualPrice,
      typePrice: courseTypes.price,
      isPurchasableIndividually: courseTypes.isPurchasableIndividually,
    })
    .from(courses)
    .leftJoin(courseTypes, eq(courses.courseTypeId, courseTypes.id))
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!row) return null;

  // Course type 4 is this repo's "pago unitario" type; the flag on the joined
  // course type covers any other type marked purchasable on its own.
  const isPurchasable =
    row.courseTypeId === 4 || row.isPurchasableIndividually === true;
  const amount = row.individualPrice ?? row.typePrice ?? 0;

  if (!isPurchasable || amount <= 0) return null;

  return {
    amount,
    description: row.title,
    // `confirmCoursePayment` parses this exact shape to find the course, so a
    // tokenized sale and a WebCheckout sale confirm through the same webhook.
    referenceCode: `C${courseId}T${timestamp}`,
    notifyUrl: env.CONFIRMATION_URL_COURSES,
  };
}

function resolvePlanPurchase(
  planId: number,
  timestamp: number
): ResolvedPurchase | null {
  const product = getProductById(planId);
  if (!product) return null;

  const amount = Math.round(Number(product.amount));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // `updateUserSubscription` reads the plan tier out of the reference code, so
  // the plan name has to survive into it exactly as the WebCheckout path does.
  const cleanProductName = product.name.replace(/\s*Premium\s*/g, '').trim();

  return {
    amount,
    description: `Plan ${product.name}`,
    referenceCode: `${cleanProductName}_${timestamp}`,
    notifyUrl: env.CONFIRMATION_URL_PLANS,
  };
}

/** Maps PayU's transaction states onto a message the buyer can act on. */
function describeState(
  state: string,
  responseCode: string,
  responseMessage: string
): { state: TokenizedPaymentResult['state']; message: string } {
  if (state === 'APPROVED') {
    return {
      state: 'APPROVED',
      message: 'Tu pago fue aprobado. Ya tienes acceso.',
    };
  }

  if (state === 'PENDING') {
    return {
      state: 'PENDING',
      message:
        'Tu pago quedo pendiente de confirmacion. Te avisaremos por correo apenas el banco lo apruebe.',
    };
  }

  if (state === 'DECLINED') {
    const reason =
      responseCode === 'INSUFFICIENT_FUNDS'
        ? 'La tarjeta no tiene fondos suficientes.'
        : responseCode === 'INVALID_CARD'
          ? 'Los datos de la tarjeta no son validos.'
          : responseCode === 'EXPIRED_CARD'
            ? 'La tarjeta esta vencida.'
            : (responseMessage ??
              'El banco rechazo el cobro. Intenta con otra tarjeta.');

    return { state: 'DECLINED', message: reason };
  }

  if (state === 'EXPIRED') {
    return {
      state: 'EXPIRED',
      message: 'La transaccion expiro. Vuelve a intentar el pago.',
    };
  }

  return {
    state: 'ERROR',
    message:
      responseMessage || 'No pudimos procesar el pago. Intenta nuevamente.',
  };
}

export async function POST(req: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        buildErrorResult(
          'Los datos del pago estan incompletos o son invalidos.'
        ),
        { status: 400 }
      );
    }

    const body = parsed.data;
    const normalizedEmail = body.buyerEmail.trim().toLowerCase();

    const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
    const ipAddress = forwardedFor.split(',')[0]?.trim() ?? '127.0.0.1';
    const userAgent = req.headers.get('user-agent') ?? 'Artiefy/checkout';

    const { success } = await ratelimit.limit(
      `${ipAddress}:${normalizedEmail}`
    );
    if (!success) {
      return NextResponse.json(
        buildErrorResult(
          'Demasiados intentos de pago. Espera unos minutos antes de volver a intentar.'
        ),
        { status: 429 }
      );
    }

    // Step 2 of the checkout always provisions the Clerk account before the
    // card step, so a buyer with no account here means the request did not
    // come through the flow.
    const clerk = await clerkClient();
    const existing = await clerk.users.getUserList({
      emailAddress: [normalizedEmail],
    });

    if (existing.totalCount === 0) {
      return NextResponse.json(
        buildErrorResult(
          'No encontramos tu cuenta. Vuelve al paso anterior para crearla.'
        ),
        { status: 403 }
      );
    }

    const payerId = existing.data[0]!.id;
    const timestamp = Date.now();

    const purchase =
      body.purchaseKind === 'unit'
        ? await resolveCoursePurchase(body.productId, timestamp)
        : resolvePlanPurchase(body.productId, timestamp);

    if (!purchase) {
      return NextResponse.json(
        buildErrorResult('Este producto no esta disponible para compra.'),
        { status: 400 }
      );
    }

    const cardNumber = normalizeCardNumber(body.card.number);
    if (!isValidCardNumber(cardNumber)) {
      return NextResponse.json(
        buildErrorResult('El numero de tarjeta no es valido.'),
        { status: 400 }
      );
    }

    const network = detectCardNetwork(cardNumber);
    if (!network) {
      return NextResponse.json(
        buildErrorResult('No reconocemos esa franquicia de tarjeta.'),
        { status: 400 }
      );
    }

    const token = await createCreditCardToken({
      auth: getAuthConfig(),
      cardNumber,
      holderName: body.card.holderName,
      expirationDate: body.card.expirationDate,
      documentNumber: body.card.documentNumber,
      payerId,
      network,
    });

    const transaction = await submitTokenizedTransaction({
      auth: getAuthConfig(),
      creditCardTokenId: token.creditCardTokenId,
      securityCode: body.card.securityCode,
      network,
      installments: body.card.installments,
      referenceCode: purchase.referenceCode,
      description: purchase.description,
      amount: purchase.amount,
      notifyUrl: purchase.notifyUrl,
      buyerEmail: normalizedEmail,
      buyerFullName: body.buyerFullName,
      buyerPhone: body.buyerPhone,
      documentNumber: body.card.documentNumber,
      payerId,
      ipAddress,
      userAgent,
      deviceSessionId: buildDeviceSessionId(userAgent),
    });

    const outcome = describeState(
      transaction.state,
      transaction.responseCode,
      transaction.responseMessage
    );

    // An approved card charge answers synchronously, so we grant access here
    // instead of waiting on the webhook. PENDING transactions still land on
    // `notifyUrl`, which runs the same grant.
    if (outcome.state === 'APPROVED') {
      if (body.purchaseKind === 'unit') {
        await enrollUserInCourse(normalizedEmail, body.productId);
      } else {
        await updateUserSubscription({
          email_buyer: normalizedEmail,
          state_pol: '4',
          reference_sale: purchase.referenceCode,
          value: String(purchase.amount),
        });
      }
    }

    const result: TokenizedPaymentResult = {
      ...outcome,
      orderId: transaction.orderId,
      transactionId: transaction.transactionId,
      referenceCode: purchase.referenceCode,
      maskedNumber: token.maskedNumber,
    };

    return NextResponse.json(result);
  } catch (error) {
    // Deliberately terse: the request body held card data, so nothing from it
    // goes into the log line.
    console.error(
      'tokenizePayment failed:',
      error instanceof Error ? error.message : 'unknown error'
    );

    return NextResponse.json(
      buildErrorResult(
        error instanceof Error
          ? error.message
          : 'No pudimos procesar el pago. Intenta nuevamente.'
      ),
      { status: 502 }
    );
  }
}
