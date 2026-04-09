import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Radio,
  Waves,
} from "lucide-react";
import { Interview, InterviewSession } from '@/types/interview';
import { useGazeTracking, GazeMetrics } from '@/utils/useGazeTracking';
import { GazeTracker } from '@/components/GazeTracker';
// ── TTS via secure server route ─────────────────────────────────────────────
async function speakViaAPI(text: string): Promise<HTMLAudioElement> {
  const response = await fetch('/api/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate speech');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener('ended', () => URL.revokeObjectURL(url));
  return audio;
}

// ── Types ───────────────────────────────────────────────────────────────────
interface PracticeModeProps {
  interview: Interview;
  session: InterviewSession;
  currentAnswer: string;
  onAnswerChange: (value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
  onExit: () => void;
  isGeneratingFeedback: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  speechError: string | null;
  onMicToggle: () => void;
  onGazeReport?: (metrics: GazeMetrics) => void;
}

// ── Component ───────────────────────────────────────────────────────────────
export const PracticeMode: React.FC<PracticeModeProps> = ({
  interview,
  session,
  currentAnswer,
  onAnswerChange,
  onNext,
  onPrevious,
  onFinish,
  onExit,
  isGeneratingFeedback,
  isRecording,
  isProcessing,
  speechError,
  onMicToggle,
  onGazeReport,
}) => {
  const currentQuestion = interview.questions[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex + 1) / interview.questions.length) * 100;

  // ── Gaze tracking ──────────────────────────────────────────────────────
  const {
    isTracking,
    metrics: gazeMetrics,
    videoRef,
    canvasRef,
    startTracking,
    stopTracking,
    error: gazeError,
  } = useGazeTracking();

