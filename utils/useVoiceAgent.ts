import { useState, useCallback, useRef, useEffect } from 'react';

type VoiceType = 'alloy' | 'echo' | 'shimmer';

interface UseVoiceAgentReturn {
  isConnected: boolean;
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
  transcript: string;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  interrupt: () => void;
  sendMessage: (text: string) => void;
  setVoice: (voice: VoiceType) => void;
  currentVoice: VoiceType;
}

export const useVoiceAgent = (): UseVoiceAgentReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentVoice, setCurrentVoice] = useState<VoiceType>('alloy');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextAudioTimeRef = useRef(0);

  // 🔥 Initialize AudioContext properly
  const initAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  // 🔥 Connect to Realtime API
  const connect = useCallback(async () => {
    try {
      setError(null);

      const sessionResponse = await fetch('/api/realtime-sessions');
      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const sessionData = await sessionResponse.json();

      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
        [
          'realtime',
          `openai-insecure-api-key.${sessionData.client_secret.value}`,
          'openai-beta.realtime-v1',
        ]
      );

      ws.onopen = async () => {
        setIsConnected(true);

        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions:
              'You are a professional interviewer. Ask one interview question at a time. Wait for the candidate to finish speaking before responding.',
            voice: currentVoice,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        }));

        await startAudioInput(ws);

        // 🔥 Trigger first question automatically
        ws.send(JSON.stringify({ type: 'response.create' }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealtimeEvent(data);
      };

      ws.onerror = () => {
        setError('Connection error occurred');
      };

      ws.onclose = () => {
        cleanup();
      };

      wsRef.current = ws;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [currentVoice]);

  // 🔥 Start microphone capture
  const startAudioInput = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;

      const audioContext = await initAudioContext();
      const source = audioContext.createMediaStreamSource(stream);

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);

        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: arrayBufferToBase64(pcm16.buffer),
        }));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch {
      setError('Failed to access microphone');
    }
  };

  // 🔥 Handle Realtime events
  const handleRealtimeEvent = (event: any) => {
    switch (event.type) {
      case 'input_audio_buffer.speech_started':
        setIsUserSpeaking(true);
        break;

      case 'input_audio_buffer.speech_stopped':
        setIsUserSpeaking(false);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        setTranscript(prev => prev + '\nUser: ' + event.transcript);
        break;

      case 'response.audio.delta':
        if (event.delta) {
          playAudioChunk(event.delta);
        }
        break;

      case 'response.audio.done':
        setIsAgentSpeaking(false);
        nextAudioTimeRef.current = 0;
        break;

      case 'response.text.delta':
        setTranscript(prev => prev + event.delta);
        break;

      case 'error':
        setError(event.error?.message || 'API Error');
        break;
    }
  };

  // 🔥 Proper realtime audio scheduling
  const playAudioChunk = async (base64Audio: string) => {
    try {
      const audioContext = await initAudioContext();
      setIsAgentSpeaking(true);

      const audioData = base64ToArrayBuffer(base64Audio);
      const pcm16 = new Int16Array(audioData);
      const float32 = new Float32Array(pcm16.length);

      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff);
      }

      const audioBuffer = audioContext.createBuffer(
        1,
        float32.length,
        24000
      );

      audioBuffer.getChannelData(0).set(float32);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      if (nextAudioTimeRef.current < audioContext.currentTime) {
        nextAudioTimeRef.current = audioContext.currentTime;
      }

      source.start(nextAudioTimeRef.current);
      nextAudioTimeRef.current += audioBuffer.duration;

    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    }));

    wsRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  const interrupt = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'response.cancel' }));
      nextAudioTimeRef.current = 0;
      setIsAgentSpeaking(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    cleanup();
  }, []);

  const cleanup = () => {
    processorRef.current?.disconnect();
    processorRef.current = null;

    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;

    setIsConnected(false);
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);
  };

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    isConnected,
    isAgentSpeaking,
    isUserSpeaking,
    transcript,
    error,
    connect,
    disconnect,
    interrupt,
    sendMessage,
    setVoice: setCurrentVoice,
    currentVoice,
  };
};

// 🔥 Helpers
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
