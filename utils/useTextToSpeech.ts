import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseTextToSpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  autoPlay?: boolean;
}

export const useTextToSpeech = (options: UseTextToSpeechOptions = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  // Cleanup function to revoke object URLs
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleEnded);
      audioRef.current.removeEventListener('error', handleError);
      audioRef.current = null;
    }
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    cleanup();
    options.onEnd?.();
  }, [cleanup, options]);

  const handleError = useCallback(() => {
    const err = new Error('Failed to play audio');
    setIsPlaying(false);
    setIsLoading(false);
    setError(err.message);
    cleanup();
    options.onError?.(err);
  }, [cleanup, options]);

  const speak = useCallback(async (text: string, voiceId?: string) => {
    if (!text || text.trim().length === 0) {
      console.warn('No text provided to speak');
      return;
    }

    try {
      // Stop any currently playing audio
      cleanup();
      
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);

      console.log('Requesting TTS for:', text.substring(0, 50) + '...');

      // Call API to generate speech
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate speech' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      console.log('Audio blob received, size:', audioBlob.size, 'bytes');
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio data');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      currentAudioUrlRef.current = audioUrl;

      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      audio.addEventListener('canplaythrough', () => {
        console.log('Audio ready to play');
      });

      audio.addEventListener('loadeddata', () => {
        console.log('Audio data loaded');
      });

      // Try to play
      console.log('Attempting to play audio...');
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playback started successfully');
            setIsPlaying(true);
            setIsLoading(false);
            options.onStart?.();
          })
          .catch((err) => {
            console.error('Play error:', err);
            throw new Error(`Playback failed: ${err.message}`);
          });
      }

    } catch (err) {
      console.error('TTS Error:', err);
      setIsLoading(false);
      setIsPlaying(false);
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error.message);
      cleanup();
      options.onError?.(error);
    }
  }, [cleanup, handleEnded, handleError, options]);

  const stop = useCallback(() => {
    console.log('Stopping audio...');
    cleanup();
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  }, [cleanup]);

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      console.log('Pausing audio...');
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (audioRef.current && !isPlaying) {
      console.log('Resuming audio...');
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Resume error:', err);
          const error = new Error(`Failed to resume: ${err.message}`);
          setError(error.message);
          options.onError?.(error);
        });
    }
  }, [isPlaying, options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    speak,
    stop,
    pause,
    resume,
    isPlaying,
    isLoading,
    error,
  };
};