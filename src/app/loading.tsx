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
		<div className="fullscreen-background">
			<div className={`card ${launch ? 'launch' : ''}`}>
				<div className="card-info">
					<div className="wrapper">
						<div className="circle"></div>
						<div className="circle"></div>
						<div className="circle"></div>
						<div className="shadow"></div>
						<div className="shadow"></div>
						<div className="shadow"></div>
					</div>
					<span className="animate-pulse">CARGANDO!</span>
				</div>
				<Image
					src="/cursor.png"
					alt="Logo"
					className="logo"
					width={140}
					height={140}
					priority
				/>
			</div>
		</div>
	);
};

export default Loading;
