// import React from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ArrowLeft, Play, Award, Star, Eye, EyeOff, Activity, Zap } from "lucide-react";
// import { Interview } from '@/types/interview';
// import { GazeMetrics } from '@/utils/useGazeTracking';

// interface FeedbackScreenProps {
//   interview: Interview;
//   feedback: string;
//   onExit: () => void;
//   onPracticeAgain: () => void;
//   gazeReport?: GazeMetrics;
// }

// function formatTime(seconds: number): string {
//   const m = Math.floor(seconds / 60);
//   const s = Math.round(seconds % 60);
//   return m > 0 ? `${m}m ${s}s` : `${s}s`;
// }

// function ScoreRing({ score }: { score: number }) {
//   const color =
//     score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
//   const label =
//     score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';
//   const r = 36;
//   const circumference = 2 * Math.PI * r;
//   const dash = (score / 100) * circumference;

//   return (
//     <div className="flex flex-col items-center gap-1">
//       <svg width="96" height="96" viewBox="0 0 96 96">
//         <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
//         <circle
//           cx="48" cy="48" r={r}
//           fill="none"
//           stroke={color}
//           strokeWidth="8"
//           strokeDasharray={`${dash} ${circumference}`}
//           strokeLinecap="round"
//           transform="rotate(-90 48 48)"
//           style={{ transition: 'stroke-dasharray 1s ease' }}
//         />
//         <text x="48" y="44" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>{score}</text>
//         <text x="48" y="58" textAnchor="middle" fontSize="9" fill="#6b7280">/ 100</text>
//       </svg>
//       <span className="text-sm font-semibold" style={{ color }}>{label}</span>
//     </div>
//   );
// }

// export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
//   interview,
//   feedback,
//   onExit,
//   onPracticeAgain,
//   gazeReport,
// }) => {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
//       <div className="max-w-4xl mx-auto space-y-6">

//         {/* ── Main feedback card ── */}
//         <Card className="shadow-2xl border-0 bg-white overflow-hidden">
//           <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white py-8">
//             <div className="flex justify-center mb-4">
//               <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
//                 <Award className="h-12 w-12" />
//               </div>
//             </div>
//             <CardTitle className="text-3xl font-bold mb-2">
//               Interview Complete! 🎉
//             </CardTitle>
//             <CardDescription className="text-green-50 text-lg">
//               Here's your personalized feedback for the {interview.role} interview
//             </CardDescription>
//           </CardHeader>

//           <CardContent className="p-8 space-y-6">
//             <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl p-6">
//               <h3 className="font-bold text-xl mb-4 text-gray-900 flex items-center">
//                 <Star className="h-6 w-6 text-yellow-500 mr-2" />
//                 Your Performance Review
//               </h3>
//               <div className="prose prose-slate max-w-none">
//                 <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
//                   {feedback}
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row justify-center gap-4">
//               <Button
//                 onClick={onExit}
//                 className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg py-6 text-base font-semibold"
//               >
//                 <ArrowLeft className="h-5 w-5 mr-2" />
//                 Back to Interviews
//               </Button>
//               <Button
//                 onClick={onPracticeAgain}
//                 className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 shadow-lg py-6 text-base font-semibold"
//               >
//                 <Play className="h-5 w-5 mr-2" />
//                 Practice Again
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//         {/* ── Gaze report card ── */}
//         {gazeReport && (
//           <Card className="shadow-2xl border-0 bg-white overflow-hidden">
//             <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-6">
//               <CardTitle className="flex items-center text-xl font-bold">
//                 <Eye className="h-6 w-6 mr-2" />
//                 Gaze & Attention Report
//               </CardTitle>
//               <CardDescription className="text-indigo-100">
//                 How focused were you during the interview?
//               </CardDescription>
//             </CardHeader>

//             <CardContent className="p-8">
//               <div className="flex flex-col md:flex-row gap-8 items-start">

//                 {/* Score ring */}
//                 <div className="flex-shrink-0 flex flex-col items-center gap-2">
//                   <ScoreRing score={gazeReport.attentionScore} />
//                   <p className="text-xs text-gray-500 text-center">Attention Score</p>
//                 </div>

