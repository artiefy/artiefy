import { type NextApiRequest, type NextApiResponse } from 'next';
import { updateUserSubscription } from '~/server/actions/estudiantes/confirmation/updateUserSubscription';
import { verifySignature } from '~/utils/verifySignature';

interface PaymentData {
  email_buyer: string;
  state_pol: string;
  merchant_id: string;
  reference_sale: string;
  value: string;
  currency: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { signature, ...paymentData } = req.body as { signature: string } & PaymentData;

  console.log('Received Payment Data:', paymentData); // Log the received payment data
  console.log('Received Signature:', signature); // Log the received signature

  // Verificar la firma
  if (!verifySignature(paymentData, signature)) {
    console.log('Invalid Signature'); // Log invalid signature
    return res.status(400).json({ message: 'Invalid signature' });
  }

  // Actualizar la suscripción del usuario
  await updateUserSubscription(paymentData);

  res.status(200).json({ message: 'Payment confirmed' });
}
