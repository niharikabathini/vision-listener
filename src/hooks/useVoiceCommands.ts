import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface VoiceCommandHandlers {
  onOpenCamera: () => void;
  onUploadImage: () => void;
  onCapturePhoto: () => void;
}

export const useVoiceCommands = (handlers: VoiceCommandHandlers) => {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const handlersRef = useRef(handlers);

  // Always keep handlers ref fresh
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Voice commands are not supported in this browser.", variant: "destructive" });
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
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

      const h = handlersRef.current;

      if (transcript.includes('open camera') || transcript.includes('start camera') || transcript.includes('camera')) {
        toast({ title: "🎤 Voice Command", description: "Opening camera..." });
        h.onOpenCamera();
      } else if (transcript.includes('upload') || transcript.includes('choose file') || transcript.includes('select file') || transcript.includes('upload image') || transcript.includes('upload photo')) {
        toast({ title: "🎤 Voice Command", description: "Opening file picker..." });
        h.onUploadImage();
      } else if (transcript.includes('click') || transcript.includes('take photo') || transcript.includes('capture') || transcript.includes('snap') || transcript.includes('click photo') || transcript.includes('shoot')) {
        toast({ title: "🎤 Voice Command", description: "Capturing photo..." });
        h.onCapturePhoto();
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Speech recognition error:', e.error);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      toast({ title: "🎤 Voice Commands Active", description: 'Say "open camera", "click photo", or "upload image"' });
    } catch {}
  }, []);

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
