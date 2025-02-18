'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Input } from '~/components/admin/ui/input';

interface ImageUploadProps {
  onImageUploadAction: (file: File) => void;
  initialImage?: string;
}

interface ImageUploadProps {

  onImageUpload: (file: File) => void;

  // other props

}


export function ImageUpload({ onImageUploadAction, initialImage }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    initialImage
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageUploadAction(file);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border-input bg-background text-foreground"
      />
      {previewUrl && (
        <div className="relative h-48 w-full">
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
  );
}
