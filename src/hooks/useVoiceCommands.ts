import { useEffect, useRef, useState, useCallback } from 'react';

interface VoiceCommandHandlers {
  onOpenCamera: () => void;
  onUploadImage: () => void;
  onCapturePhoto: () => void;
}

export const useVoiceCommands = (handlers: VoiceCommandHandlers, enabled: boolean = true) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (!last.isFinal) return;
      const transcript = last[0].transcript.trim().toLowerCase();
      setLastCommand(transcript);

      if (transcript.includes('open camera') || transcript.includes('start camera')) {
        handlers.onOpenCamera();
      } else if (transcript.includes('upload') || transcript.includes('choose file') || transcript.includes('select file')) {
        handlers.onUploadImage();
      } else if (transcript.includes('click') || transcript.includes('take photo') || transcript.includes('capture') || transcript.includes('snap')) {
        handlers.onCapturePhoto();
      }
    };

    recognition.onend = () => {
      // Restart if still supposed to be listening
      if (recognitionRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = () => {};

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {}
  }, [handlers]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setLastCommand(null);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const isSupported = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  return { isListening, lastCommand, toggleListening, isSupported };
};
