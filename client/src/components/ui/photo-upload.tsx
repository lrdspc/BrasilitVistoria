import { useState, useRef } from 'react';
import { Camera, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  className?: string;
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5, className }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (photos.length + files.length > maxPhotos) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxPhotos} fotos permitidas.`,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const newPhotoUrls: string[] = [];
      
      for (const file of files) {
        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede 2MB.`,
            variant: "destructive"
          });
          continue;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Tipo inválido",
            description: `${file.name} não é uma imagem.`,
            variant: "destructive"
          });
          continue;
        }

        // Compress and upload
        const compressedFile = await compressImage(file);
        const photoUrl = await uploadPhoto(compressedFile);
        newPhotoUrls.push(photoUrl);
      }
      
      onPhotosChange([...photos, ...newPhotoUrls]);
      
      if (newPhotoUrls.length > 0) {
        toast({
          title: "Fotos adicionadas",
          description: `${newPhotoUrls.length} foto(s) carregada(s) com sucesso.`,
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível carregar as fotos.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1200px width)
        const maxWidth = 1200;
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch('/api/photos/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const result = await response.json();
    return result.url;
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {photos.map((photoUrl, index) => (
          <div key={index} className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={photoUrl} 
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
              onClick={() => removePhoto(index)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
        
        {photos.length < maxPhotos && (
          <Button
            type="button"
            variant="outline"
            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-600 hover:text-blue-600"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <p className="text-xs text-gray-500">
        {photos.length}/{maxPhotos} fotos • Máximo 2MB por foto
      </p>
    </div>
  );
}
