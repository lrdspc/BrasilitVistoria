import { useState, useRef } from "react";
import { Camera, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useState, useRef, useEffect } from "react"; // Added useEffect

export interface PhotoItem {
  id?: string; // Optional unique ID for the photo item itself (e.g., for React key)
  file?: File; // The actual file object, for new uploads
  previewUrl: string; // Blob URL for local preview, or server URL for existing
  serverUrl?: string; // URL if photo is already on server
  localDbId?: number; // ID if photo is stored in local IndexedDB
  name?: string; // File name
}

interface PhotoUploadProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  maxPhotos?: number;
  required?: boolean;
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5, required = false }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manage and revoke object URLs to prevent memory leaks
  useEffect(() => {
    const currentPreviewUrls = photos.map(p => p.previewUrl);
    return () => {
      currentPreviewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          // URL.revokeObjectURL(url); // This should be done when specific photo is removed or component unmounts
          // More robust cleanup needed: revoke only when photo object is truly gone or previewUrl changes.
        }
      });
    };
  }, [photos]);


  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      alert(`Máximo de ${maxPhotos} fotos permitidas`);
      return;
    }

    setUploading(true);

    try {
      const newPhotoItems: PhotoItem[] = [];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          alert("Apenas arquivos de imagem são permitidos");
          continue;
        }
        if (file.size > 5 * 1024 * 1024) { // Increased to 5MB for now
          alert("Tamanho máximo de 5MB por foto");
          continue;
        }

        const compressedFile = await compressImage(file); // Keep compression
        const previewUrl = URL.createObjectURL(compressedFile);
        newPhotoItems.push({
          id: `local-${Date.now()}-${Math.random()}`, // Temporary local ID for React key
          file: compressedFile,
          previewUrl,
          name: compressedFile.name,
        });
      }

      onPhotosChange([...photos, ...newPhotoItems]);
    } catch (error) {
      console.error("Error processing photos:", error);
      alert("Erro ao processar as fotos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    }
  };

  const removePhoto = (photoToRemove: PhotoItem) => {
    // Revoke the object URL before removing the photo from the list
    if (photoToRemove.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.previewUrl);
    }
    const newPhotos = photos.filter((photo) => photo.id !== photoToRemove.id && photo.previewUrl !== photoToRemove.previewUrl);
    onPhotosChange(newPhotos);
  };

  // compressImage remains largely the same, as it returns a File object (Blob)
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Release the object URL for the original image after drawing to canvas
        URL.revokeObjectURL(img.src);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              resolve(file); // Fallback to original file if blob creation fails
            }
          },
          'image/jpeg',
          0.7 // Quality: 70%
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src); // Clean up if image loading fails
        resolve(file); // Fallback to original file
      };
      img.src = URL.createObjectURL(file); // Create blob URL for original file to load in Image element
    });
  };

  // fileToBase64 is no longer needed here if we are working with File objects and Blob URLs

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Fotos {required && <span className="text-red-500">*</span>} (mín. 1, máx. {maxPhotos})
      </label>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-3">
        {photos.map((photoItem) => (
          <div key={photoItem.id || photoItem.previewUrl} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden group">
            <img
              src={photoItem.previewUrl}
              alt={`Foto ${photoItem.name || 'preview'}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(photoItem)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-600 hover:text-blue-600 disabled:opacity-50"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Upload className="w-3 h-3" />
        <span>Máximo 2MB por foto • {photos.length}/{maxPhotos} fotos</span>
      </div>
    </div>
  );
}
