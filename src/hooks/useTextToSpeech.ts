import { useState, useCallback, useEffect, useRef } from 'react';

// Language code to BCP 47 locale mapping for speech synthesis
const LANGUAGE_VOICE_MAP: Record<string, string[]> = {
  en: ['en-US', 'en-GB', 'en-AU', 'en'],
  hi: ['hi-IN', 'hi'],
  te: ['te-IN', 'te'],
  ta: ['ta-IN', 'ta'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  mr: ['mr-IN', 'mr'],
  gu: ['gu-IN', 'gu'],
  kn: ['kn-IN', 'kn'],
  ml: ['ml-IN', 'ml'],
  pa: ['pa-IN', 'pa'],
  es: ['es-ES', 'es-MX', 'es-US', 'es'],
  fr: ['fr-FR', 'fr-CA', 'fr'],
  de: ['de-DE', 'de-AT', 'de'],
  zh: ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
  ar: ['ar-SA', 'ar-EG', 'ar'],
  ja: ['ja-JP', 'ja'],
  ko: ['ko-KR', 'ko'],
  pt: ['pt-BR', 'pt-PT', 'pt'],
  ru: ['ru-RU', 'ru'],
  it: ['it-IT', 'it'],
};

interface UseTextToSpeechReturn {
  speak: (text: string, languageCode?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  availableVoices: SpeechSynthesisVoice[];
}

export const useTextToSpeech = (initialLanguage: string = 'en'): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices on mount and when voices change
  useEffect(() => {
    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);
    
    if (!supported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      console.log('Available TTS voices:', voices.map(v => `${v.name} (${v.lang})`));
    };

    // Load voices immediately if available
    loadVoices();
    
    // Also listen for voices changed event (needed for some browsers)
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const findVoiceForLanguage = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    if (availableVoices.length === 0) {
      return null;
    }

    const locales = LANGUAGE_VOICE_MAP[langCode] || [langCode];
    
    // Try to find a voice matching any of the locales exactly
    for (const locale of locales) {
      const exactMatch = availableVoices.find(v => v.lang === locale);
      if (exactMatch) {
        console.log(`Found exact voice match for ${langCode}:`, exactMatch.name, exactMatch.lang);
        return exactMatch;
      }
    }
    
    // Try partial match (e.g., 'hi' matches 'hi-IN')
    for (const locale of locales) {
      const partialMatch = availableVoices.find(v => v.lang.startsWith(locale) || locale.startsWith(v.lang));
      if (partialMatch) {
        console.log(`Found partial voice match for ${langCode}:`, partialMatch.name, partialMatch.lang);
        return partialMatch;
      }
    }
    
    // Try matching just the language code part
    const langOnly = langCode.split('-')[0];
    const langMatch = availableVoices.find(v => v.lang.split('-')[0] === langOnly);
    if (langMatch) {
      console.log(`Found language-only match for ${langCode}:`, langMatch.name, langMatch.lang);
      return langMatch;
    }
    
    console.log(`No voice found for ${langCode}, using default`);
    // Return null - will use browser default
    return null;
  }, [availableVoices]);

  const speak = useCallback((text: string, languageCode?: string) => {
    if (!isSupported || !text) {
      console.log('TTS not supported or no text');
      return;
    }

    const langToUse = languageCode || currentLanguage;
    console.log(`Speaking in language: ${langToUse}, text length: ${text.length}`);

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Configure speech settings for accessibility
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set the language code on the utterance
    const locales = LANGUAGE_VOICE_MAP[langToUse] || [langToUse];
    utterance.lang = locales[0];

    // Find and set the appropriate voice
    const voice = findVoiceForLanguage(langToUse);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
      console.log(`Using voice: ${voice.name} (${voice.lang})`);
    } else {
      console.log(`No specific voice found, using browser default with lang: ${utterance.lang}`);
    }

    utterance.onstart = () => {
      console.log('Speech started');
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      console.log('Speech ended');
      setIsSpeaking(false);
    };
    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, currentLanguage, findVoiceForLanguage]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const setLanguage = useCallback((lang: string) => {
    console.log('Setting TTS language to:', lang);
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

  return { speak, stop, isSpeaking, isSupported, currentLanguage, setLanguage, availableVoices };
};
