'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import Script from 'next/script';

import { useUser } from '@clerk/nextjs';
import { FaArrowRight } from 'react-icons/fa';

import AnuncioCarrusel from '~/app/dashboard/super-admin/anuncios/AnuncioCarrusel';
import SmoothGradient from '~/components/estudiantes/layout/Gradient';
import { Header } from '~/components/estudiantes/layout/Header';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';


export default function HomePage() {
	const { user } = useUser();
	const [loading, setLoading] = useState(false);
	const [showAnuncio, setShowAnuncio] = useState(false);
	void showAnuncio;
	const [anuncios, setAnuncios] = useState<
		{
			titulo: string;
			descripcion: string;
			coverImageKey: string;
		}[]
	>([]);

	const dashboardRoute =
		user?.publicMetadata?.role === 'super-admin'
			? '/dashboard/super-admin'
			: user?.publicMetadata?.role === 'educador'
				? '/dashboard/educadores'
				: '/estudiantes';

	useEffect(() => {
		const fetchAnuncioActivo = async (userId: string) => {
			try {
				const res = await fetch('/api/super-admin/anuncios/view-anuncio', {
					headers: { 'x-user-id': userId },
				});
				if (!res.ok) throw new Error('Error al obtener el anuncio activo');

				const data = (await res.json()) as {
					titulo: string;
					descripcion: string;
					coverImageKey: string;
					tipo_destinatario?: string;
				}[];
				if (Array.isArray(data) && data.length > 0) {
					setAnuncios(
						data.map((anuncio) => ({
							titulo: anuncio.titulo,
							descripcion: anuncio.descripcion,
							coverImageKey: anuncio.coverImageKey,
						}))
					);
					setShowAnuncio(true);
				}
			} catch (error) {
				console.error('Error al obtener el anuncio activo:', error);
			}
		};

		if (user?.id) {
			void fetchAnuncioActivo(user.id);
		}
	}, [user]);

	return (
		<>
			<Script id="organization-schema" type="application/ld+json">
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'WebSite',
					name: 'Artiefy',
					url: 'https://artiefy.com',
					sameAs: [
						'https://artiefy.com/planes',
						'https://artiefy.com/estudiantes',
					],
					potentialAction: {
						'@type': 'SearchAction',
						target: 'https://artiefy.com/search?q={search_term_string}',
						'query-input': 'required name=search_term_string',
					},
					mainEntity: {
						'@type': 'Organization',
						name: 'Artiefy',
						url: 'https://artiefy.com',
						logo: 'https://artiefy.com/artiefy-icon.png',
						siteNavigationElement: [
							{
								'@type': 'SiteNavigationElement',
								name: 'Inicio',
								url: 'https://artiefy.com',
							},
							{
								'@type': 'SiteNavigationElement',
								name: 'Planes',
								url: 'https://artiefy.com/planes',
							},
							{
								'@type': 'SiteNavigationElement',
								name: 'Panel de Estudiantes',
								url: 'https://artiefy.com/estudiantes',
							},
						],
					},
				})}
			</Script>

			<Script id="site-structure" type="application/ld+json">
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'Organization',
					'@id': 'https://artiefy.com/#organization',
					name: 'Artiefy',
					url: 'https://artiefy.com',
					logo: 'https://artiefy.com/artiefy-icon.png',
					sameAs: [
						'https://artiefy.com/planes',
						'https://artiefy.com/estudiantes',
					],
					subOrganization: [
						{
							'@type': 'EducationalOrganization',
							name: 'Artiefy Planes',
							url: 'https://artiefy.com/planes',
							description: 'Planes y suscripciones de Artiefy',
						},
						{
							'@type': 'EducationalOrganization',
							name: 'Artiefy Estudiantes',
							url: 'https://artiefy.com/estudiantes',
							description: 'Portal de estudiantes de Artiefy',
						},
					],
				})}
			</Script>

			<Script id="website-schema" type="application/ld+json">
				{JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'WebSite',
					'@id': 'https://artiefy.com/#website',
					name: 'Artiefy - Plataforma Educativa Digital Líder',
					url: 'https://artiefy.com',
				})}
			</Script>

			<div className="relative flex min-h-screen flex-col">
				{anuncios.length > 0 && <AnuncioCarrusel anuncios={anuncios} />}

				<SmoothGradient />
				<div className="relative z-10 flex min-h-screen flex-col">
					<Header />
					<main className="mt-[-10vh] flex grow items-center justify-center">
						<section className="container mx-auto px-4 py-12 text-center">
							<h1 className="mb-5 text-5xl leading-snug font-bold text-white">
								Únete a nosotros y transforma tus ideas en
								<br /> realidades con el {''}
								<span className="text-primary">poder del conocimiento</span>
							</h1>
							<p className="mb-5 text-xl leading-snug">
								Bienvenido a Artiefy, tu plataforma digital educativa dedicada a
								impulsar <br />
								tus conocimientos con ciencia y tecnología.
							</p>
							<div>
								<Button
									asChild
									className="border-primary bg-primary text-background hover:border-primary hover:text-primary relative skew-x-[-20deg] rounded-none border py-8 text-2xl font-semibold italic hover:bg-transparent active:scale-95"
									style={{
										boxShadow: '6px 6px 0 black',
										transition: '0.5s',
										width: '250px',
									}}
									onClick={() => setLoading(true)}
								>
									<Link href={dashboardRoute}>
										<div className="flex w-full items-center justify-center">
											{loading ? (
												<Icons.spinner
													className="animate-spin"
													style={{ width: '35px', height: '35px' }}
												/>
											) : (
												<>
													<span className="inline-block skew-x-[15deg]">
														COMIENZA YA
													</span>
													<FaArrowRight className="animate-bounce-right ml-2 inline-block skew-x-[15deg] transition-transform duration-500" />
												</>
											)}
										</div>
									</Link>
								</Button>
							</div>
						</section>
					</main>
				</div>
			</div>
		</>
	);
}
