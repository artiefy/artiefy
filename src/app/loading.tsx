'use client';
import React, { useEffect, useState } from 'react';

import Image from 'next/image';
import '~/styles/loading.css';

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
				<div className="loading-card-info">
					<div className="loading-wrapper">
						<div className="loading-circle" />
						<div className="loading-circle" />
						<div className="loading-circle" />
						<div className="loading-shadow" />
						<div className="loading-shadow" />
						<div className="loading-shadow" />
					</div>
					<span className="loading-animate-pulse">CARGANDO!</span>
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
