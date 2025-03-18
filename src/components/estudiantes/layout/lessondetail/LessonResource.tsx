import { FaFilePdf, FaFilePowerpoint, FaLink } from 'react-icons/fa';

interface RecursosLessonProps {
	resourceNames: string[];
}

const LessonResource = ({ resourceNames }: RecursosLessonProps) => {
	const getIcon = (fileName: string) => {
		const extension = fileName.split('.').pop();
		switch (extension) {
			case 'pdf':
				return <FaFilePdf className="text-red-500" />;
			case 'pptx':
				return <FaFilePowerpoint className="text-orange-500" />;
			default:
				return <FaLink className="text-blue-500" />;
		}
	};

	const getFileUrl = (fileName: string) => {
		// Utilizamos la variable de entorno para la URL del bucket S3
		return `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${fileName}`;
	};

	return (
		<div className="w-72 bg-background px-4 shadow-lg">
			<h2 className="mb-4 text-2xl font-bold text-primary">Recursos</h2>
			{resourceNames.length > 0 ? (
				<ul>
					{resourceNames.map((fileName, index) => (
						<li key={index} className="mb-2">
							<div className="flex items-center rounded-lg bg-white p-2 shadow">
								{getIcon(fileName)}
								<a
									href={getFileUrl(fileName)}
									target="_blank"
									rel="noopener noreferrer"
									className="ml-2 font-bold text-black hover:underline"
								>
									{fileName}
								</a>
							</div>
						</li>
					))}
				</ul>
			) : (
				<p className="text-gray-600">No hay recursos disponibles</p>
			)}
		</div>
	);
};

export default LessonResource;
