import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Volume2, Clock, AlertTriangle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCaptionHistory, HistoryItem } from '@/hooks/useCaptionHistory';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { toast } from '@/hooks/use-toast';

const History = () => {
  const { history, removeFromHistory, clearHistory } = useCaptionHistory();
  const { speak, stop, isSpeaking } = useTextToSpeech();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const handleSpeak = (caption: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(caption);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      clearHistory();
      toast({
        title: "History Cleared",
        description: "All saved captions have been removed.",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Helmet>
        <title>Caption History - See Through Sound</title>
        <meta name="description" content="View your saved image captions and descriptions." />
      </Helmet>

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen bg-background">
        <main id="main-content" className="container max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" aria-label="Go back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Caption History
                </h1>
                <p className="text-muted-foreground">
                  {history.length} saved {history.length === 1 ? 'caption' : 'captions'}
                </p>
              </div>
            </div>
            
            {history.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                aria-label="Clear all history"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </header>

          {/* History List */}
          {history.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No History Yet</h2>
              <p className="text-muted-foreground mb-6">
                Captions you save will appear here for easy access.
              </p>
              <Link to="/">
                <Button variant="hero" size="lg">
                  Generate Your First Caption
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((item) => (
                <article
                  key={item.id}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                  role="article"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.imageData}
                        alt="Saved image thumbnail"
                        className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <time className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(item.timestamp)}
                        </time>
                        
                        {item.language && item.language !== 'en' && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {item.language.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Safety Alerts */}
                      {item.safetyAlerts && item.safetyAlerts.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {item.safetyAlerts.map((alert, i) => (
                            <span
                              key={i}
                              className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full flex items-center gap-1"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {alert}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-foreground text-sm md:text-base line-clamp-3 mb-3">
                        {item.translatedCaption || item.caption}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSpeak(item.translatedCaption || item.caption)}
                          aria-label="Read caption aloud"
                        >
                          <Volume2 className="h-4 w-4 mr-1" />
                          {isSpeaking ? 'Stop' : 'Read'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromHistory(item.id)}
                          aria-label="Delete this caption"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default History;
