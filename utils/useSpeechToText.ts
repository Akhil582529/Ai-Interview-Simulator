// import { useState, useEffect, useCallback, useRef } from 'react';

// interface UseSpeechToTextReturn {
//   isRecording: boolean;
//   isProcessing: boolean;
//   transcript: string;
//   error: string | null;
//   startRecording: () => Promise<void>;
//   stopRecording: () => Promise<void>;
//   resetTranscript: () => void;
//   isSupported: boolean;
// }

// export const useSpeechToText = (): UseSpeechToTextReturn => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [transcript, setTranscript] = useState('');
//   const [error, setError] = useState<string | null>(null);
//   const [isSupported, setIsSupported] = useState(false);
  
//   const recognitionRef = useRef<SpeechRecognition | null>(null);
//   const finalTranscriptRef = useRef<string>('');

//   useEffect(() => {
//     // Check if browser supports Speech Recognition
//     const SpeechRecognition = 
//       (window as any).SpeechRecognition || 
//       (window as any).webkitSpeechRecognition;
    
//     if (SpeechRecognition) {
//       setIsSupported(true);
      
//       // Initialize speech recognition
//       const recognition = new SpeechRecognition();
//       recognition.continuous = true; // Keep listening
//       recognition.interimResults = true; // Get results as you speak
//       recognition.lang = 'en-US'; // Set language
//       recognition.maxAlternatives = 1;

//       // Handle results
//       recognition.onresult = (event: SpeechRecognitionEvent) => {
//         let interimTranscript = '';
//         let finalTranscript = '';

//         for (let i = event.resultIndex; i < event.results.length; i++) {
//           const transcript = event.results[i][0].transcript;
//           if (event.results[i].isFinal) {
//             finalTranscript += transcript + ' ';
//           } else {
//             interimTranscript += transcript;
//           }
//         }

//         if (finalTranscript) {
//           finalTranscriptRef.current += finalTranscript;
//           setTranscript(finalTranscriptRef.current.trim());
//         }
//       };

//       // Handle errors
//       recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
//         console.error('Speech recognition error:', event.error);
        
//         switch (event.error) {
//           case 'no-speech':
//             setError('No speech detected. Please try again.');
//             break;
//           case 'audio-capture':
//             setError('Microphone not found. Please check your device.');
//             break;
//           case 'not-allowed':
//             setError('Microphone permission denied. Please allow microphone access.');
//             break;
//           case 'network':
//             setError('Network error. Please check your connection.');
//             break;
//           default:
//             setError(`Speech recognition error: ${event.error}`);
//         }
        
//         setIsRecording(false);
//         setIsProcessing(false);
//       };

//       // Handle end
//       recognition.onend = () => {
//         setIsRecording(false);
//         setIsProcessing(false);
//       };

//       // Handle start
//       recognition.onstart = () => {
//         setIsRecording(true);
//         setIsProcessing(false);
//         setError(null);
//       };

//       recognitionRef.current = recognition;
//     } else {
//       setIsSupported(false);
//       setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
//     }

//     // Cleanup
//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.abort();
//       }
//     };
//   }, []);

//   const startRecording = useCallback(async () => {
//     if (!isSupported) {
//       setError('Speech recognition is not supported in your browser.');
//       return;
//     }

//     try {
//       setError(null);
//       setIsProcessing(true);
//       finalTranscriptRef.current = '';
//       setTranscript('');

//       // Request microphone permission
//       await navigator.mediaDevices.getUserMedia({ audio: true });
      
//       if (recognitionRef.current) {
//         recognitionRef.current.start();
//       }
//     } catch (err) {
//       console.error('Error starting speech recognition:', err);
//       setError('Failed to access microphone. Please check permissions.');
//       setIsProcessing(false);
//     }
//   }, [isSupported]);

//   const stopRecording = useCallback(async () => {
//     if (recognitionRef.current && isRecording) {
//       setIsProcessing(true);
//       recognitionRef.current.stop();
//     }
//   }, [isRecording]);

//   const resetTranscript = useCallback(() => {
//     setTranscript('');
//     finalTranscriptRef.current = '';
//   }, []);

//   return {
//     isRecording,
//     isProcessing,
//     transcript,
//     error,
//     startRecording,
//     stopRecording,
//     resetTranscript,
//     isSupported,
//   };
// };

import { useState, useCallback, useRef } from 'react';

interface UseSpeechToTextReturn {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetTranscript: () => void;
  isSupported: boolean;
}

export const useSpeechToText = (): UseSpeechToTextReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // MediaRecorder is supported in all modern browsers
  const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices;

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript('');
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick best supported format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all mic tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (audioChunksRef.current.length === 0) {
          setIsProcessing(false);
          setError('No audio recorded. Please try again.');
          return;
        }

        setIsProcessing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.webm');

          const response = await fetch('/api/elevenlabs-stt', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Transcription failed');
          }

          if (data.transcript) {
            setTranscript(data.transcript.trim());
          } else {
            setError('No speech detected. Please try again.');
          }
        } catch (err) {
          console.error('STT error:', err);
          setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
        } finally {
          setIsProcessing(false);
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsRecording(false);
      mediaRecorderRef.current.stop(); // triggers onstop → transcription
    }
  }, []);

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
    isSupported,
  };
};