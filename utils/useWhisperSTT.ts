import { useState, useCallback, useRef } from 'react';

interface UseWhisperSTTReturn {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetTranscript: () => void;
  recordingDuration: number;
}

export const useWhisperSTT = (): UseWhisperSTTReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      audioChunksRef.current = [];
      setRecordingDuration(0);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // Mono audio
          sampleRate: 16000, // Good quality for speech
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm', // Whisper supports various formats
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        // Stop duration counter
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        try {
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: 'audio/webm' 
          });

          // Send to Whisper API
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/api/whisper-transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Transcription failed');
          }

          const data = await response.json();
          setTranscript(data.text);
        } catch (err) {
          console.error('Transcription error:', err);
          setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
        } finally {
          setIsProcessing(false);
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else {
        setError('Failed to access microphone. Please check your device.');
      }
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isRecording,
    isProcessing,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    recordingDuration,
  };
};