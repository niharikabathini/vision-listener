import React from 'react';
import { Eye, Mic, Brain, Heart } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <header className="text-center mb-12 md:mb-16 animate-fade-in">
      {/* Logo/Icon */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-primary/20 flex items-center justify-center glow-primary-soft">
            <Eye className="w-10 h-10 md:w-12 md:h-12 text-primary" aria-hidden="true" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-success flex items-center justify-center">
            <Mic className="w-4 h-4 text-success-foreground" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
        <span className="text-gradient-primary">See Through Sound</span>
      </h1>
      
      {/* Subtitle */}
      <p className="text-accessible-lg text-muted-foreground max-w-2xl mx-auto mb-8">
        Upload any image and hear a detailed description read aloud. 
        Designed for visually impaired users to understand the world through AI-powered captions.
      </p>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3" role="list" aria-label="Key features">
        <FeaturePill icon={<Brain className="w-4 h-4" />} label="AI-Powered" />
        <FeaturePill icon={<Mic className="w-4 h-4" />} label="Voice Output" />
        <FeaturePill icon={<Heart className="w-4 h-4" />} label="Accessible" />
      </div>
    </header>
  );
};

const FeaturePill: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div 
    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
    role="listitem"
  >
    <span className="text-primary" aria-hidden="true">{icon}</span>
    {label}
  </div>
);
