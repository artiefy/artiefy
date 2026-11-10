import { type NextRequest, NextResponse } from 'next/server';

import { updateUserSubscription } from '~/server/actions/estudiantes/confirmation/updateUserSubscription';
import {
  getPlanPrice,
  getPlanTierFromReference,
  paidAmountMatches,
} from '~/server/payments/productPricing';
import { verifySignature } from '~/utils/paygateway/verifySignature';

interface PaymentData {
  email_buyer: string;
  state_pol: string;
  merchant_id: string;
  reference_sale: string;
  value: string;
  currency: string;
  sign: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const paymentData: PaymentData = {
      email_buyer: formData.get('email_buyer') as string,
      state_pol: formData.get('state_pol') as string,
      merchant_id: formData.get('merchant_id') as string,
      reference_sale: formData.get('reference_sale') as string,
      value: formData.get('value') as string,
      currency: formData.get('currency') as string,
      sign: formData.get('sign') as string,
    };

    if (!verifySignature(paymentData)) {
      console.error('❌ Invalid signature for plan payment');
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 400 }
      );
    }

    if (paymentData.state_pol === '4') {
      // The signature only proves PayU sent these values; the amount itself
      // came from the checkout, so it is checked against the plan price here.
      const tier = getPlanTierFromReference(paymentData.reference_sale ?? '');
      const expectedAmount = getPlanPrice(tier);
      if (
        expectedAmount === null ||
        !paidAmountMatches(
          paymentData.value,
          paymentData.currency,
          expectedAmount
        )
      ) {
        console.warn(
          'Plan payment rejected: paid value does not match the plan price',
          { tier, currency: paymentData.currency }
        );
        return NextResponse.json(
          { error: 'Payment amount mismatch' },
          { status: 400 }
        );
      }

      // Agregar headers para evitar caché
      const headers = new Headers({
        'Cache-Control': 'no-store, must-revalidate, private',
        Pragma: 'no-cache',
        Expires: '0',
      });

      await updateUserSubscription(paymentData);

      return NextResponse.json(
        {
          message: 'Subscription payment confirmed and processed',
          status: 'APPROVED',
        },
        { headers }
      );
    }

    // Si el estado no es 4, devolver estado actual
    return NextResponse.json({
      message: 'Payment processed but not approved',
      status: paymentData.state_pol,
    });
  } catch (error) {
    console.error(
      '❌ Error in plan payment confirmation:',
      error instanceof Error ? error.message : 'unknown error'
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
