import { type NextRequest, NextResponse } from 'next/server';

import { enrollUserInGuidedProject } from '~/server/actions/estudiantes/guided-projects/enrollUserInGuidedProject';
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
      console.error('❌ Error: No signature received');
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

    console.log('🧩 Guided project payment data:', paymentData);

    if (!verifySignature(paymentData)) {
      console.error('❌ Invalid signature for guided project payment');
      return NextResponse.json(
        { message: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Solo inscribir si el pago fue aprobado (state_pol === '4')
    if (paymentData.state_pol === '4') {
      const match = REFERENCE_PATTERN.exec(paymentData.reference_sale);
      if (!match) {
        console.error(
          '❌ Invalid reference format:',
          paymentData.reference_sale
        );
        return NextResponse.json(
          { error: 'Invalid reference format' },
          { status: 400 }
        );
      }

      const guidedProjectId = parseInt(match[1], 10);
      const email = paymentData.email_buyer?.trim().toLowerCase();

      console.log('✅ Processing guided project enrollment:', {
        guidedProjectId,
        email,
      });

      if (!email || !guidedProjectId) {
        console.error('❌ Missing email or guidedProjectId for enrollment');
        return NextResponse.json(
          { error: 'Missing email or guidedProjectId' },
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
        console.error('❌ Enrollment failed:', enrollError);
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
    console.error('❌ Error in guided project payment confirmation:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
