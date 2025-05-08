'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import '~/styles/loading.css';

// Añadir esta exportación para mejorar el SEO
export const metadata = {
	robots: 'noindex',
};

const Loading: React.FC = () => {
	const [launch, setLaunch] = useState(false);

	useEffect(() => {
		setLaunch(true);
		// Remove setTimeout as it's not necessary and can cause flickering
	}, []);

	return (
		<div className="loading-fullscreen-background">
			<div
				className={`loading-card flex-col ${launch ? 'loading-launch' : ''}`}
				aria-label="Cargando contenido"
			>
				<div className="flex flex-col items-center justify-center gap-8">
					<Image
						src="/artiefy-logo.svg"
						alt="Logo de Artiefy"
						width={200}
						height={60}
						className="mb-4"
						priority
						loading="eager"
					/>
					<div className="flex items-center justify-center gap-8">
						<Image
							src="/cursor.png"
							alt="Logo de Artiefy"
							className="loading-logo"
							width={180}
							height={180}
							priority
							loading="eager"
							aria-hidden="true"
						/>
						<div
							className="loading-wrapper"
							aria-hidden="true"
							style={{ transform: 'translateZ(0)' }} // Force GPU acceleration
						>
							<div className="loading-circle" />
							<div className="loading-circle" />
							<div className="loading-circle" />
							<div className="loading-shadow" />
							<div className="loading-shadow" />
							<div className="loading-shadow" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Loading;
