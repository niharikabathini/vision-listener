import { useState, useCallback, useEffect, useRef } from 'react';

// Language code to BCP 47 locale mapping for speech synthesis
const LANGUAGE_VOICE_MAP: Record<string, string[]> = {
  en: ['en-US', 'en-GB', 'en-AU', 'en'],
  hi: ['hi-IN', 'hi'],
  te: ['te-IN', 'te'],
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
  const [isSupported, setIsSupported] = useState(true); // Always supported with audio fallback
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices on mount and when voices change
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      console.log('Available TTS voices:', voices.map(v => `${v.name} (${v.lang})`));
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const findVoiceForLanguage = useCallback((langCode: string): SpeechSynthesisVoice | null => {
    if (availableVoices.length === 0) return null;

    const locales = LANGUAGE_VOICE_MAP[langCode] || [langCode];
    
    // Try exact match
    for (const locale of locales) {
      const exactMatch = availableVoices.find(v => v.lang === locale);
      if (exactMatch) {
        console.log(`Found exact voice for ${langCode}:`, exactMatch.name);
        return exactMatch;
      }
    }
    
    // Try partial match (e.g., 'hi' matches 'hi-IN')
    for (const locale of locales) {
      const partialMatch = availableVoices.find(v => 
        v.lang.startsWith(locale) || locale.startsWith(v.lang) ||
        v.lang.toLowerCase().includes(locale.toLowerCase())
      );
      if (partialMatch) {
        console.log(`Found partial voice for ${langCode}:`, partialMatch.name);
        return partialMatch;
      }
    }

    // Try by language name in voice name
    const langNames: Record<string, string[]> = {
      hi: ['hindi', 'हिन्दी'],
      te: ['telugu', 'తెలుగు'],
      en: ['english'],
    };
    
    const names = langNames[langCode] || [];
    for (const name of names) {
      const nameMatch = availableVoices.find(v => 
        v.name.toLowerCase().includes(name.toLowerCase())
      );
      if (nameMatch) {
        console.log(`Found voice by name for ${langCode}:`, nameMatch.name);
        return nameMatch;
      }
    }
    
    return null;
  }, [availableVoices]);

  // ResponsiveVoice (script loaded in index.html) as fallback
  const speakWithResponsiveVoice = useCallback((text: string, langCode: string): boolean => {
    const rv = (window as any).responsiveVoice;
    if (!rv || typeof rv.speak !== 'function') return false;

    // Prefer Telugu/Hindi-specific voices when available
    const candidates: Record<string, string[]> = {
      en: ['UK English Female', 'US English Female'],
      hi: ['Hindi Female', 'Hindi Male'],
      te: ['Telugu Female', 'Telugu Male'],
    };

    const candidateVoices = candidates[langCode] || candidates.en;

    try {
      if (typeof rv.voiceSupport === 'function' && !rv.voiceSupport()) {
        return false;
      }

      // If ResponsiveVoice exposes voice list, only pick names that exist.
      const rawVoices: any[] = typeof rv.getVoices === 'function' ? rv.getVoices() : [];
      const availableNames = new Set(
        rawVoices
          .map((v) => (typeof v === 'string' ? v : v?.name || v?.voice))
          .filter(Boolean)
      );

      const voiceName =
        candidateVoices.find((v) => availableNames.size === 0 || availableNames.has(v)) ||
        candidateVoices[0];

      console.log(`Using ResponsiveVoice: ${voiceName}`);
      rv.speak(text, voiceName, {
        rate: 0.9,
        onstart: () => setIsSpeaking(true),
        onend: () => setIsSpeaking(false),
        onerror: () => setIsSpeaking(false),
      });

      // Some environments expose RV but audio never starts; detect and allow fallback.
      if (typeof rv.isPlaying === 'function') {
        window.setTimeout(() => {
          try {
            if (!rv.isPlaying()) setIsSpeaking(false);
          } catch {
            // ignore
          }
        }, 350);
      } else {
        setIsSpeaking(true);
      }

      return true;
    } catch (err) {
      console.warn('ResponsiveVoice failed:', err);
      setIsSpeaking(false);
      return false;
    }
  }, []);

  const speak = useCallback((text: string, languageCode?: string) => {
    if (!text) return;

    const langToUse = languageCode || currentLanguage;
    console.log(`Speaking in ${langToUse}: "${text.slice(0, 50)}..."`);

    // Stop any ongoing speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if ((window as any).responsiveVoice) {
      (window as any).responsiveVoice.cancel?.();
    }

    const speakNative = (): boolean => {
      if (!('speechSynthesis' in window)) return false;

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      const locales = LANGUAGE_VOICE_MAP[langToUse] || [langToUse];
      utterance.lang = locales[0];

      const voice = findVoiceForLanguage(langToUse);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
        console.log(`Using native voice: ${voice.name} (${voice.lang})`);
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.error('Speech error:', e.error);
        setIsSpeaking(false);
        // Fallback for Hindi/Telugu if native fails
        if ((langToUse === 'hi' || langToUse === 'te') && (window as any).responsiveVoice) {
          speakWithResponsiveVoice(text, langToUse);
        }
      };

      window.speechSynthesis.speak(utterance);
      return true;
    };

    // IMPORTANT: Telugu is often available as a native system voice on mobile.
    // Prefer native first to avoid cases where ResponsiveVoice is present but doesn't play audio.
    if (langToUse === 'te') {
      if (speakNative()) return;
      speakWithResponsiveVoice(text, 'te');
      return;
    }

    // Hindi: prefer native when present, otherwise fallback to ResponsiveVoice.
    if (langToUse === 'hi') {
      const nativeVoice = findVoiceForLanguage('hi');
      if (nativeVoice) {
        speakNative();
        return;
      }
      if (speakWithResponsiveVoice(text, 'hi')) return;
      speakNative();
      return;
    }

    // Default: native first, then ResponsiveVoice as last resort
    if (speakNative()) return;
    speakWithResponsiveVoice(text, langToUse);
  }, [currentLanguage, findVoiceForLanguage, speakWithResponsiveVoice]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if ((window as any).responsiveVoice) {
      (window as any).responsiveVoice.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    console.log('Setting TTS language to:', lang);
    setCurrentLanguage(lang);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if ((window as any).responsiveVoice) {
        (window as any).responsiveVoice.cancel();
      }
    };
  }, []);

  return { speak, stop, isSpeaking, isSupported, currentLanguage, setLanguage, availableVoices };
};
