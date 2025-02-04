import React, { useState, useEffect } from 'react';
import type { CrosswordConfig, WordCruci } from '~/types/typesActi';
import Crossword from '~/components/actividades/crucigrama';
import ConfigForm from '~/components/educators/layout/ConfigCrucigrama';

interface CrearCrucigramaProps {
	saveData: (data: CrosswordConfig) => Promise<void>;
	getData: () => Promise<CrosswordConfig | null>;
}

function CrearCrucigrama({ saveData, getData }: CrearCrucigramaProps) {
	const [gameConfig, setGameConfig] = useState<
		(CrosswordConfig & { words: WordCruci[] }) | null
	>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await getData();
				if (data) {
					setGameConfig(data as CrosswordConfig & { words: WordCruci[] });
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			}
		};
		void fetchData();
	}, [getData]);

	const handleConfigSubmit = async (
		config: CrosswordConfig & { words: WordCruci[] }
	) => {
		setGameConfig(config);
		try {
			await saveData(config);
		} catch (error) {
			console.error('Error saving data:', error);
		}
	};

	return (
		<div className="h-auto rounded-lg bg-gradient-to-br from-primary to-indigo-500 p-8 text-indigo-500">
			<div className="mx-auto max-w-6xl px-4">
				<header className="mb-8 text-center">
					<h1 className="mb-2 text-3xl font-bold text-gray-800">
						Crucigrama Interactivo
					</h1>
					<p className="text-gray-600">
						Configura y juega tu propio crucigrama
					</p>
				</header>

				{!gameConfig ? (
					<ConfigForm onSubmit={handleConfigSubmit} />
				) : (
					<div>
						<button
							onClick={() => setGameConfig(null)}
							className="mb-4 rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
						>
							Volver a Configuración
						</button>
						<Crossword
							words={gameConfig.words}
							timeLimit={gameConfig.timeLimit}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

export default CrearCrucigrama;
