import { type NextRequest, NextResponse } from 'next/server';

import { enrollUserInGuidedProject } from '~/server/actions/estudiantes/guided-projects/enrollUserInGuidedProject';
import {
  getGuidedProjectSale,
  paidAmountMatches,
} from '~/server/payments/productPricing';
import { GUIDED_PROJECT_REFERENCE_PREFIX } from '~/utils/paygateway/form';
import { verifySignature } from '~/utils/paygateway/verifySignature';

// Must stay in sync with the reference built in `createFormData`.
const REFERENCE_PATTERN = new RegExp(
  '^' + GUIDED_PROJECT_REFERENCE_PREFIX + '(\\d+)T'
);

interface GuidedProjectPaymentData {
  email_buyer: string;
  state_pol: string;
  merchant_id: string;
  reference_sale: string;
  value: string;
  currency: string;
  sign: string;
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { message: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const formData = await req.formData();
    const sign = formData.get('sign');

    if (!sign || typeof sign !== 'string') {
      console.error('Payment confirmation without signature');
      return NextResponse.json(
        { message: 'Missing signature' },
        { status: 400 }
      );
    }

    const paymentData: GuidedProjectPaymentData = {
      email_buyer: formData.get('email_buyer') as string,
      state_pol: formData.get('state_pol') as string,
      merchant_id: formData.get('merchant_id') as string,
      reference_sale: formData.get('reference_sale') as string,
      value: formData.get('value') as string,
      currency: formData.get('currency') as string,
      sign: sign,
    };

    if (!verifySignature(paymentData)) {
      console.error('Payment confirmation with invalid signature');
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Solo inscribir si el pago fue aprobado (state_pol === '4')
    if (paymentData.state_pol === '4') {
      const match = REFERENCE_PATTERN.exec(paymentData.reference_sale);
      if (!match) {
        console.error('Payment confirmation with invalid reference format');
        return NextResponse.json(
          { error: 'Invalid reference format' },
          { status: 400 }
        );
      }

      const guidedProjectId = parseInt(match[1], 10);
      const email = paymentData.email_buyer?.trim().toLowerCase();

      if (!email || !guidedProjectId) {
        console.error('Payment confirmation without buyer email or product id');
        return NextResponse.json(
          { error: 'Missing email or guidedProjectId' },
          { status: 400 }
        );
      }

      const sale = await getGuidedProjectSale(guidedProjectId);
      if (
        !sale ||
        !paidAmountMatches(paymentData.value, paymentData.currency, sale.amount)
      ) {
        console.warn(
          'Payment confirmation rejected: paid value does not match the price',
          { guidedProjectId, currency: paymentData.currency }
        );
        return NextResponse.json(
          { error: 'Payment amount mismatch' },
          { status: 400 }
        );
      }

      try {
        const result = await enrollUserInGuidedProject(email, guidedProjectId);

        return NextResponse.json({
          message: 'Guided project payment confirmed and enrollment successful',
          status: 'APPROVED',
          guidedProjectId,
          result,
        });
      } catch (enrollError) {
        console.error(
          'Enrollment failed after approved payment:',
          enrollError instanceof Error ? enrollError.message : 'unknown error'
        );
        return NextResponse.json(
          {
            error: 'Enrollment failed',
            details:
              enrollError instanceof Error
                ? enrollError.message
                : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Payment processed but not approved',
      status: paymentData.state_pol,
    });
  } catch (error) {
    console.error(
      'Error in guided project payment confirmation:',
      error instanceof Error ? error.message : 'unknown error'
    );
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
