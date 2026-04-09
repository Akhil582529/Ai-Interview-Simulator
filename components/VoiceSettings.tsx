// VoiceSettings.tsx
// Voice settings component for Web Speech API

import React, { useState, useEffect } from 'react';

export interface VoiceSettingsConfig {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
}

interface VoiceSettingsProps {
  onSettingsChange?: (settings: VoiceSettingsConfig) => void;
  className?: string;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  onSettingsChange,
  className = '',
}) => {
  const [settings, setSettings] = useState<VoiceSettingsConfig>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('voiceSettings');
    return saved
      ? JSON.parse(saved)
      : {
          enabled: true,
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
        };
  });

  // Save settings to localStorage and notify parent
  useEffect(() => {
    localStorage.setItem('voiceSettings', JSON.stringify(settings));
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const updateSetting = <K extends keyof VoiceSettingsConfig>(
    key: K,
    value: VoiceSettingsConfig[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`voice-settings bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
        <span className="mr-2">🎤</span>
        Voice Settings
      </h2>

      {/* Enable/Disable Voice */}
      <div className="mb-6">
        <label className="flex items-center space-x-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateSetting('enabled', e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-14 h-8 rounded-full transition-colors ${
                settings.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  settings.enabled ? 'transform translate-x-6' : ''
                }`}
              />
            </div>
          </div>
          <div>
            <span className="text-lg font-medium text-gray-700">
              Enable Voice Agent
            </span>
            <p className="text-sm text-gray-500">
              AI will read interview questions aloud
            </p>
          </div>
        </label>
      </div>

      {/* Settings (only show when enabled) */}
      {settings.enabled && (
        <div className="space-y-6">
          {/* Speech Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speech Rate: {settings.rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.rate}
              onChange={(e) => updateSetting('rate', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5x (Slower)</span>
              <span>1.0x (Normal)</span>
              <span>2.0x (Faster)</span>
            </div>
          </div>

          {/* Pitch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pitch: {settings.pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => updateSetting('pitch', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5 (Lower)</span>
              <span>1.0 (Normal)</span>
              <span>2.0 (Higher)</span>
            </div>
          </div>

          {/* Volume */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume: {Math.round(settings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0% (Mute)</span>
              <span>50%</span>
              <span>100% (Max)</span>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
          <span className="mr-2">💡</span>
          Tips
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Uses your browser's built-in voices (100% free)</li>
          <li>• Works best in Chrome, Edge, and Safari</li>
          <li>• Adjust rate if the voice speaks too fast/slow</li>
          <li>• No internet required after page loads</li>
        </ul>
      </div>

      {/* Test Button */}
      {settings.enabled && (
        <button
          onClick={() => {
            const utterance = new SpeechSynthesisUtterance(
              'This is a test of the voice settings. How do I sound?'
            );
            utterance.rate = settings.rate;
            utterance.pitch = settings.pitch;
            utterance.volume = settings.volume;
            window.speechSynthesis.speak(utterance);
          }}
          className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          🔊 Test Voice Settings
        </button>
      )}
    </div>
  );
};

export default VoiceSettings;