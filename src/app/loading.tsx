 'use client';

import Image from 'next/image';
import '~/styles/loading.css';

export default function Loading() {
	return (
		<div className="loading-fullscreen-background">
			<div
				className="loading-card loading-launch flex-col"
				aria-label="Cargando contenido"
			>
				<div className="flex flex-col items-center justify-center gap-8">
					<div className="relative w-[200px]">
						<Image
							src="/artiefy-logo.svg"
							alt="Logo de Artiefy"
							width={200}
							height={60}
							priority
							sizes="200px"
							style={{
								width: '100%',
								height: 'auto',
							}}
						/>
					</div>
					<div className="flex items-center justify-center gap-8">
						<Image
							src="/cursor.png"
							alt="Logo de Artiefy"
							className="loading-logo"
							width={180}
							height={180}
							priority
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
}