  // ── State ──────────────────────────────────────────────────────────────
  const [showReadyPopup, setShowReadyPopup] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechLoading, setIsSpeechLoading] = useState(false);
  const [speechError2, setSpeechError2] = useState<string | null>(null);
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Speak via ElevenLabs ───────────────────────────────────────────────
  const speakQuestion = useCallback(async (text: string) => {
    try {
      // Stop any previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setIsSpeechLoading(true);
      setSpeechError2(null);

      const audio = await speakViaAPI(text);
      audioRef.current = audio;

      audio.onplay = () => { setIsSpeaking(true); setIsSpeechLoading(false); };
      audio.onended = () => { setIsSpeaking(false); audioRef.current = null; };
      audio.onerror = () => {
        setIsSpeaking(false);
        setIsSpeechLoading(false);
        setSpeechError2('Audio playback failed.');
      };

      await audio.play();
    } catch (err) {
      setIsSpeechLoading(false);
      setIsSpeaking(false);
      setSpeechError2(err instanceof Error ? err.message : 'Failed to speak question');
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const pauseSpeaking = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsSpeaking(false);
    } else if (audioRef.current?.paused) {
      audioRef.current.play();
      setIsSpeaking(true);
    }
  }, []);

  // ── Auto-ask question when it changes (after popup dismissed) ──────────
  useEffect(() => {
    if (!showReadyPopup && currentQuestion) {
      setHasAskedQuestion(false);
      stopSpeaking();
    }
  }, [session.currentQuestionIndex]);

  useEffect(() => {
    if (!showReadyPopup && currentQuestion && !hasAskedQuestion) {
      setHasAskedQuestion(true);
      speakQuestion(currentQuestion);
    }
  }, [showReadyPopup, currentQuestion, hasAskedQuestion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  // ── Ready Popup ────────────────────────────────────────────────────────
  if (showReadyPopup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-black flex items-center justify-center p-4">
        {/* Animated background rings */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-purple-500/10 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-indigo-500/15 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-violet-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 text-center max-w-lg w-full">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/40">
                <Radio className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-2 rounded-full border-2 border-purple-400/30 animate-pulse" />
            </div>
          </div>

          {/* Text */}
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Ready for your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              Voice Interview?
            </span>
          </h1>

          <p className="text-purple-200/70 text-base mb-3">
            <span className="font-semibold text-purple-100">{interview.role}</span> · {interview.questions.length} questions
          </p>

          <p className="text-purple-300/60 text-sm mb-10 leading-relaxed">
            Questions will be read aloud by your AI interviewer.<br />
            Use the mic button to record your voice answers.
          </p>

          {/* Tips */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-3">
            {[
              { icon: '🎧', text: 'Put on headphones for the best experience' },
              { icon: '🎙️', text: 'Speak clearly — your answers are recorded via mic' },
              { icon: '🔇', text: 'Find a quiet space to avoid background noise' },
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-purple-200/70">
                <span className="text-lg">{tip.icon}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={onExit}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-6 rounded-xl text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={() => { setShowReadyPopup(false); startTracking(); }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-10 py-6 rounded-xl text-base font-bold shadow-xl shadow-purple-500/30 transition-all duration-200 hover:scale-105"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Interview Screen ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-4 items-start">
          {/* ── Main interview card ── */}
          <div className="flex-1 min-w-0">
        <Card className="shadow-2xl border-0 bg-white">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center text-xl md:text-2xl font-bold">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3">
                  <Play className="h-5 w-5" />
                </div>
                <span className="truncate">{interview.role}</span>
              </CardTitle>
              <Button
                onClick={onExit}
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                size="sm"
              >
                Exit
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/90 font-medium">
                <span>Question {session.currentQuestionIndex + 1} of {interview.questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Question Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="bg-indigo-600 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    {session.currentQuestionIndex + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-500 text-sm mb-2">QUESTION</h3>
                    <p className="text-gray-900 text-lg leading-relaxed font-medium">
                      {currentQuestion}
                    </p>
                  </div>
                </div>

                {/* TTS Controls */}
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  {isSpeechLoading ? (
                    <Button disabled className="bg-green-500 text-white shadow-md" size="sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </Button>
                  ) : isSpeaking ? (
                    <>
                      <Button
                        type="button"
                        onClick={pauseSpeaking}
                        className="bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                        size="sm"
                        title="Pause"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={stopSpeaking}
                        className="bg-red-500 hover:bg-red-600 text-white shadow-md"
                        size="sm"
                        title="Stop"
                      >
                        <VolumeX className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => speakQuestion(currentQuestion)}
                      className="bg-green-500 hover:bg-green-600 text-white shadow-md"
                      size="sm"
                      title="Replay question"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {speechError2 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {speechError2}
                </div>
              )}
            </div>

            {/* Voice Answer Section — replaces text field */}
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-8 flex flex-col items-center justify-center space-y-5 text-center">

              {/* Live speaking indicator */}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium animate-pulse">
                  <Waves className="h-4 w-4" />
                  AI is speaking the question…
                </div>
              )}

              {/* Mic button */}
              <button
                type="button"
                onClick={onMicToggle}
                disabled={isProcessing || isSpeaking}
                className={`
                  w-24 h-24 rounded-full flex items-center justify-center shadow-xl
                  transition-all duration-300 focus:outline-none
                  ${isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110 shadow-red-300'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 hover:scale-105 shadow-indigo-300'
                  }
                  ${(isProcessing || isSpeaking) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isProcessing ? (
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-10 w-10 text-white" />
                ) : (
                  <Mic className="h-10 w-10 text-white" />
                )}
              </button>

              <div className="space-y-1">
                <p className="text-base font-semibold text-gray-800">
                  {isProcessing
                    ? 'Processing your answer…'
                    : isRecording
                    ? 'Recording — tap to stop'
                    : isSpeaking
                    ? 'Wait for the question to finish…'
                    : 'Tap the mic to answer'}
                </p>
                <p className="text-sm text-gray-500">
                  {isRecording
                    ? 'Speak clearly into your microphone'
                    : 'Your spoken answer will be captured automatically'}
                </p>
              </div>

              {/* Recording indicator bars — fixed heights, transform-only animation (no layout shift) */}
              {isRecording && (
                <div className="flex items-center gap-1.5" style={{ height: 28 }}>
                  {[14, 22, 18, 26, 16].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-red-400 rounded-full"
                      style={{
                        height: h,
                        animation: 'barPulse 0.7s ease-in-out infinite alternate',
                        animationDelay: `${i * 0.12}s`,
                      }}
                    />
                  ))}
                  <style>{`
                    @keyframes barPulse {
                      from { transform: scaleY(0.4); opacity: 0.6; }
                      to   { transform: scaleY(1);   opacity: 1; }
                    }
                  `}</style>
                  <span className="ml-2 text-red-600 text-sm font-medium">Live</span>
                </div>
              )}

              {/* Current answer preview */}
              {currentAnswer && (
                <div className="w-full max-w-lg bg-white rounded-xl border border-indigo-100 p-4 text-left shadow-sm">
                  <p className="text-xs font-semibold text-indigo-400 mb-1 uppercase tracking-wide">Your answer</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{currentAnswer}</p>
                  <p className="text-xs text-gray-400 mt-2">{currentAnswer.length} characters</p>
                </div>
              )}

              {speechError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm w-full max-w-lg">
                  {speechError}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                onClick={onPrevious}
                disabled={session.currentQuestionIndex === 0}
                className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold py-6 px-6"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Previous
              </Button>

              {session.currentQuestionIndex === interview.questions.length - 1 ? (
                <Button
                  onClick={() => { stopTracking(); onGazeReport?.(gazeMetrics); onFinish(); }}
                  disabled={isGeneratingFeedback}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg font-semibold py-6 px-6"
                >
                  {isGeneratingFeedback ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      Finish &amp; Get Feedback
                      <CheckCircle className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => { stopSpeaking(); onNext(); }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg font-semibold py-6 px-6"
                >
                  Next Question
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
          </div>{/* end main card */}

          {/* ── Gaze tracker sidebar ── */}
          <div className="flex-shrink-0 pt-1 hidden md:block">
            <GazeTracker
              videoRef={videoRef}
              canvasRef={canvasRef}
              metrics={gazeMetrics}
              isTracking={isTracking}
              error={gazeError}
            />
          </div>
        </div>{/* end flex row */}
      </div>
    </div>
  );
};