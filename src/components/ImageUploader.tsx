import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageSelect: (imageData: string) => void;
  isLoading?: boolean;
  currentImage?: string | null;
  onClear?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  isLoading = false,
  currentImage,
  onClear,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }, []);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (currentImage) {
    return (
      <div className="relative animate-scale-in">
        <div className="relative rounded-2xl overflow-hidden border-2 border-border bg-card">
          <img
            src={currentImage}
            alt="Uploaded image for caption generation"
            className="w-full h-auto max-h-[400px] object-contain"
          />
          {onClear && !isLoading && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onClear}
              className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background"
              aria-label="Remove image and upload a new one"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "upload-zone p-8 md:p-12 text-center cursor-pointer transition-all duration-300",
        isDragOver && "drag-over"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Image upload area. Click or drag and drop an image here."
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          document.getElementById('file-input')?.click();
        }
      }}
    >
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />
      
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          {isDragOver ? (
            <ImageIcon className="w-10 h-10 text-primary" aria-hidden="true" />
          ) : (
            <Upload className="w-10 h-10 text-primary" aria-hidden="true" />
          )}
        </div>
        
        <div className="space-y-2">
          <p className="text-accessible-lg font-semibold text-foreground">
            {isDragOver ? 'Drop your image here' : 'Drag & drop an image'}
          </p>
          <p className="text-muted-foreground">
            or click the button below to browse
          </p>
        </div>
        
        <Button
          variant="hero"
          size="lg"
          onClick={() => document.getElementById('file-input')?.click()}
          className="mt-2"
        >
          <Upload className="mr-2" aria-hidden="true" />
          Choose Image
        </Button>
        
        <p className="text-sm text-muted-foreground">
          Supports JPG, PNG, GIF, WebP
        </p>
      </div>
    </div>
  );
};
