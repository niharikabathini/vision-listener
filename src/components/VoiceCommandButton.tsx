import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceCommandButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
  lastCommand?: string | null;
}

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({
  isListening,
  isSupported,
  onToggle,
  lastCommand,
}) => {
  if (!isSupported) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {isListening && lastCommand && (
        <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground animate-fade-in">
          Last: "{lastCommand}"
        </div>
      )}
      
      <Button
        variant={isListening ? "speaking" : "secondary"}
        size="lg"
        onClick={onToggle}
        className={cn(
          "rounded-full w-16 h-16 shadow-lg",
          isListening && "animate-pulse"
        )}
        aria-label={isListening ? "Stop voice commands" : "Start voice commands"}
        aria-pressed={isListening}
      >
        {isListening ? (
          <div className="relative">
            <Mic className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
          </div>
        ) : (
          <MicOff className="h-6 w-6" />
        )}
      </Button>
      
      {isListening && (
        <p className="text-xs text-muted-foreground text-center max-w-[150px]">
          Listening... Say "capture", "describe", "save", "clear", or "stop"
        </p>
      )}
    </div>
  );
};
