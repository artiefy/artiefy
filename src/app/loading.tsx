'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import '~/styles/loading.css';

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
			<div className={`loading-card ${launch ? 'loading-launch' : ''}`}>
				<div className="loading-card-info flex flex-col items-center">
					<span className="mb-4 animate-pulse text-xl sm:text-2xl md:text-3xl lg:text-4xl">
						CARGANDO!
					</span>
					<div className="loading-wrapper">
						<div className="loading-circle" />
						<div className="loading-circle" />
						<div className="loading-circle" />
						<div className="loading-shadow" />
						<div className="loading-shadow" />
						<div className="loading-shadow" />
					</div>
				</div>
				<Image
					src="/cursor.png"
					alt="Logo"
					className="loading-logo"
					width={140}
					height={140}
					priority
				/>
			</div>
		</div>
	);
};

export default Loading;
