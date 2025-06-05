import { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon, Compress } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number;
  className?: string;
}

export function PhotoUploader({ 
  photos, 
  onChange, 
  maxPhotos = 3, 
  maxSizeMB = 2,
  className 
}: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = (file: File, maxSizeMB: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions to maintain aspect ratio
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Start with high quality and reduce if needed
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until file size is acceptable
        while (dataUrl.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.1) { // 1.37 is base64 overhead
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxPhotos} fotos permitidas`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const newPhotos: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Arquivo inválido",
            description: "Apenas imagens são permitidas",
            variant: "destructive",
          });
          continue;
        }

        // Compress and convert image
        try {
          const compressedImage = await compressImage(file, maxSizeMB);
          newPhotos.push(compressedImage);
        } catch (error) {
          console.error('Error compressing image:', error);
          toast({
            title: "Erro ao processar imagem",
            description: `Erro ao processar ${file.name}`,
            variant: "destructive",
          });
        }
      }

      onChange([...photos, ...newPhotos]);
      
      if (newPhotos.length > 0) {
        toast({
          title: "Fotos adicionadas",
          description: `${newPhotos.length} foto(s) adicionada(s) e comprimida(s)`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Erro ao processar as fotos",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
    toast({
      title: "Foto removida",
      description: "Foto removida com sucesso",
    });
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const openGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Upload Buttons */}
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={openCamera}
          disabled={isUploading || photos.length >= maxPhotos}
          className="flex-1 h-12"
        >
          <Camera className="w-5 h-5 mr-2" />
          Câmera
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={openGallery}
          disabled={isUploading || photos.length >= maxPhotos}
          className="flex-1 h-12"
        >
          <Upload className="w-5 h-5 mr-2" />
          Galeria
        </Button>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square group">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border shadow-sm"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg" />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600 mb-2">Nenhuma foto adicionada</p>
          <p className="text-xs text-gray-500">
            Máximo de {maxPhotos} fotos, {maxSizeMB}MB cada
          </p>
          <p className="text-xs text-gray-500 mt-1">
            <Compress className="w-3 h-3 inline mr-1" />
            Fotos são automaticamente comprimidas
          </p>
        </div>
      )}

      {/* Loading State */}
      {isUploading && (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-600 mt-3">Processando e comprimindo fotos...</p>
        </div>
      )}

      {/* Photo Count and Info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{photos.length}/{maxPhotos} fotos</span>
        {photos.length > 0 && (
          <span className="flex items-center">
            <Compress className="w-3 h-3 mr-1" />
            Comprimidas automaticamente
          </span>
        )}
      </div>
    </div>
  );
}
