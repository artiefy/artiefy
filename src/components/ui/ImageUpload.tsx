'use client'

import { useState } from 'react'
import { Input } from "~/components/ui/input"
import Image from 'next/image'

type ImageUploadProps = {
  onImageUpload: (file: File) => void;
  initialImage?: string;
}

export function ImageUpload({ onImageUpload, initialImage }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialImage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="bg-background text-foreground border-input"
      />
      {previewUrl && (
        <div className="relative w-full h-48">
          <Image
            src={previewUrl}
            alt="Vista previa de la imagen"
            fill
            style={{ objectFit: 'contain' }}
            className="rounded-md"
          />
        </div>
      )}
    </div>
  )
}

