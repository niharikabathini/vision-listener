import { useState, useCallback, useEffect, useRef } from 'react';

// Language code to BCP 47 locale mapping for speech synthesis
const LANGUAGE_VOICE_MAP: Record<string, string[]> = {
  en: ['en-US', 'en-GB', 'en'],
  hi: ['hi-IN', 'hi'],
  te: ['te-IN', 'te'],
  ta: ['ta-IN', 'ta'],
  bn: ['bn-IN', 'bn'],
  mr: ['mr-IN', 'mr'],
  gu: ['gu-IN', 'gu'],
  kn: ['kn-IN', 'kn'],
  ml: ['ml-IN', 'ml'],
  pa: ['pa-IN', 'pa'],
  es: ['es-ES', 'es-MX', 'es'],
  fr: ['fr-FR', 'fr'],
  de: ['de-DE', 'de'],
  zh: ['zh-CN', 'zh-TW', 'zh'],
  ar: ['ar-SA', 'ar'],
};

interface UseTextToSpeechReturn {
  speak: (text: string, languageCode?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  currentLanguage: string;
  setLanguage: (lang: string) => void;
}

export const useTextToSpeech = (initialLanguage: string = 'en'): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const findVoiceForLanguage = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    const locales = LANGUAGE_VOICE_MAP[langCode] || [langCode];
    
    // Try to find a voice matching any of the locales
    for (const locale of locales) {
      const voice = voices.find(v => v.lang.startsWith(locale));
      if (voice) return voice;
    }
    
    // Fallback: find any voice that starts with the language code
    const fallbackVoice = voices.find(v => v.lang.startsWith(langCode));
    if (fallbackVoice) return fallbackVoice;
    
    // Final fallback: use default English voice
    return voices.find(v => v.lang.startsWith('en')) || null;
  }, []);

  const speak = useCallback((text: string, languageCode?: string) => {
    if (!isSupported || !text) return;

    const langToUse = languageCode || currentLanguage;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure speech settings for accessibility
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set the language
    const locales = LANGUAGE_VOICE_MAP[langToUse] || [langToUse];
    utterance.lang = locales[0];

    // Wait for voices to load if needed
    const setVoice = () => {
      const voice = findVoiceForLanguage(langToUse);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
    };

    // Voices might not be loaded immediately
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, currentLanguage, findVoiceForLanguage]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const setLanguage = useCallback((lang: string) => {
    setCurrentLanguage(lang);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported, currentLanguage, setLanguage };
};
