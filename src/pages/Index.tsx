import React, { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { HeroSection } from '@/components/HeroSection';
import { ImageUploader } from '@/components/ImageUploader';
import { CaptionDisplay } from '@/components/CaptionDisplay';
import { AccessibilityInfo } from '@/components/AccessibilityInfo';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useImageCaption } from '@/hooks/useImageCaption';

const Index = () => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();
  const { caption, isLoading, generateCaption, clearCaption } = useImageCaption();

  const handleImageSelect = useCallback(async (imageData: string) => {
    setCurrentImage(imageData);
    stop(); // Stop any ongoing speech
    await generateCaption(imageData);
  }, [generateCaption, stop]);

  const handleClear = useCallback(() => {
    setCurrentImage(null);
    clearCaption();
    stop();
  }, [clearCaption, stop]);

  const handleSpeak = useCallback(() => {
    if (caption) {
      speak(caption);
    }
  }, [caption, speak]);

  // Auto-read caption when generated (for screen reader users)
  useEffect(() => {
    if (caption && isSupported) {
      // Small delay to let the UI update first
      const timer = setTimeout(() => {
        speak(caption);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [caption, isSupported, speak]);

  return (
    <>
      <Helmet>
        <title>See Through Sound - Image Caption Generator for Accessibility</title>
        <meta 
          name="description" 
          content="AI-powered image caption generator with text-to-speech. Upload any image and hear a detailed description read aloud. Designed for visually impaired users." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen bg-background">
        <main 
          id="main-content" 
          className="container max-w-4xl mx-auto px-4 py-8 md:py-16"
          role="main"
        >
          <HeroSection />

          <section 
            className="space-y-8"
            aria-label="Image upload and caption generation"
          >
            <ImageUploader
              onImageSelect={handleImageSelect}
              isLoading={isLoading}
              currentImage={currentImage}
              onClear={handleClear}
            />

            <CaptionDisplay
              caption={caption}
              isLoading={isLoading}
              isSpeaking={isSpeaking}
              onSpeak={handleSpeak}
              onStopSpeaking={stop}
            />
          </section>

          <AccessibilityInfo />

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">
              Powered by AI vision technology. Designed with accessibility in mind.
            </p>
          </footer>
        </main>
      </div>
    </>
  );
};

export default Index;
