import { type NextApiRequest, type NextApiResponse } from 'next';
import {
	createTicket,
	getTickets,
} from '~/server/actions/admin/tickets/ticketsAction';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method === 'GET') {
		const tickets = await getTickets();
		return res.status(200).json(tickets);
	} else if (req.method === 'POST') {
		const ticket = await createTicket(req.body);
		return res.status(201).json(ticket);
	} else {
		return res.status(405).end();
	}
}
