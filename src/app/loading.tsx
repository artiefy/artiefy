'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import '~/styles/loading.css';

// Add metadata noindex
export const metadata = {
	robots: {
		index: false,
		follow: false,
	},
};

export const dynamic = 'force-static';

const Loading: React.FC = () => {
	const [launch, setLaunch] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setLaunch(true);
		}, 0);
		return () => clearTimeout(timer);
	}, []);

	return (
		<div className="loading-fullscreen-background">
			<div
				className={`loading-card flex-col ${launch ? 'loading-launch' : ''}`}
			>
				<span className="loading-title mb-16 animate-pulse text-5xl sm:text-4xl md:text-4xl lg:text-4xl">
					CARGANDO!
				</span>
				<div className="flex items-center justify-center gap-8">
					<Image
						src="/cursor.png"
						alt="Logo"
						className="loading-logo"
						width={180}
						height={180}
						priority
					/>
					<div className="loading-wrapper">
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
	);
};

export default Loading;
