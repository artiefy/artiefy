import { type NextApiRequest, type NextApiResponse } from 'next';
import { checkAndUpdateSubscriptions } from '~/server/actions/estudiantes/subscriptions/checkAndUpdateSubscriptions';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await checkAndUpdateSubscriptions();
    res
      .status(200)
      .json({ message: 'Suscripciones verificadas y actualizadas' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'Error al verificar y actualizar las suscripciones' });
  }
}