//                 {/* Stats grid */}
//                 <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
//                   {[
//                     {
//                       icon: <Activity className="w-5 h-5 text-indigo-500" />,
//                       label: 'Total Time',
//                       value: formatTime(gazeReport.totalTime),
//                     },
//                     {
//                       icon: <Eye className="w-5 h-5 text-green-500" />,
//                       label: 'On Screen',
//                       value: formatTime(gazeReport.onScreenTime),
//                       sub: gazeReport.totalTime > 0
//                         ? `${Math.round((gazeReport.onScreenTime / gazeReport.totalTime) * 100)}%`
//                         : '—',
//                     },
//                     {
//                       icon: <EyeOff className="w-5 h-5 text-red-400" />,
//                       label: 'Off Screen',
//                       value: formatTime(gazeReport.offScreenTime),
//                       sub: gazeReport.totalTime > 0
//                         ? `${Math.round((gazeReport.offScreenTime / gazeReport.totalTime) * 100)}%`
//                         : '—',
//                     },
//                     {
//                       icon: <span className="text-lg">👀</span>,
//                       label: 'Look-aways',
//                       value: `${gazeReport.lookAwayCount}×`,
//                       sub: gazeReport.lookAwayCount === 0 ? 'Perfect!' :
//                            gazeReport.lookAwayCount <= 3 ? 'Good' : 'Work on focus',
//                     },
//                     {
//                       icon: <Zap className="w-5 h-5 text-yellow-500" />,
//                       label: 'Blink Count',
//                       value: gazeReport.blinkCount,
//                       sub: 'Normal: 15–20/min',
//                     },
//                     {
//                       icon: <span className="text-lg">🎯</span>,
//                       label: 'Final Pose',
//                       value: gazeReport.headPose,
//                     },
//                   ].map((stat, i) => (
//                     <div key={i} className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1">
//                       <div className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wide">
//                         {stat.icon}
//                         {stat.label}
//                       </div>
//                       <p className="text-xl font-bold text-gray-900">{stat.value}</p>
//                       {stat.sub && <p className="text-xs text-gray-400">{stat.sub}</p>}
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Tips based on score */}
//               <div className="mt-6 p-4 rounded-xl border border-indigo-100 bg-indigo-50">
//                 <p className="text-sm font-semibold text-indigo-700 mb-2">💡 Tips for next time</p>
//                 <ul className="text-sm text-indigo-600 space-y-1">
//                   {gazeReport.attentionScore < 80 && (
//                     <li>• Try to maintain eye contact with the camera throughout.</li>
//                   )}
//                   {gazeReport.lookAwayCount > 3 && (
//                     <li>• You looked away {gazeReport.lookAwayCount} times — practice keeping focus on screen.</li>
//                   )}
//                   {gazeReport.blinkCount > gazeReport.totalTime * 0.5 && (
//                     <li>• High blink rate detected — you may have been nervous. Deep breaths help!</li>
//                   )}
//                   {gazeReport.attentionScore >= 80 && gazeReport.lookAwayCount <= 3 && (
//                     <li>• Great focus! Keep up the eye contact and composed posture.</li>
//                   )}
//                 </ul>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//       </div>
//     </div>
//   );
// };

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Play, Award, Star, Eye, EyeOff,
  Activity, Zap, CheckCircle, XCircle, AlertCircle,
  MinusCircle, TrendingUp, Lightbulb, ChevronDown, ChevronUp
} from "lucide-react";
import { Interview } from '@/types/interview';
import { StructuredFeedback } from '@/services/interviewService';
import { GazeMetrics } from '@/utils/useGazeTracking';

