import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { History, Save } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { ImageUploader } from '@/components/ImageUploader';
import { CaptionDisplay } from '@/components/CaptionDisplay';
import { AccessibilityInfo } from '@/components/AccessibilityInfo';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SafetyAlerts } from '@/components/SafetyAlerts';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useImageCaption } from '@/hooks/useImageCaption';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useCaptionHistory } from '@/hooks/useCaptionHistory';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();
  const { caption, translatedCaption, safetyAlerts, isLoading, generateCaption, clearCaption } = useImageCaption();
  const { addToHistory } = useCaptionHistory();

  // Voice command handlers
  const handleVoiceCapture = useCallback(() => {
    // Click the file input as a fallback
    document.getElementById('file-input')?.click();
  }, []);

  const handleVoiceDescribe = useCallback(() => {
    const textToSpeak = translatedCaption || caption;
    if (textToSpeak) {
      // Prepend safety alerts if any
      if (safetyAlerts.length > 0) {
        speak(`Warning! ${safetyAlerts.join('. ')}. ${textToSpeak}`);
      } else {
        speak(textToSpeak);
      }
    }
  }, [caption, translatedCaption, safetyAlerts, speak]);

  const handleVoiceClear = useCallback(() => {
    setCurrentImage(null);
    clearCaption();
    stop();
  }, [clearCaption, stop]);

  const handleVoiceSave = useCallback(() => {
    if (currentImage && caption) {
      addToHistory({
        imageData: currentImage,
        caption,
        translatedCaption: translatedCaption || undefined,
        language: selectedLanguage,
        safetyAlerts: safetyAlerts.length > 0 ? safetyAlerts : undefined,
      });
      toast({
        title: "Saved to History",
        description: "Caption saved successfully.",
      });
    } else {
      toast({
        title: "Nothing to save",
        description: "Generate a caption first.",
        variant: "destructive",
      });
    }
  }, [currentImage, caption, translatedCaption, selectedLanguage, safetyAlerts, addToHistory]);

  const {
    isListening,
    startListening,
    stopListening,
    isSupported: voiceCommandsSupported,
    lastCommand,
  } = useVoiceCommands({
    onCapture: handleVoiceCapture,
    onDescribeAgain: handleVoiceDescribe,
    onClear: handleVoiceClear,
    onSave: handleVoiceSave,
    onStop: stop,
  });

  const handleImageSelect = useCallback(async (imageData: string) => {
    setCurrentImage(imageData);
    stop();
    await generateCaption(imageData, selectedLanguage);
  }, [generateCaption, stop, selectedLanguage]);

  const handleClear = useCallback(() => {
    setCurrentImage(null);
    clearCaption();
    stop();
  }, [clearCaption, stop]);

  const handleSpeak = useCallback(() => {
    const textToSpeak = translatedCaption || caption;
    if (textToSpeak) {
      // Prepend safety alerts if any
      if (safetyAlerts.length > 0) {
        speak(`Warning! ${safetyAlerts.join('. ')}. ${textToSpeak}`);
      } else {
        speak(textToSpeak);
      }
    }
  }, [caption, translatedCaption, safetyAlerts, speak]);

  const handleLanguageChange = useCallback(async (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    // Re-generate caption if we already have an image
    if (currentImage && !isLoading) {
      await generateCaption(currentImage, newLanguage);
    }
  }, [currentImage, isLoading, generateCaption]);

  // Auto-read caption when generated (for screen reader users)
  useEffect(() => {
    if (caption && isSupported && !isLoading) {
      const textToSpeak = translatedCaption || caption;
      const timer = setTimeout(() => {
        // Speak safety alerts first if any
        if (safetyAlerts.length > 0) {
          speak(`Warning! ${safetyAlerts.join('. ')}. ${textToSpeak}`);
        } else {
          speak(textToSpeak);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [caption, translatedCaption, safetyAlerts, isSupported, isLoading, speak]);

  return (
    <>
      <Helmet>
        <title>See Through Sound - AI Image Captioning for Visually Impaired</title>
        <meta 
          name="description" 
          content="AI-powered image caption generator with text-to-speech, safety alerts, and multi-language support. Designed for visually impaired users." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen bg-background">
        <main 
          id="main-content" 
          className="container max-w-4xl mx-auto px-4 py-8 md:py-16"
          role="main"
        >
          {/* Header with navigation */}
          <div className="flex items-center justify-between mb-8">
            <HeroSection />
            <div className="flex items-center gap-2">
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={handleLanguageChange}
              />
              <Link to="/history">
                <Button variant="outline" size="lg" aria-label="View caption history">
                  <History className="h-5 w-5 mr-2" />
                  History
                </Button>
              </Link>
            </div>
          </div>

          <section 
            className="space-y-6"
            aria-label="Image upload and caption generation"
          >
            <ImageUploader
              onImageSelect={handleImageSelect}
              isLoading={isLoading}
              currentImage={currentImage}
              onClear={handleClear}
            />

            {/* Safety Alerts */}
            {safetyAlerts.length > 0 && !isLoading && (
              <SafetyAlerts alerts={safetyAlerts} onSpeak={speak} />
            )}

            {/* Caption Display */}
            <CaptionDisplay
              caption={translatedCaption || caption}
              isLoading={isLoading}
              isSpeaking={isSpeaking}
              onSpeak={handleSpeak}
              onStopSpeaking={stop}
            />

            {/* Save Button */}
            {caption && !isLoading && (
              <div className="flex justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleVoiceSave}
                  aria-label="Save caption to history"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save to History
                </Button>
              </div>
            )}
          </section>

          <AccessibilityInfo />

          <footer className="mt-16 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">
              Powered by AI vision technology. Designed with accessibility in mind.
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Supports {15}+ languages | Voice commands | Safety detection
            </p>
          </footer>
        </main>
      </div>

      {/* Voice Command Button */}
      <VoiceCommandButton
        isListening={isListening}
        isSupported={voiceCommandsSupported}
        onToggle={isListening ? stopListening : startListening}
        lastCommand={lastCommand}
      />
    </>
  );
};

export default Index;
