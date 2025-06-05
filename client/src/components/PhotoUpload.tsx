import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { compressImage, generateLocalId, offlineStorage } from '@/lib/storage';

interface Photo {
  id: string;
  url: string;
  file?: File;
  blob?: Blob;
}

interface PhotoUploadProps {
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
  className?: string;
}

export const PhotoUpload = ({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 5, 
  disabled, 
  className 
}: PhotoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    setIsUploading(true);
    const newPhotos: Photo[] = [];

    try {
      for (let i = 0; i < files.length && photos.length + newPhotos.length < maxPhotos; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          console.warn('Skipping non-image file:', file.name);
          continue;
        }

        try {
          // Compress image
          const compressedBlob = await compressImage(file, 2 * 1024 * 1024); // 2MB max
          const photoId = generateLocalId();
          
          // Save to offline storage
          await offlineStorage.savePhoto(photoId, compressedBlob);
          
          // Create URL for preview
          const url = URL.createObjectURL(compressedBlob);
          
          newPhotos.push({
            id: photoId,
            url,
            blob: compressedBlob,
          });
        } catch (error) {
          console.error('Failed to process image:', file.name, error);
        }
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
      }
    } catch (error) {
      console.error('Failed to upload photos:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
      // Revoke URL to free memory
      URL.revokeObjectURL(photo.url);
      
      // Remove from offline storage
      try {
        // Note: IndexedDB doesn't have a direct delete method for individual photos
        // In a real implementation, you'd implement this in the storage class
        console.log('Photo removed from memory');
      } catch (error) {
        console.error('Failed to remove photo from storage:', error);
      }
    }
    
    onPhotosChange(photos.filter(p => p.id !== photoId));
  };

  const openFileDialog = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photo.url}
                  alt="Uploaded photo"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Add Photo Button */}
          {canAddMore && (
            <button
              onClick={openFileDialog}
              disabled={disabled || isUploading}
              className={cn(
                'w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 transition-colors',
                {
                  'hover:border-blue-400 hover:text-blue-600': !disabled && !isUploading,
                  'opacity-50 cursor-not-allowed': disabled || isUploading,
                }
              )}
            >
              <Camera className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Initial Upload Button */}
      {photos.length === 0 && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={openFileDialog}
            disabled={disabled || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Adicionar Fotos
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Máximo {maxPhotos} fotos • 2MB por foto
          </p>
        </div>
      )}

      {/* Photo Count */}
      {photos.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {photos.length} de {maxPhotos} fotos
          {canAddMore && (
            <button
              onClick={openFileDialog}
              disabled={disabled || isUploading}
              className="ml-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              • Adicionar mais
            </button>
          )}
        </p>
      )}
    </div>
  );
};
