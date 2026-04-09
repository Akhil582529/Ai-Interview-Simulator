"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTextToSpeech } from '@/utils/useTextToSpeech';
import { Volume2, VolumeX, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function TestTTSPage() {
  const [testText, setTestText] = useState("Hello! This is a test of the ElevenLabs text to speech integration. If you can hear this, everything is working correctly!");
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [apiMessage, setApiMessage] = useState('');

  const { speak, stop, isPlaying, isLoading, error } = useTextToSpeech({
    onStart: () => console.log('TTS Started'),
    onEnd: () => console.log('TTS Ended'),
    onError: (err) => console.error('TTS Error:', err),
  });

  const testApiKey = async () => {
    setApiStatus('checking');
    setApiMessage('Checking API configuration...');

    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Test' }),
      });

      if (response.ok) {
        setApiStatus('success');
        setApiMessage('✓ API key is configured correctly! ElevenLabs is ready to use.');
      } else {
        const data = await response.json();
        setApiStatus('error');
        setApiMessage(`✗ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setApiStatus('error');
      setApiMessage(`✗ Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">🔊 ElevenLabs TTS Test Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Status Check */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Step 1: Check API Configuration</h3>
              <Button
                onClick={testApiKey}
                disabled={apiStatus === 'checking'}
                className="w-full"
              >
                {apiStatus === 'checking' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Test API Key'
                )}
              </Button>

              {apiStatus !== 'idle' && (
                <div className={`p-4 rounded-lg ${
                  apiStatus === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : apiStatus === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  <div className="flex items-center">
                    {apiStatus === 'success' && <CheckCircle className="mr-2 h-5 w-5" />}
                    {apiStatus === 'error' && <XCircle className="mr-2 h-5 w-5" />}
                    <p className="font-medium">{apiMessage}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Text Input */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Step 2: Test Text-to-Speech</h3>
              <Textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to convert to speech..."
                className="min-h-[100px]"
              />
              <p className="text-sm text-gray-500">{testText.length} characters</p>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button
                onClick={() => speak(testText)}
                disabled={isLoading || isPlaying || !testText.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Play Audio
                  </>
                )}
              </Button>

              <Button
                onClick={stop}
                disabled={!isPlaying && !isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <VolumeX className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>

            {/* Status Display */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className={`font-medium ${
                  isPlaying ? 'text-green-600' : 
                  isLoading ? 'text-blue-600' : 
                  'text-gray-600'
                }`}>
                  {isPlaying ? '▶ Playing' : isLoading ? '⏳ Loading' : '⏸ Idle'}
                </span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <p className="font-semibold">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📝 Setup Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Get your API key from <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" className="underline">ElevenLabs</a></li>
                <li>Add to <code className="bg-blue-100 px-1 rounded">.env.local</code>: <code className="bg-blue-100 px-1 rounded">ELEVENLABS_API_KEY=your_key</code></li>
                <li>Restart your dev server: <code className="bg-blue-100 px-1 rounded">npm run dev</code></li>
                <li>Click "Test API Key" above to verify setup</li>
                <li>Click "Play Audio" to test text-to-speech</li>
              </ol>
            </div>

            {/* Console Logs */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">🐛 Debugging:</h4>
              <p className="text-sm text-gray-600">Check your browser console (F12) for detailed logs about:</p>
              <ul className="text-sm text-gray-600 list-disc list-inside mt-2">
                <li>API requests and responses</li>
                <li>Audio blob sizes</li>
                <li>Playback events</li>
                <li>Any errors that occur</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}