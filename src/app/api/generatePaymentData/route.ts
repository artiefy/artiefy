import { type NextRequest, NextResponse } from 'next/server';

import { env } from '~/env';
import { type FormData } from '~/types/payu';
import { getAuthConfig } from '~/utils/paygateway/auth';
import { createFormData } from '~/utils/paygateway/form';
import { getProductById } from '~/utils/paygateway/products';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      productId: number;
      buyerEmail: string;
      buyerFullName: string;
      telephone: string;
    };

    if (
      !body.productId ||
      !body.buyerEmail ||
      !body.buyerFullName ||
      !body.telephone
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const product = getProductById(body.productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const auth = getAuthConfig();
    // Mapear el id del producto al id fijo del plan
    let agradecimientoPlanId = 1; // Pro por defecto
    if (product.name.toLowerCase().includes('premium')) {
      agradecimientoPlanId = 2;
    } else if (product.name.toLowerCase().includes('enterprise')) {
      agradecimientoPlanId = 3;
    }

    const formData: FormData = createFormData(
      auth,
      product,
      body.buyerEmail,
      body.buyerFullName,
      body.telephone,
      `${env.NEXT_PUBLIC_BASE_URL}/agradecimiento-plan/${agradecimientoPlanId}?from=payu`, // Usa id fijo
      'plan' // Specify payment type as plan
    );

    return NextResponse.json(formData);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
