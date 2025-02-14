import { type NextRequest, NextResponse } from 'next/server';
import { type FormData } from '~/types/payu';
import { createFormData } from '~/utils/form';
import { getProductById } from '~/utils/products';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { productId: number; buyerEmail: string; buyerFullName: string; telephone: string };
    console.log('Request Body:', body);

    if (!body.productId || !body.buyerEmail || !body.buyerFullName || !body.telephone) {
      console.error('Missing required fields:', body);
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const product = getProductById(body.productId);
    if (!product) {
      console.error('Product not found:', body.productId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const formData: FormData = createFormData(
      {
        merchantId: process.env.MERCHANT_ID ?? '',
        accountId: process.env.ACCOUNT_ID ?? '',
        apiLogin: process.env.API_LOGIN ?? '',
        apiKey: process.env.API_KEY ?? '',
      },
      product,
      body.buyerEmail,
      body.buyerFullName,
      body.telephone,
      'http://www.test.com/response',
      'http://www.test.com/confirmation'
    );

    console.log('Generated Form Data:', formData);

    return NextResponse.json(formData);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
