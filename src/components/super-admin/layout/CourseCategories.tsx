import React from 'react';

import {
	FiCode,
	FiPenTool,
	FiBarChart,
	FiCamera,
	FiMusic,
	FiDatabase,
} from 'react-icons/fi';

const categories = [
	{ icon: <FiCode />, name: 'Programacion', courses: '150+ cursos' },
	{ icon: <FiPenTool />, name: 'Diseño', courses: '200+ cursos' },
	{ icon: <FiBarChart />, name: 'Marketing', courses: '120+ cursos' },
	{ icon: <FiCamera />, name: 'Fotografia', courses: '80+ cursos' },
	{ icon: <FiMusic />, name: 'Musica', courses: '90+ cursos' },
	{ icon: <FiDatabase />, name: 'Ciencia De Datos', courses: '100+ cursos' },
];

const CourseCategories = () => {
	return (
		<section className="py-4">
			<div className="container mx-auto px-4">
				<h2 className="mb-12 text-center text-3xl font-bold">Top Categorias</h2>
				<div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
					{categories.map((category, index) => (
						<div
							key={index}
							className="flex cursor-pointer flex-col items-center rounded-lg bg-gray-50 p-6 transition-shadow hover:scale-105 hover:shadow-lg"
						>
							<div className="mb-4 text-3xl text-blue-600">{category.icon}</div>
							<h3 className="text-background mb-2 text-lg font-semibold">
								{category.name}
							</h3>
							<p className="text-sm text-gray-500">{category.courses}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default CourseCategories;
