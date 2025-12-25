import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseVoiceCommandsProps {
  onCapture: () => void;
  onDescribeAgain: () => void;
  onClear: () => void;
  onSave: () => void;
  onStop: () => void;
}

interface UseVoiceCommandsReturn {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  lastCommand: string | null;
}

export const useVoiceCommands = ({
  onCapture,
  onDescribeAgain,
  onClear,
  onSave,
  onStop,
}: UseVoiceCommandsProps): UseVoiceCommandsReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.toLowerCase().trim();
        console.log('Voice command:', transcript);
        setLastCommand(transcript);
        processCommand(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone access denied",
            description: "Please allow microphone access for voice commands.",
            variant: "destructive",
          });
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening) {
          // Restart if still supposed to be listening
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const processCommand = useCallback((transcript: string) => {
    // Capture commands
    if (
      transcript.includes('capture') ||
      transcript.includes('take photo') ||
      transcript.includes('take picture') ||
      transcript.includes('snap') ||
      transcript.includes('click')
    ) {
      toast({ title: "Voice Command", description: "Capturing image..." });
      onCapture();
      return;
    }

    // Describe again commands
    if (
      transcript.includes('describe again') ||
      transcript.includes('repeat') ||
      transcript.includes('say again') ||
      transcript.includes('read again') ||
      transcript.includes('describe')
    ) {
      toast({ title: "Voice Command", description: "Reading description..." });
      onDescribeAgain();
      return;
    }

    // Clear commands
    if (
      transcript.includes('clear') ||
      transcript.includes('new image') ||
      transcript.includes('remove') ||
      transcript.includes('reset')
    ) {
      toast({ title: "Voice Command", description: "Clearing image..." });
      onClear();
      return;
    }

    // Save commands
    if (
      transcript.includes('save') ||
      transcript.includes('store') ||
      transcript.includes('keep')
    ) {
      toast({ title: "Voice Command", description: "Saving to history..." });
      onSave();
      return;
    }

    // Stop commands
    if (
      transcript.includes('stop') ||
      transcript.includes('quiet') ||
      transcript.includes('silence') ||
      transcript.includes('shut up')
    ) {
      toast({ title: "Voice Command", description: "Stopping speech..." });
      onStop();
      return;
    }
  }, [onCapture, onDescribeAgain, onClear, onSave, onStop]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "Voice Commands Active",
        description: "Say 'capture', 'describe', 'save', 'clear', or 'stop'",
      });
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsListening(false);
    toast({
      title: "Voice Commands Stopped",
      description: "Voice recognition turned off",
    });
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    isSupported,
    lastCommand,
  };
};

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
