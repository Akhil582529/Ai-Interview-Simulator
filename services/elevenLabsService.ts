// Service for ElevenLabs Text-to-Speech API

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private defaultVoiceId = process.env.ELEVENLABS_VOICE_ID; // Default voice (Rachel)
  private defaultModelId = 'eleven_monolingual_v1';

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
    if (config.voiceId) this.defaultVoiceId = config.voiceId;
    if (config.modelId) this.defaultModelId = config.modelId;
  }

  /**
   * Convert text to speech
   * @param text - The text to convert
   * @param voiceId - Optional voice ID (defaults to Rachel)
   * @returns Audio blob
   */
  async textToSpeech(
    text: string,
    voiceId?: string,
    voiceSettings?: VoiceSettings
  ): Promise<Blob> {
    const voice = voiceId || this.defaultVoiceId;
    
    const response = await fetch(
      `${this.baseUrl}/text-to-speech/${voice}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: this.defaultModelId,
          voice_settings: voiceSettings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ElevenLabs API error: ${error.detail?.message || response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get available voices
   * @returns List of available voices
   */
  async getVoices() {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    return response.json();
  }

  /**
   * Stream text to speech (for longer texts)
   * @param text - The text to convert
   * @param voiceId - Optional voice ID
   * @returns ReadableStream of audio data
   */
  async textToSpeechStream(
    text: string,
    voiceId?: string,
    voiceSettings?: VoiceSettings
  ): Promise<ReadableStream<Uint8Array> | null> {
    const voice = voiceId || this.defaultVoiceId;
    
    const response = await fetch(
      `${this.baseUrl}/text-to-speech/${voice}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: this.defaultModelId,
          voice_settings: voiceSettings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`ElevenLabs API error: ${error.detail?.message || response.statusText}`);
    }

    return response.body;
  }
}

// Helper function to play audio from blob
export const playAudioBlob = (blob: Blob): HTMLAudioElement => {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  
  // Clean up the object URL when audio finishes playing
  audio.addEventListener('ended', () => {
    URL.revokeObjectURL(url);
  });
  
  return audio;
};

// Helper function to download audio
export const downloadAudio = (blob: Blob, filename: string = 'audio.mp3') => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};