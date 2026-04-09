'use client';
import { useState, useCallback, useRef, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
export interface GazeMetrics {
  totalTime: number;           // seconds
  onScreenTime: number;        // seconds
  offScreenTime: number;       // seconds
  lookAwayCount: number;       // number of times looked away
  blinkCount: number;
  attentionScore: number;      // 0–100
  headPose: 'center' | 'left' | 'right' | 'up' | 'down';
  isOnScreen: boolean;
}

export interface GazeSnapshot {
  timestamp: number;
  isOnScreen: boolean;
  headPose: string;
}

interface UseGazeTrackingReturn {
  isTracking: boolean;
  metrics: GazeMetrics;
  snapshots: GazeSnapshot[];
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  resetMetrics: () => void;
  error: string | null;
}

// ── Default metrics ──────────────────────────────────────────────────────────
const defaultMetrics = (): GazeMetrics => ({
  totalTime: 0,
  onScreenTime: 0,
  offScreenTime: 0,
  lookAwayCount: 0,
  blinkCount: 0,
  attentionScore: 100,
  headPose: 'center',
  isOnScreen: true,
});

// ── MediaPipe landmark indices ────────────────────────────────────────────────
const LEFT_EYE  = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const NOSE_TIP  = 1;
const CHIN      = 152;
const LEFT_EAR  = 234;
const RIGHT_EAR = 454;

function earValue(landmarks: any[], indices: number[]): number {
  const p = (i: number) => landmarks[i];
  const dist = (a: any, b: any) =>
    Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

  const vertical1 = dist(p(indices[1]), p(indices[5]));
  const vertical2 = dist(p(indices[2]), p(indices[4]));
  const horizontal = dist(p(indices[0]), p(indices[3]));
  return (vertical1 + vertical2) / (2 * horizontal);
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useGazeTracking = (): UseGazeTrackingReturn => {
  const [isTracking, setIsTracking]   = useState(false);
  const [metrics, setMetrics]         = useState<GazeMetrics>(defaultMetrics());
  const [snapshots, setSnapshots]     = useState<GazeSnapshot[]>([]);
  const [error, setError]             = useState<string | null>(null);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const streamRef       = useRef<MediaStream | null>(null);
  const animFrameRef    = useRef<number>(0);
  const faceMeshRef     = useRef<any>(null);
  const startTimeRef    = useRef<number>(0);
  const lastTickRef     = useRef<number>(0);
  const onScreenRef     = useRef(true);
  const lookAwayRef     = useRef(0);
  const blinkRef        = useRef(0);
  const onScreenTimeRef = useRef(0);
  const offScreenTimeRef= useRef(0);
  const wasBlinkingRef  = useRef(false);
  const snapshotListRef = useRef<GazeSnapshot[]>([]);

  // ── Load MediaPipe via CDN ─────────────────────────────────────────────
  const loadMediaPipe = useCallback((): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).FaceMesh) {
        resolve((window as any).FaceMesh);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if ((window as any).FaceMesh) resolve((window as any).FaceMesh);
        else reject(new Error('FaceMesh not found after script load'));
      };
      script.onerror = () => reject(new Error('Failed to load MediaPipe FaceMesh'));
      document.head.appendChild(script);
    });
  }, []);

  // ── Analyse a single frame ─────────────────────────────────────────────
  const analyseResults = useCallback((results: any, now: number) => {
    const delta = lastTickRef.current ? (now - lastTickRef.current) / 1000 : 0;
    lastTickRef.current = now;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && videoRef.current) {
      canvas.width  = videoRef.current.videoWidth  || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      // No face detected → off screen
      if (onScreenRef.current) {
        onScreenRef.current = false;
        lookAwayRef.current += 1;
      }
      offScreenTimeRef.current += delta;

      setMetrics(m => ({
        ...m,
        isOnScreen: false,
        headPose: 'center',
        offScreenTime: offScreenTimeRef.current,
        totalTime: (Date.now() - startTimeRef.current) / 1000,
        lookAwayCount: lookAwayRef.current,
        attentionScore: calcScore(),
      }));
      return;
    }

    const lm = results.multiFaceLandmarks[0];

    // ── Head pose ──────────────────────────────────────────────────────
    const nose  = lm[NOSE_TIP];
    const chin  = lm[CHIN];
    const lEar  = lm[LEFT_EAR];
    const rEar  = lm[RIGHT_EAR];

    const faceWidth = Math.abs(lEar.x - rEar.x);
    const noseCenterX = (lEar.x + rEar.x) / 2;
    const horizontalOffset = (nose.x - noseCenterX) / faceWidth;
    const verticalOffset   = nose.y - chin.y;            // negative = looking up

    let pose: GazeMetrics['headPose'] = 'center';
    if (horizontalOffset < -0.12)      pose = 'left';
    else if (horizontalOffset > 0.12)  pose = 'right';
    else if (verticalOffset > 0.05)    pose = 'up';
    else if (verticalOffset < -0.18)   pose = 'down';

    const isOnScreen = pose === 'center' || pose === 'up';

    if (!isOnScreen && onScreenRef.current) {
      lookAwayRef.current += 1;
    }
    onScreenRef.current = isOnScreen;

    if (isOnScreen) onScreenTimeRef.current  += delta;
    else            offScreenTimeRef.current += delta;

    // ── Blink detection via EAR ────────────────────────────────────────
    const leftEAR  = earValue(lm, LEFT_EYE);
    const rightEAR = earValue(lm, RIGHT_EYE);
    const avgEAR   = (leftEAR + rightEAR) / 2;
    const EAR_THRESHOLD = 0.2;

    if (avgEAR < EAR_THRESHOLD && !wasBlinkingRef.current) {
      blinkRef.current += 1;
      wasBlinkingRef.current = true;
    } else if (avgEAR >= EAR_THRESHOLD) {
      wasBlinkingRef.current = false;
    }

    // ── Draw landmarks on canvas ───────────────────────────────────────
    if (ctx && canvas) {
      const dotColor = isOnScreen ? '#22c55e' : '#ef4444';
      [...LEFT_EYE, ...RIGHT_EYE].forEach(idx => {
        const p = lm[idx];
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 2, 0, 2 * Math.PI);
        ctx.fillStyle = dotColor;
        ctx.fill();
      });

      // Nose dot
      ctx.beginPath();
      ctx.arc(nose.x * canvas.width, nose.y * canvas.height, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
    }

    // ── Snapshot every 2 s ────────────────────────────────────────────
    const elapsed = (now - startTimeRef.current) / 1000;
    const lastSnap = snapshotListRef.current.at(-1);
    if (!lastSnap || elapsed - (lastSnap.timestamp - startTimeRef.current / 1000) >= 2) {
      const snap: GazeSnapshot = { timestamp: now, isOnScreen, headPose: pose };
      snapshotListRef.current = [...snapshotListRef.current, snap];
      setSnapshots([...snapshotListRef.current]);
    }

    setMetrics({
      totalTime:      elapsed,
      onScreenTime:   onScreenTimeRef.current,
      offScreenTime:  offScreenTimeRef.current,
      lookAwayCount:  lookAwayRef.current,
      blinkCount:     blinkRef.current,
      attentionScore: calcScore(),
      headPose:       pose,
      isOnScreen,
    });
  }, []);

  function calcScore(): number {
    const total = onScreenTimeRef.current + offScreenTimeRef.current;
    if (total === 0) return 100;
    const base  = (onScreenTimeRef.current / total) * 100;
    const penalty = Math.min(lookAwayRef.current * 2, 20);
    return Math.max(0, Math.round(base - penalty));
  }

  // ── Start tracking ─────────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const FaceMesh = await loadMediaPipe();

      const faceMesh = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces:         1,
        refineLandmarks:     true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence:  0.5,
      });

      faceMesh.onResults((results: any) => analyseResults(results, Date.now()));
      faceMeshRef.current = faceMesh;

      startTimeRef.current     = Date.now();
      lastTickRef.current      = 0;
      onScreenRef.current      = true;
      lookAwayRef.current      = 0;
      blinkRef.current         = 0;
      onScreenTimeRef.current  = 0;
      offScreenTimeRef.current = 0;
      snapshotListRef.current  = [];

      setIsTracking(true);

      // Process frames
      const processFrame = async () => {
        if (videoRef.current && faceMeshRef.current && videoRef.current.readyState >= 2) {
          await faceMeshRef.current.send({ image: videoRef.current });
        }
        animFrameRef.current = requestAnimationFrame(processFrame);
      };
      animFrameRef.current = requestAnimationFrame(processFrame);

    } catch (err) {
      console.error('Gaze tracking error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start gaze tracking');
    }
  }, [loadMediaPipe, analyseResults]);

  // ── Stop tracking ──────────────────────────────────────────────────────
  const stopTracking = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    faceMeshRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsTracking(false);
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics(defaultMetrics());
    setSnapshots([]);
    snapshotListRef.current = [];
  }, []);

  useEffect(() => () => stopTracking(), [stopTracking]);

  return {
    isTracking,
    metrics,
    snapshots,
    videoRef,
    canvasRef,
    startTracking,
    stopTracking,
    resetMetrics,
    error,
  };
};