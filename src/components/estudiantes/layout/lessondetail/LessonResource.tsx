import { useEffect, useState } from 'react';

import { BsFiletypeXls } from 'react-icons/bs';
import {
	FaFilePdf,
	FaFilePowerpoint,
	FaFileWord,
	FaLink,
	FaRegFileImage,
} from 'react-icons/fa';

import { Icons } from '~/components/estudiantes/ui/icons';

interface FileInfo {
	key: string;
	fileName: string;
}

interface ApiResponse {
	files: FileInfo[];
	message?: string;
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
				const response = await fetch(
					`/api/estudiantes/getFiles?lessonId=${lessonId}`
				);

				if (response.ok) {
					const data = (await response.json()) as ApiResponse;
					setFiles(Array.isArray(data) ? data : []);
				} else {
					setFiles([]);
				}
			} catch (error) {
				console.error('Error fetching files:', error);
				setFiles([]);
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
			case 'xlsx':
			case 'xls':
				return <BsFiletypeXls className="text-green-600" />;
			case 'png':
			case 'jpg':
			case 'jpeg':
			case 'gif':
				return <FaRegFileImage className="text-purple-500" />;
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
						<Icons.spinner className="text-background h-8 w-8" />
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
									<span
										className="flex-1 truncate text-sm font-medium text-gray-700"
										title={file.fileName} // Agregar el atributo title para mostrar el tooltip
									>
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
