import { useEffect, useState } from 'react';

import { FaFilePdf, FaFilePowerpoint, FaFileWord, FaLink } from 'react-icons/fa';

import { Icons } from '~/components/estudiantes/ui/icons';

interface FileInfo {
	key: string;
	fileName: string;
}

interface LessonResourceProps {
	lessonId: number;
}

const LessonResource = ({ lessonId }: LessonResourceProps) => {
	const [files, setFiles] = useState<FileInfo[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchFiles = async () => {
			try {
				console.log('Fetching files for lessonId:', lessonId);
				const response = await fetch(
					`/api/estudiantes/getFiles?lessonId=${lessonId}`
				);
				console.log('Response status:', response.status);

				if (response.ok) {
					const rawData: unknown = await response.json();

					const isValidFileArray = (data: unknown): data is FileInfo[] => {
						return (
							Array.isArray(data) &&
							data.every(
								(item) =>
									typeof item === 'object' &&
									item !== null &&
									typeof (item as FileInfo).key === 'string' &&
									typeof (item as FileInfo).fileName === 'string'
							)
						);
					};

					if (isValidFileArray(rawData)) {
						console.log('Files data:', rawData);
						setFiles(rawData);
					} else {
						console.error('Invalid data format received');
						setFiles([]);
					}
				} else {
					const errorText = await response.text();
					console.error('Error response:', errorText);
				}
			} catch (error) {
				console.error('Error fetching files:', error);
			} finally {
				setLoading(false);
			}
		};

		void fetchFiles();
	}, [lessonId]);

	const getIcon = (fileName: string) => {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return <FaFilePdf className="text-red-500" />;
			case 'pptx':
			case 'ppt':
				return <FaFilePowerpoint className="text-orange-500" />;
			case 'doc':
			case 'docx':
				return <FaFileWord className="text-blue-500" />;
			default:
				return <FaLink className="text-blue-500" />;
		}
	};

	return (
		<div className="mt-4">
			<h2 className="text-primary mb-4 text-2xl font-bold">Recursos</h2>
			<div className="rounded-lg bg-white p-4 shadow-lg">
				{loading ? (
					<div className="flex items-center justify-center p-4">
						<Icons.spinner className="h-8 w-8 animate-spin text-background" />
					</div>
				) : files.length > 0 ? (
					<ul className="space-y-2">
						{files.map((file, index) => (
							<li key={index}>
								<a
									href={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${file.key}`}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
								>
									<span className="mr-3 text-xl">{getIcon(file.fileName)}</span>
									<span className="flex-1 truncate text-sm font-medium text-gray-700">
										{file.fileName}
									</span>
								</a>
							</li>
						))}
					</ul>
				) : (
					<p className="text-gray-600">No hay recursos disponibles</p>
				)}
			</div>
		</div>
	);
};

export default LessonResource;
