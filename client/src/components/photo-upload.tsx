import { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export function PhotoUpload({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 5, 
  disabled = false 
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const newPhotos: string[] = [];

      for (let i = 0; i < files.length && photos.length + newPhotos.length < maxPhotos; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // Compress image if needed
        const compressedFile = await compressImage(file);
        
        // Convert to base64 for storage
        const base64 = await fileToBase64(compressedFile);
        newPhotos.push(base64);
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={photo} 
              alt={`Photo ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={openFileDialog}
            disabled={disabled || isUploading}
            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="text-xs text-gray-500">
        {photos.length}/{maxPhotos} fotos • Máximo 2MB por foto
      </div>
    </div>
  );
}

// Helper functions
async function compressImage(file: File, maxSize: number = 2 * 1024 * 1024): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions (max 1920x1080)
      let { width, height } = img;
      const maxWidth = 1920;
      const maxHeight = 1080;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        0.85 // Quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
