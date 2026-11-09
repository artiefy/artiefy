import { type NextRequest, NextResponse } from 'next/server';

import { env } from '~/env';
import { getGuidedProjectSale } from '~/server/payments/productPricing';
import { type PaymentFormResponse } from '~/types/payu';
import { getAuthConfig, getCheckoutUrl } from '~/utils/paygateway/auth';
import { createFormData } from '~/utils/paygateway/form';

// `amount` and `description` are still sent by the checkout client but are
// ignored: the server prices the product from the database.
interface RequestBody {
  productId: number;
  buyerEmail: string;
  buyerFullName: string;
  telephone: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;
    const productId = Number(body.productId);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: 'Producto no valido' },
        { status: 400 }
      );
    }

    const sale = await getGuidedProjectSale(productId);
    if (!sale) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }
    if (!sale.isPurchasable) {
      return NextResponse.json(
        { error: 'Este proyecto no esta disponible para compra individual' },
        { status: 400 }
      );
    }

    const auth = getAuthConfig();

    const formData = createFormData(
      auth,
      {
        id: productId,
        name: sale.title,
        amount: sale.amount.toFixed(2),
        description: sale.title,
      },
      body.buyerEmail,
      body.buyerFullName,
      body.telephone,
      `${env.NEXT_PUBLIC_BASE_URL}/agradecimiento-proyecto/${productId}?from=payu&email=${encodeURIComponent(body.buyerEmail)}`, // incluir email del comprador
      'guidedProject'
    );

    const payload: PaymentFormResponse = {
      ...formData,
      checkoutUrl: getCheckoutUrl(auth.mode),
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error(
      'Error generating guided project payment data:',
      error instanceof Error ? error.message : 'unknown error'
    );
    return NextResponse.json(
      { error: 'Failed to generate payment data' },
      { status: 500 }
    );
  }
}