interface FeedbackScreenProps {
  interview: Interview;
  feedback: string;
  structured?: StructuredFeedback;
  onExit: () => void;
  onPracticeAgain: () => void;
  gazeReport?: GazeMetrics;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

const STATUS_CONFIG = {
  good:       { label: 'Good',       icon: CheckCircle,  bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  iconColor: 'text-green-500'  },
  partial:    { label: 'Partial',    icon: AlertCircle,  bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', iconColor: 'text-yellow-500' },
  poor:       { label: 'Poor',       icon: XCircle,      bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    iconColor: 'text-red-500'    },
  unanswered: { label: 'Unanswered', icon: MinusCircle,  bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-500',   iconColor: 'text-gray-400'   },
};

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, max = 10, label }: { score: number; max?: number; label: string }) {
  const pct   = (score / max) * 100;
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const grade = pct >= 80 ? 'Excellent' : pct >= 65 ? 'Good' : pct >= 50 ? 'Average' : 'Needs Work';
  const r     = 40;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="104" height="104" viewBox="0 0 104 104">
        <circle cx="52" cy="52" r={r} fill="none" stroke="#e5e7eb" strokeWidth="9" />
        <circle cx="52" cy="52" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 52 52)" />
        <text x="52" y="47" textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>{score}</text>
        <text x="52" y="62" textAnchor="middle" fontSize="10" fill="#9ca3af">/ {max}</text>
      </svg>
      <p className="text-sm font-bold" style={{ color }}>{grade}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl p-4 ${color} flex-1`}>
      <span className="text-3xl font-extrabold">{count}</span>
      <span className="text-xs font-medium mt-0.5 opacity-75">{label}</span>
    </div>
  );
}

// ── Question row (accordion) ──────────────────────────────────────────────────
function QuestionRow({ item, index }: { item: StructuredFeedback['questionBreakdown'][0]; index: number }) {
  const [open, setOpen] = useState(false);
  const cfg  = STATUS_CONFIG[item.status];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:brightness-95 transition-all">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-medium text-gray-800 line-clamp-1">{item.question}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70 ${cfg.text}`}>
            <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
            {cfg.label}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/50 pt-3">
          {item.answer && item.answer !== 'No answer provided' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Your Answer</p>
              <p className="text-sm text-gray-700 bg-white/70 rounded-lg p-3 leading-relaxed">{item.answer}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Feedback</p>
            <p className={`text-sm font-medium ${cfg.text}`}>{item.comment}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({
  interview, feedback, structured, onExit, onPracticeAgain, gazeReport,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Hero ── */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white py-10">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Award className="h-12 w-12" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">Interview Complete! 🎉</CardTitle>
            <CardDescription className="text-green-50 text-lg">
              {interview.role} · {interview.experience}
            </CardDescription>
          </CardHeader>
        </Card>

        {structured ? (<>

          {/* ── Overall score + summary ── */}
          <Card className="shadow-xl border-0 bg-white">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <ScoreRing score={structured.overallRating} max={10} label="Overall Rating" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" /> Overall Assessment
                  </h2>
                  <p className="text-gray-600 leading-relaxed">{structured.overallSummary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Question stats ── */}
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-lg font-bold text-gray-900">Question Breakdown</CardTitle>
              <CardDescription>{structured.totalQuestions} questions total</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-5">
              {/* Pills */}
              <div className="flex gap-3">
                <StatPill count={structured.answeredWell}   label="Answered Well" color="bg-green-100 text-green-700" />
                <StatPill count={structured.partialAnswers} label="Partial"        color="bg-yellow-100 text-yellow-700" />
                <StatPill count={structured.poorAnswers}    label="Poor"           color="bg-red-100 text-red-700" />
                <StatPill count={structured.unanswered}     label="Unanswered"     color="bg-gray-100 text-gray-500" />
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex">
                {structured.answeredWell   > 0 && <div className="bg-green-400  h-full transition-all" style={{ width: `${(structured.answeredWell   / structured.totalQuestions) * 100}%` }} />}
                {structured.partialAnswers > 0 && <div className="bg-yellow-400 h-full transition-all" style={{ width: `${(structured.partialAnswers / structured.totalQuestions) * 100}%` }} />}
                {structured.poorAnswers    > 0 && <div className="bg-red-400    h-full transition-all" style={{ width: `${(structured.poorAnswers    / structured.totalQuestions) * 100}%` }} />}
                {structured.unanswered     > 0 && <div className="bg-gray-300   h-full transition-all" style={{ width: `${(structured.unanswered     / structured.totalQuestions) * 100}%` }} />}
              </div>

              {/* Per-question accordion */}
              <div className="space-y-2">
                {structured.questionBreakdown.map((item, i) => (
                  <QuestionRow key={i} item={item} index={i} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Strengths / Improvements / Tips ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Strengths',    Icon: CheckCircle, color: 'text-green-700',  dot: 'bg-green-400',  items: structured.strengths    },
              { title: 'Improvements', Icon: TrendingUp,  color: 'text-red-600',    dot: 'bg-red-400',    items: structured.improvements },
              { title: 'Tips',         Icon: Lightbulb,   color: 'text-indigo-700', dot: 'bg-indigo-400', items: structured.tips         },
            ].map(({ title, Icon, color, dot, items }) => (
              <Card key={title} className="shadow-xl border-0 bg-white">
                <CardHeader className="pb-2 px-5 pt-5">
                  <CardTitle className={`text-base font-bold ${color} flex items-center gap-2`}>
                    <Icon className="w-5 h-5" /> {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <ul className="space-y-2">
                    {items.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className={`w-1.5 h-1.5 rounded-full ${dot} mt-2 flex-shrink-0`} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

        </>) : (
          /* Fallback plain text */
          <Card className="shadow-xl border-0 bg-white">
            <CardContent className="p-8">
              <h3 className="font-bold text-xl mb-4 text-gray-900 flex items-center">
                <Star className="h-6 w-6 text-yellow-500 mr-2" /> Your Performance Review
              </h3>
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{feedback}</div>
            </CardContent>
          </Card>
        )}

        {/* ── Gaze report ── */}
        {gazeReport && (
          <Card className="shadow-xl border-0 bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-5 px-6">
              <CardTitle className="flex items-center text-lg font-bold">
                <Eye className="h-5 w-5 mr-2" /> Gaze & Attention Report
              </CardTitle>
              <CardDescription className="text-indigo-100 text-sm">
                How focused were you during the interview?
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <ScoreRing score={gazeReport.attentionScore} max={100} label="Attention Score" />
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { icon: <Activity className="w-4 h-4 text-indigo-500" />, label: 'Total Time',  value: formatTime(gazeReport.totalTime) },
                    { icon: <Eye      className="w-4 h-4 text-green-500"  />, label: 'On Screen',   value: formatTime(gazeReport.onScreenTime),
                      sub: gazeReport.totalTime > 0 ? `${Math.round((gazeReport.onScreenTime / gazeReport.totalTime) * 100)}%` : '—' },
                    { icon: <EyeOff   className="w-4 h-4 text-red-400"   />, label: 'Off Screen',  value: formatTime(gazeReport.offScreenTime),
                      sub: gazeReport.totalTime > 0 ? `${Math.round((gazeReport.offScreenTime / gazeReport.totalTime) * 100)}%` : '—' },
                    { icon: <span className="text-base">👀</span>,            label: 'Look-aways',  value: `${gazeReport.lookAwayCount}×` },
                    { icon: <Zap      className="w-4 h-4 text-yellow-500" />, label: 'Blinks',      value: String(gazeReport.blinkCount) },
                    { icon: <span className="text-base">🎯</span>,            label: 'Final Pose',  value: gazeReport.headPose },
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide">
                        {stat.icon} {stat.label}
                      </div>
                      <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                      {'sub' in stat && stat.sub && <p className="text-xs text-gray-400">{stat.sub}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50">
                <p className="text-sm font-semibold text-indigo-700 mb-2">💡 Gaze Tips</p>
                <ul className="text-sm text-indigo-600 space-y-1">
                  {gazeReport.attentionScore < 80 && <li>• Maintain eye contact with the camera throughout the interview.</li>}
                  {gazeReport.lookAwayCount > 3   && <li>• You looked away {gazeReport.lookAwayCount} times — practice keeping focus on screen.</li>}
                  {gazeReport.attentionScore >= 80 && gazeReport.lookAwayCount <= 3 && <li>• Great focus and eye contact! Keep it up.</li>}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pb-8">
          <Button onClick={onExit}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg py-6 text-base font-semibold">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Interviews
          </Button>
          <Button onClick={onPracticeAgain}
            className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 shadow-lg py-6 text-base font-semibold">
            <Play className="h-5 w-5 mr-2" /> Practice Again
          </Button>
        </div>

      </div>
    </div>
  );
};