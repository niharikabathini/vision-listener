import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface CaptionResult {
  caption: string;
  translatedCaption: string | null;
  safetyAlerts: string[];
  language: string;
}

interface UseImageCaptionReturn {
  caption: string | null;
  translatedCaption: string | null;
  safetyAlerts: string[];
  isLoading: boolean;
  generateCaption: (imageData: string, language?: string) => Promise<void>;
  clearCaption: () => void;
}

export const useImageCaption = (): UseImageCaptionReturn => {
  const [caption, setCaption] = useState<string | null>(null);
  const [translatedCaption, setTranslatedCaption] = useState<string | null>(null);
  const [safetyAlerts, setSafetyAlerts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateCaption = useCallback(async (imageData: string, language: string = 'en') => {
    setIsLoading(true);
    setCaption(null);
    setTranslatedCaption(null);
    setSafetyAlerts([]);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-caption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageData, language }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate caption');
      }

      const data: CaptionResult = await response.json();
      
      if (data.caption) {
        setCaption(data.caption);
        setTranslatedCaption(data.translatedCaption);
        setSafetyAlerts(data.safetyAlerts || []);
        
        // Show safety alerts prominently if any
        if (data.safetyAlerts && data.safetyAlerts.length > 0) {
          toast({
            title: "⚠️ Safety Alert",
            description: data.safetyAlerts[0],
            variant: "destructive",
          });
        } else {
          toast({
            title: "Caption generated!",
            description: "Click 'Read Aloud' to hear the description.",
          });
        }
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
    setTranslatedCaption(null);
    setSafetyAlerts([]);
  }, []);

  return { caption, translatedCaption, safetyAlerts, isLoading, generateCaption, clearCaption };
};
