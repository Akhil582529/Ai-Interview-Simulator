import { useState, useCallback, useRef } from 'react';

type VoiceType = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface UseOpenAITTSReturn {
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  speak: (text: string) => Promise<void>;
  stop: () => void;
  setVoice: (voice: VoiceType) => void;
  setSpeed: (speed: number) => void;
  currentVoice: VoiceType;
  currentSpeed: number;
  voices: VoiceType[];
}

export const useOpenAITTS = (): UseOpenAITTSReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVoice, setCurrentVoice] = useState<VoiceType>('alloy');
  const [currentSpeed, setCurrentSpeed] = useState(1.0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Available voices
  const voices: VoiceType[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('No text provided');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Clean up old audio URL
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      // Call TTS API
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: currentVoice,
          speed: currentSpeed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      // Get audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      // Create audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event handlers
      audio.onplay = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        // Clean up
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError('Failed to play audio');
        setIsSpeaking(false);
        setIsLoading(false);
      };

      // Play audio
      await audio.play();

    } catch (err) {
      console.error('TTS error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
      setIsLoading(false);
      setIsSpeaking(false);
    }
  }, [currentVoice, currentSpeed]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsSpeaking(false);
    }

    // Clean up audio URL
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const setVoice = useCallback((voice: VoiceType) => {
    setCurrentVoice(voice);
  }, []);

  const setSpeed = useCallback((speed: number) => {
    // Speed should be between 0.25 and 4.0
    const clampedSpeed = Math.max(0.25, Math.min(4.0, speed));
    setCurrentSpeed(clampedSpeed);
  }, []);

  return {
    isSpeaking,
    isLoading,
    error,
    speak,
    stop,
    setVoice,
    setSpeed,
    currentVoice,
    currentSpeed,
    voices,
  };
};