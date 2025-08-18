import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Camera, FolderOpen, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/imageCompression";

interface ImageUploadProps {
  onImageUploaded: (imagePath: string) => void;
  images: string[];
  onRemoveImage: (index: number) => void;
}

export default function ImageUpload({ onImageUploaded, images, onRemoveImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Compress image
        const compressedFile = await compressImage(file);
        
        // Upload to server
        const formData = new FormData();
        formData.append('image', compressedFile);
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        onImageUploaded(result.path);
      }

      toast({
        title: "Başarılı",
        description: "Fotoğraflar başarıyla yüklendi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Fotoğraf yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGallerySelect = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        data-testid="image-upload-area"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <CloudUpload className="text-4xl text-gray-400" size={48} />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">Fotoğraf Ekle</p>
            <p className="text-sm text-gray-500">Dosyaları sürükleyip bırakın veya seçin</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              type="button"
              onClick={handleGallerySelect}
              disabled={isUploading}
              data-testid="button-gallery-select"
            >
              <FolderOpen className="mr-2" size={16} />
              Galeriden Seç
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCameraCapture}
              disabled={isUploading}
              data-testid="button-camera-capture"
            >
              <Camera className="mr-2" size={16} />
              Fotoğraf Çek
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Uploaded Images Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-testid="uploaded-images">
          {images.map((imagePath, index) => (
            <div key={index} className="relative group">
              <img
                src={imagePath}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                className="absolute top-2 right-2 bg-danger text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveImage(index)}
                data-testid={`button-remove-image-${index}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
