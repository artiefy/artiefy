'use client';

import { type FC, useEffect, useState } from 'react';

import { type Product } from '~/types/payu';
import { calculateSignature } from '~/utils/paygateway/signature';

interface PayuFormProps {
  product: Product;
  buyerEmail: string;
  buyerFullName: string;
}

export const PayuForm: FC<PayuFormProps> = ({
  product,
  buyerEmail,
  buyerFullName,
}) => {
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [signature, setSignature] = useState<string>('');

  useEffect(() => {
    // Defer generation to avoid calling Date.now() during render
    const t = setTimeout(() => {
      const ref = product.referenceCode ?? `${product.id}_${Date.now()}`;
      setReferenceCode(ref);
      const sig = calculateSignature(
        process.env.NEXT_PUBLIC_API_KEY ?? '',
        process.env.NEXT_PUBLIC_MERCHANT_ID ?? '',
        ref,
        product.amount,
        'USD'
      );
      setSignature(sig);
    }, 0);

    return () => clearTimeout(t);
  }, [product.id, product.referenceCode, product.amount]);

  return (
    <form
      method="post"
      action={process.env.NEXT_PUBLIC_PAYU_URL}
      className="w-full"
    >
      <input
        name="merchantId"
        type="hidden"
        value={process.env.NEXT_PUBLIC_MERCHANT_ID}
      />
      <input
        name="accountId"
        type="hidden"
        value={process.env.NEXT_PUBLIC_ACCOUNT_ID}
      />
      <input name="description" type="hidden" value={product.description} />
      <input name="referenceCode" type="hidden" value={referenceCode || ''} />
      <input name="amount" type="hidden" value={product.amount} />
      <input name="tax" type="hidden" value="0" />
      <input name="taxReturnBase" type="hidden" value="0" />
      <input name="currency" type="hidden" value="USD" />
      <input name="signature" type="hidden" value={signature} />
      <input
        name="test"
        type="hidden"
        value={process.env.NODE_ENV === 'production' ? '0' : '1'}
      />
      <input name="buyerEmail" type="hidden" value={buyerEmail} />
      <input name="buyerFullName" type="hidden" value={buyerFullName} />
      <input
        name="responseUrl"
        type="hidden"
        value={process.env.NEXT_PUBLIC_RESPONSE_URL}
      />
      <input
        name="confirmationUrl"
        type="hidden"
        value={process.env.NEXT_PUBLIC_CONFIRMATION_URL}
      />

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Proceder al pago
      </button>
    </form>
  );
};
