import { type NextRequest, NextResponse } from 'next/server';
import { env } from '~/env';
import { type FormData } from '~/types/payu';
import { getAuthConfig } from '~/utils/paygateway/auth';
import { createFormData } from '~/utils/paygateway/form';
import { getProductById } from '~/utils/paygateway/products';

// Configure route behavior
export const dynamic = 'force-dynamic'

// Types
interface PaymentRequestBody {
  productId: number;
  buyerEmail: string;
  buyerFullName: string;
  telephone: string;
}

// Validation function
const validateRequestBody = (body: PaymentRequestBody): string | null => {
  if (!body.productId) return 'Product ID is required';
  if (!body.buyerEmail) return 'Buyer email is required';
  if (!body.buyerFullName) return 'Buyer full name is required';
  if (!body.telephone) return 'Telephone is required';
  return null;
};

export async function POST(req: NextRequest) {
  console.log('📥 Generating payment data...');

  try {
    // Parse and validate request body
    const body = await req.json() as PaymentRequestBody;
    const validationError = validateRequestBody(body);

    if (validationError) {
      console.warn('⚠️ Validation error:', validationError);
      return NextResponse.json(
        { 
          success: false,
          error: validationError 
        },
        { status: 400 }
      );
    }

    // Get product details
    const product = getProductById(body.productId);
    if (!product) {
      console.warn('⚠️ Product not found:', body.productId);
      return NextResponse.json(
        { 
          success: false,
          error: 'Product not found' 
        }, 
        { status: 404 }
      );
    }

    // Generate payment data
    console.log('✓ Generating form data for product:', product.name);
    const auth = getAuthConfig();
    const formData: FormData = createFormData(
      auth,
      product,
      body.buyerEmail,
      body.buyerFullName,
      body.telephone,
      env.RESPONSE_URL,
      env.CONFIRMATION_URL
    );

    console.log('✅ Payment data generated successfully');
    return NextResponse.json({
      success: true,
      data: formData
    });

  } catch (error) {
    console.error('❌ Error generating payment data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}
