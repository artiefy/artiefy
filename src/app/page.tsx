'use client';

import { useState } from 'react';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';

import SmoothGradient from '~/components/estudiantes/layout/Gradient';
import { Header } from '~/components/estudiantes/layout/Header';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';

export default function Home() {
	const { user } = useUser();
	const [loading, setLoading] = useState(false);

	const dashboardRoute =
		user?.publicMetadata?.role === 'admin'
			? '/dashboard/admin'
			: user?.publicMetadata?.role === 'educador'
				? '/dashboard/educadores'
				: '/estudiantes';

	const handleButtonClick = () => {
		setLoading(true);
	};

	return (
		<div className="relative flex min-h-screen flex-col">
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
							impulsar <br /> tus conocimientos con ciencia y tecnología.
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
								onClick={handleButtonClick}
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
	);
}
