import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseImageCaptionReturn {
  caption: string | null;
  isLoading: boolean;
  generateCaption: (imageData: string) => Promise<void>;
  clearCaption: () => void;
}

export const useImageCaption = (): UseImageCaptionReturn => {
  const [caption, setCaption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateCaption = useCallback(async (imageData: string) => {
    setIsLoading(true);
    setCaption(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-caption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate caption');
      }

      const data = await response.json();
      
      if (data.caption) {
        setCaption(data.caption);
        toast({
          title: "Caption generated!",
          description: "Click 'Read Aloud' to hear the description.",
        });
      } else {
        throw new Error('No caption returned from the service');
      }
    } catch (error) {
      console.error('Error generating caption:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate caption. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCaption = useCallback(() => {
    setCaption(null);
  }, []);

  return { caption, isLoading, generateCaption, clearCaption };
};
