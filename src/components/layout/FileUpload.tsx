/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// components/FileUpload.tsx
import { useState } from "react";

interface FileUploadProps {
  onUploadSuccess: () => void;
  onUploadError: (message: string) => void;
  onProgress: (progress: number) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  onProgress,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      setFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      onUploadError("Please select a file to upload.");
      return;
    }

    setUploading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        },
      );

      if (response.ok) {
        const { url, fields }: { url: string; fields: Record<string, string> } =
          await response.json();

        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        xhr.upload.onprogress = (progressEvent: ProgressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percentCompleted);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            onUploadSuccess();
          } else {
            onUploadError("Upload failed.");
          }
        };

        xhr.onerror = () => {
          onUploadError("Upload failed.");
        };

        xhr.send(formData);
      } else {
        onUploadError("Failed to get pre-signed URL.");
      }
    } catch (error) {
      onUploadError("An error occurred during upload.");
    }

    setUploading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/png, image/jpeg, video/mp4"
        onChange={handleFileChange}
        className="mb-4 w-full rounded border border-gray-300 p-2"
      />
      {uploading && <progress value={0} max={100} />}
      <button
        type="submit"
        disabled={uploading}
        className="w-full rounded bg-blue-500 p-2 text-white"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
};

export default FileUpload;
