import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { type Metadata, type ResolvingMetadata } from 'next';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { ProgramDetailsSkeleton } from '~/components/estudiantes/layout/programdetail/ProgramDetailsSkeleton';
import { getProgramById } from '~/server/actions/estudiantes/programs/getProgramById';

import ProgramDetails from './ProgramDetails';

interface Program {
	id: string;
	title: string;
	description: string | null;
	coverImageKey: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
	creatorId?: string;
	rating?: number | null;
	categoryid?: number;
}

interface PageProps {
	params: Promise<{ id: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Función para generar el JSON-LD para SEO
function generateJsonLd(program: Program): object {
	return {
		'@context': 'https://schema.org',
		'@type': 'Course',
		name: program.title,
		description: program.description ?? 'No hay descripción disponible.',
		provider: {
			'@type': 'Organization',
			name: 'Artiefy',
			sameAs: process.env.NEXT_PUBLIC_BASE_URL ?? '',
		},
		dateCreated: program.createdAt?.toISOString() ?? '',
		dateModified: program.updatedAt?.toISOString() ?? '',
		image: program.coverImageKey
			? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
			: 'https://placehold.co/600x400/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT',
	};
}

export async function generateMetadata(
	{ params }: PageProps,
	parent: ResolvingMetadata
): Promise<Metadata> {
	const { id } = await params;
	const program = await getProgramById(id);

	if (!program) {
		return {
			title: 'Programa no encontrado',
			description: 'El programa solicitado no pudo ser encontrado.',
		};
	}

	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';
	const metadataBase = new URL(baseUrl);

	// Optionally access and extend parent metadata
	const previousImages = (await parent).openGraph?.images ?? [];

	const coverImageUrl = new URL(
		program.coverImageKey
			? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${program.coverImageKey}`
			: 'https://placehold.co/1200x630/01142B/3AF4EF?text=Artiefy&font=MONTSERRAT'
	).toString();

	return {
		metadataBase,
		title: `${program.title} | Artiefy`,
		description: program.description ?? 'No hay descripción disponible.',
		openGraph: {
			type: 'website',
			locale: 'es_ES',
			url: new URL(`/estudiantes/programas/${id}`, baseUrl).toString(),
			siteName: 'Artiefy',
			title: `${program.title} | Artiefy`,
			description: program.description ?? 'No hay descripción disponible.',
			images: [
				{
					url: coverImageUrl,
					width: 1200,
					height: 630,
					alt: `Portada del programa: ${program.title}`,
					type: program.coverImageKey?.endsWith('.png')
						? 'image/png'
						: 'image/jpeg',
				},
				...previousImages,
			],
		},
		twitter: {
			card: 'summary_large_image',
			title: `${program.title} | Artiefy`,
			description: program.description ?? 'No hay descripción disponible.',
			images: [coverImageUrl],
			creator: '@artiefy',
			site: '@artiefy',
		},
	};
}

export default function Page({ params }: PageProps) {
	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<Suspense fallback={<ProgramDetailsSkeleton />}>
				<ProgramContent params={params} />
			</Suspense>
			<Footer />
		</div>
	);
}

async function ProgramContent({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const program = await getProgramById(id);

	if (!program) {
		notFound();
	}

	const jsonLd = generateJsonLd(program);

	return (
		<>
			<ProgramDetails program={program} />
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd),
				}}
			/>
		</>
	);
}
