import { type ChangeEvent } from "react";

interface FileUploadProps {
  setFile: (file: File | null) => void;
}

export default function FileUpload({ setFile }: FileUploadProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.[0]) {
      setFile(files[0]);
    }
  };

  return (
    <input
      id="file"
      type="file"
      onChange={handleFileChange}
      accept="image/png, image/jpeg, video/mp4"
      className="mb-4 w-full rounded border border-gray-300 p-2"
    />
  );
}
