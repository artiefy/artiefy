'use client';

import { useState } from 'react';

import { FileCheck2, Upload, FileX2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '~/components/estudiantes/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { Icons } from '~/components/estudiantes/ui/icons';

import type { Activity } from '~/types';

interface DocumentModalProps {
	isOpen: boolean;
	onCloseAction: () => Promise<void>;
	activity: Activity;
	userId: string;
	onDocumentUploadedAction: () => Promise<void>;
}

interface PresignedPostResponse {
	url: string;
	fields: Record<string, string>;
	key: string;
}

interface DocumentUploadResponse {
	success: boolean;
	error?: string;
}

const ALLOWED_TYPES = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'image/png',
	'image/jpeg',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function LessonDocumentModal({
	isOpen,
	onCloseAction,
	activity,
	userId,
	onDocumentUploadedAction,
}: DocumentModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0] ?? null;
		if (!selectedFile) return;

		if (!ALLOWED_TYPES.includes(selectedFile.type)) {
			toast.error('Tipo de archivo no permitido');
			return;
		}

		if (selectedFile.size > MAX_FILE_SIZE) {
			toast.error('El archivo excede el tamaño máximo permitido (5MB)');
			return;
		}

		setFile(selectedFile);
	};

	const uploadFile = async () => {
		if (!file) return;

		try {
			setIsUploading(true);

			// Get presigned URL
			const presignedResponse = await fetch(
				'/api/activities/uploadDocument/presignedUrl',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						filename: file.name,
						contentType: file.type,
					}),
				}
			);

			if (!presignedResponse.ok) {
				throw new Error('Error getting upload URL');
			}

			const { url, fields, key } =
				(await presignedResponse.json()) as PresignedPostResponse;

			// Create form data with fields from presigned URL
			const formData = new FormData();
			Object.entries(fields).forEach(([fieldKey, value]) => {
				formData.append(fieldKey, value);
			});
			formData.append('file', file);

			// Upload to S3
			const uploadResponse = await fetch(url, {
				method: 'POST',
				body: formData,
			});

			if (!uploadResponse.ok) {
				throw new Error('Error uploading file');
			}

			// Save document metadata
			const saveResponse = await fetch('/api/activities/uploadDocument', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					activityId: activity.id,
					userId,
					fileKey: key,
					fileName: file.name,
					fileType: file.type,
				}),
			});

			const saveResult = (await saveResponse.json()) as DocumentUploadResponse;
			if (!saveResponse.ok || !saveResult.success) {
				throw new Error(saveResult.error ?? 'Error saving document metadata');
			}

			toast.success('Documento subido exitosamente');
			await onDocumentUploadedAction();
			await onCloseAction();
		} catch (error) {
			console.error('Upload error:', error);
			toast.error(
				error instanceof Error ? error.message : 'Error al subir el documento'
			);
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onCloseAction()}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between text-2xl">
						{activity.name}
						{activity.isCompleted ? (
							<div className="flex items-center gap-2">
								<span className="text-sm font-normal text-green-600">
									Documento subido
								</span>
								<FileCheck2 className="h-6 w-6 text-green-500" />
							</div>
						) : (
							<FileX2 className="h-6 w-6 text-gray-400" />
						)}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="rounded-lg bg-gray-50 p-4">
						<p className="text-gray-700">{activity.description}</p>
					</div>

					<div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
						<input
							type="file"
							onChange={handleFileSelect}
							accept={ALLOWED_TYPES.join(',')}
							className="hidden"
							id="fileInput"
						/>

						<label htmlFor="fileInput" className="cursor-pointer">
							<Upload className="mx-auto h-12 w-12 text-gray-400" />
							<p className="mt-2 text-sm text-gray-600">
								{file ? file.name : 'Haz clic para seleccionar un archivo'}
							</p>
							<p className="mt-1 text-xs text-gray-400">
								PDF, DOC, DOCX, PNG, JPG (máx. 5MB)
							</p>
						</label>

						{file && (
							<div className="mt-4 text-sm text-gray-600">
								Tipo: {file.type} | Tamaño:{' '}
								{(file.size / 1024 / 1024).toFixed(2)}MB
							</div>
						)}
					</div>

					{isUploading && (
						<div className="space-y-2">
							<div className="h-2 w-full rounded-full bg-gray-200">
								<div
									className="h-full rounded-full bg-blue-500 transition-all duration-300"
									style={{ width: `${uploadProgress}%` }}
								/>
							</div>
							<p className="text-center text-sm text-gray-600">
								Subiendo... {uploadProgress}%
							</p>
						</div>
					)}

					<Button
						onClick={uploadFile}
						disabled={!file || isUploading}
						className={`w-full transition-all duration-300 ${
							isUploading
								? 'bg-gray-400'
								: file
									? 'bg-green-500 hover:bg-green-600'
									: 'bg-blue-500 hover:bg-blue-600'
						}`}
					>
						{isUploading ? (
							<>
								<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
								Subiendo...
							</>
						) : file ? (
							'Subir Documento'
						) : (
							'Seleccionar Documento'
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
