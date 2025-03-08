import React from 'react';

import ConsultForm from '~/components/estudiantes/layout/ConsultForm';

const ConsultPage: React.FC = () => {
	return (
		<div className="min-h-screen bg-background">
			<div className="mb-12 px-4 py-12 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="text-center">
						<h2 className="text-3xl font-extrabold text-white sm:text-4xl">
							Consultar Transacción
						</h2>
						<p className="mt-4 text-xl text-primary">
							Ingresa los datos para consultar el estado de tu transacción
						</p>
					</div>
					<div className="mt-12 flex justify-center">
						<ConsultForm />
					</div>
				</div>
			</div>
		</div>
	);
};

export default ConsultPage;
