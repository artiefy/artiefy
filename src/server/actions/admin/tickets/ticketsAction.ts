import { currentUser } from '@clerk/nextjs/server';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { db } from '~/server/db';
import { tickets, tickets as ticketsTable } from '~/server/db/schema';
import { type Ticket } from '~/types/Tickets';

const s3 = new S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_REGION,
});

interface CreateTicketInput {
	titulo: string;
	estado: 'pendiente' | 'en_proceso' | 'critico' | 'completado';
	asignadoA: string | null;
	prioridad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
	descripcion: string;
	urlImagen?: File;
	categorias: string[];
}

export async function createTicket(input: CreateTicketInput) {
	const user = await currentUser();
	if (!user) {
		throw new Error('Usuario no autenticado');
	}

	let imageUrl = null;

	if (input.urlImagen) {
		const imageKey = `tickets/${uuidv4()}`;
		const params = {
			Bucket: process.env.AWS_S3_BUCKET_NAME!,
			Key: imageKey,
			Body: input.urlImagen,
			ContentType: input.urlImagen.type,
		};

		const uploadResult = await s3.upload(params).promise();
		imageUrl = uploadResult.Location;
	}

	const newTicket = {
		id: Date.now(), // or any other logic to generate a unique number
		titulo: input.titulo,
		estado: input.estado === 'completado', // Convert to boolean
		asignadoA: input.asignadoA,
		prioridad: input.prioridad,
		descripcion: input.descripcion,
		urlImagen: imageUrl,
		fechaCreacion: new Date().toISOString(),
		fecha: new Date().toISOString(), // Add this line to include the fecha property
		categorias: input.categorias,
		archivado: false,
		email: user.emailAddresses[0].emailAddress,
		description: input.descripcion,
		userId: user.id,
		comments: '',
	};

	await db.insert(tickets).values(newTicket);

	return newTicket;
}

export async function getTickets(): Promise<Ticket[]> {
	const tickets: Ticket[] = await db
		.select()
		.from(ticketsTable)
		.then((rows) => rows.map((row) => row as unknown as Ticket));
	return tickets;
}
