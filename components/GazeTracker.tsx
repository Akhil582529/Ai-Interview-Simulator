'use client';
import React from 'react';
import { Eye, EyeOff, AlertCircle, Wifi } from 'lucide-react';
import { GazeMetrics } from '@/utils/useGazeTracking';

interface GazeTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  metrics: GazeMetrics;
  isTracking: boolean;
  error: string | null;
}

const poseLabel: Record<string, string> = {
  center: '✅ Looking at screen',
  up:     '🙂 Slightly up',
  left:   '👈 Looking left',
  right:  '👉 Looking right',
  down:   '👇 Looking down',
};

export const GazeTracker: React.FC<GazeTrackerProps> = ({
  videoRef,
  canvasRef,
  metrics,
  isTracking,
  error,
}) => {
  const attentionColor =
    metrics.attentionScore >= 80
      ? 'text-green-400'
      : metrics.attentionScore >= 60
      ? 'text-yellow-400'
      : 'text-red-400';

  const ringColor =
    metrics.isOnScreen ? 'ring-green-400' : 'ring-red-400';

  return (
    <div className="flex flex-col gap-3">
      {/* ── Video feed ── */}
      <div className={`relative rounded-2xl overflow-hidden bg-black ring-2 ${ringColor} transition-all duration-300 shadow-lg`}
           style={{ width: 220, height: 165 }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"  // mirror
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
        />

        {/* Status badge */}
        <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-sm
          ${metrics.isOnScreen ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
          {metrics.isOnScreen ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {metrics.isOnScreen ? 'On Screen' : 'Off Screen'}
        </div>

        {/* Recording dot */}
        {isTracking && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        )}

        {/* Not tracking overlay */}
        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-white text-xs text-center px-2">Camera off</p>
          </div>
        )}
      </div>

      {/* ── Live stats ── */}
      {isTracking && (
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-3 space-y-2 text-xs w-[220px]">
          {/* Attention score */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Attention</span>
            <span className={`font-bold text-sm ${attentionColor}`}>
              {metrics.attentionScore}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                metrics.attentionScore >= 80 ? 'bg-green-400' :
                metrics.attentionScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${metrics.attentionScore}%` }}
            />
          </div>

          {/* Head pose */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Gaze</span>
            <span className="text-white font-medium">
              {poseLabel[metrics.headPose] ?? metrics.headPose}
            </span>
          </div>

          {/* Look-away count */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Looked away</span>
            <span className="text-white font-medium">{metrics.lookAwayCount}×</span>
          </div>

          {/* Blink count */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Blinks</span>
            <span className="text-white font-medium">{metrics.blinkCount}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 w-[220px]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
    </div>
  );
};