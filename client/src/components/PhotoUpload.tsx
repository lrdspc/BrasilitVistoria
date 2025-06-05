import { useState, useRef } from "react";
import { Camera, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  required?: boolean;
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5, required = false }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      alert(`Máximo de ${maxPhotos} fotos permitidas`);
      return;
    }

    setUploading(true);

    try {
      const newPhotos: string[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert("Apenas arquivos de imagem são permitidos");
          continue;
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
          alert("Tamanho máximo de 2MB por foto");
          continue;
        }

        // Compress and convert to base64
        const compressedFile = await compressImage(file);
        const base64 = await fileToBase64(compressedFile);
        newPhotos.push(base64);
      }

      onPhotosChange([...photos, ...newPhotos]);
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Erro ao fazer upload das fotos");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 800px)
        const maxSize = 800;
        let { width, height } = img;

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.8
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Fotos {required && <span className="text-red-500">*</span>} (mín. 1, máx. {maxPhotos})
      </label>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {photos.map((photo, index) => (
          <div key={index} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
            <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(index)}
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
