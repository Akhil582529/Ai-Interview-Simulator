// import React, { useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { 
//   Play, 
//   ArrowRight, 
//   ArrowLeft, 
//   CheckCircle, 
//   Loader2,
//   MessageSquare,
//   Mic,
//   MicOff,
//   Volume2,
//   VolumeX,
//   Pause,
//   RotateCcw
// } from "lucide-react";
// import { Interview, InterviewSession } from '@/types/interview';
// import { useTextToSpeech } from '@/utils/useTextToSpeech';

// interface PracticeModeProps {
//   interview: Interview;
//   session: InterviewSession;
//   currentAnswer: string;
//   onAnswerChange: (value: string) => void;
//   onNext: () => void;
//   onPrevious: () => void;
//   onFinish: () => void;
//   onExit: () => void;
//   isGeneratingFeedback: boolean;
//   isRecording: boolean;
//   isProcessing: boolean;
//   speechError: string | null;
//   onMicToggle: () => void;
// }

// export const PracticeMode: React.FC<PracticeModeProps> = ({
//   interview,
//   session,
//   currentAnswer,
//   onAnswerChange,
//   onNext,
//   onPrevious,
//   onFinish,
//   onExit,
//   isGeneratingFeedback,
//   isRecording,
//   isProcessing,
//   speechError,
//   onMicToggle,
// }) => {
//   const currentQuestion = interview.questions[session.currentQuestionIndex];
//   const progress = ((session.currentQuestionIndex + 1) / interview.questions.length) * 100;
  
//   // Text-to-speech hook for reading questions
//   const {
//     isSpeaking,
//     isPaused,
//     speak,
//     pause,
//     resume,
//     stop,
//     isSupported: ttsSupported,
//   } = useTextToSpeech();

//   // Auto-read question when it changes (optional - you can remove this if you want manual control)
//   useEffect(() => {
//     // Optionally auto-read the question when moving to a new one
//     // Comment out if you want users to manually click the speaker button
//     // speak(currentQuestion);
    
//     // Cleanup: stop speaking when component unmounts or question changes
//     return () => {
//       stop();
//     };
//   }, [session.currentQuestionIndex]);

//   const handleSpeakQuestion = () => {
//     if (isSpeaking && !isPaused) {
//       pause();
//     } else if (isPaused) {
//       resume();
//     } else {
//       speak(currentQuestion);
//     }
//   };

//   const handleStopSpeaking = () => {
//     stop();
//   };

//   const handleNextWithStop = () => {
//     stop(); // Stop speaking when moving to next question
//     onNext();
//   };

//   const handlePreviousWithStop = () => {
//     stop(); // Stop speaking when moving to previous question
//     onPrevious();
//   };

//   const handleExitWithStop = () => {
//     stop(); // Stop speaking when exiting
//     onExit();
//   };
  
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
//       <div className="max-w-4xl mx-auto">
//         <Card className="shadow-2xl border-0 bg-white">
//           <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
//             <div className="flex items-center justify-between mb-4">
//               <CardTitle className="flex items-center text-xl md:text-2xl font-bold">
//                 <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3">
//                   <Play className="h-5 w-5" />
//                 </div>
//                 <span className="truncate">{interview.role}</span>
//               </CardTitle>
//               <Button 
//                 onClick={handleExitWithStop}
//                 className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
//                 size="sm"
//               >
//                 Exit
//               </Button>
//             </div>
//             <div className="space-y-2">
//               <div className="flex justify-between text-sm text-white/90 font-medium">
//                 <span>Question {session.currentQuestionIndex + 1} of {interview.questions.length}</span>
//                 <span>{Math.round(progress)}% Complete</span>
//               </div>
//               <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
//                 <div 
//                   className="bg-white h-3 rounded-full transition-all duration-500 shadow-lg"
//                   style={{ width: `${progress}%` }}
//                 ></div>
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent className="p-6 md:p-8 space-y-6">
//             <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl p-6">
//               <div className="flex items-start justify-between">
//                 <div className="flex items-start flex-1">
//                   <div className="bg-indigo-600 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
//                     {session.currentQuestionIndex + 1}
//                   </div>
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-gray-500 text-sm mb-2">QUESTION</h3>
//                     <p className="text-gray-900 text-lg leading-relaxed font-medium">
//                       {currentQuestion}
//                     </p>
//                   </div>
//                 </div>
                
//                 {/* Text-to-Speech Controls */}
//                 {ttsSupported && (
//                   <div className="flex gap-2 ml-4">
//                     {isSpeaking ? (
//                       <>
//                         <Button
//                           onClick={handleSpeakQuestion}
//                           className={`${
//                             isPaused 
//                               ? 'bg-green-600 hover:bg-green-700' 
//                               : 'bg-orange-600 hover:bg-orange-700'
//                           } text-white shadow-md`}
//                           size="sm"
//                           title={isPaused ? "Resume reading" : "Pause reading"}
//                         >
//                           {isPaused ? (
//                             <Play className="h-4 w-4" />
//                           ) : (
//                             <Pause className="h-4 w-4" />
//                           )}
//                         </Button>
//                         <Button
//                           onClick={handleStopSpeaking}
//                           className="bg-red-600 hover:bg-red-700 text-white shadow-md"
//                           size="sm"
//                           title="Stop reading"
//                         >
//                           <VolumeX className="h-4 w-4" />
//                         </Button>
//                       </>
//                     ) : (
//                       <Button
//                         onClick={handleSpeakQuestion}
//                         className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
//                         size="sm"
//                         title="Read question aloud"
//                       >
//                         <Volume2 className="h-4 w-4" />
//                       </Button>
//                     )}
//                   </div>
//                 )}
//               </div>
              
//               {/* Show indicator when question is being read */}
//               {isSpeaking && !isPaused && (
//                 <div className="mt-4 flex items-center gap-2 p-3 bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg">
//                   <Volume2 className="h-4 w-4 animate-pulse" />
//                   <span className="text-sm font-medium">Reading question aloud...</span>
//                 </div>
//               )}
//             </div>
            
//             <div className="space-y-3">
//               <Label htmlFor="answer" className="text-base font-semibold text-gray-900 flex items-center justify-between">
//                 <span className="flex items-center">
//                   <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
//                   Your Answer
//                 </span>
//                 <Button
//                   type="button"
//                   onClick={onMicToggle}
//                   disabled={isProcessing}
//                   className={`${
//                     isRecording 
//                       ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
//                       : 'bg-indigo-600 hover:bg-indigo-700'
//                   } text-white shadow-md transition-all duration-300`}
//                   size="sm"
//                 >
//                   {isProcessing ? (
//                     <>
//                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                       Processing...
//                     </>
//                   ) : isRecording ? (
//                     <>
//                       <MicOff className="h-4 w-4 mr-2" />
//                       Stop Recording
//                     </>
//                   ) : (
//                     <>
//                       <Mic className="h-4 w-4 mr-2" />
//                       Voice Answer
//                     </>
//                   )}
//                 </Button>
//               </Label>
              
//               {speechError && (
//                 <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
//                   {speechError}
//                 </div>
//               )}
              
//               {isRecording && (
//                 <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
//                   <Volume2 className="h-4 w-4 animate-pulse" />
//                   <span className="text-sm font-medium">Recording... Speak clearly into your microphone</span>
//                 </div>
//               )}
              
//               <Textarea
//                 id="answer"
//                 value={currentAnswer}
//                 onChange={(e) => onAnswerChange(e.target.value)}
//                 placeholder="Type your answer here or use the voice button to speak your answer..."
//                 className="min-h-[200px] bg-white text-gray-900 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl text-base resize-none"
//                 disabled={isRecording || isProcessing}
//               />
//               <p className="text-sm text-gray-500">{currentAnswer.length} characters</p>
//             </div>
            
//             <div className="flex justify-between pt-4">
//               <Button
//                 onClick={handlePreviousWithStop}
//                 disabled={session.currentQuestionIndex === 0}
//                 className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold py-6 px-6"
//               >
//                 <ArrowLeft className="h-5 w-5 mr-2" />
//                 Previous
//               </Button>
//               {session.currentQuestionIndex === interview.questions.length - 1 ? (
//                 <Button
//                   onClick={onFinish}
//                   disabled={isGeneratingFeedback}
//                   className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg font-semibold py-6 px-6"
//                 >
//                   {isGeneratingFeedback ? (
//                     <>
//                       <Loader2 className="h-5 w-5 mr-2 animate-spin" />
//                       Analyzing...
//                     </>
//                   ) : (
//                     <>
//                       Finish & Get Feedback
//                       <CheckCircle className="h-5 w-5 ml-2" />
//                     </>
//                   )}
//                 </Button>
//               ) : (
//                 <Button
//                   onClick={handleNextWithStop}
//                   className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg font-semibold py-6 px-6"
//                 >
//                   Next Question
//                   <ArrowRight className="h-5 w-5 ml-2" />
//                 </Button>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause
} from "lucide-react";
import { Interview, InterviewSession } from '@/types/interview';
import { useTextToSpeech } from '@/utils/useTextToSpeech';

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
}

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
}) => {
  const currentQuestion = interview.questions[session.currentQuestionIndex];
  const progress = ((session.currentQuestionIndex + 1) / interview.questions.length) * 100;
  
  const {
    speak,
    stop: stopSpeaking,
    pause: pauseSpeaking,
    resume: resumeSpeaking,
    isPlaying,
    isLoading: isSpeechLoading,
    error: speechTTSError,
  } = useTextToSpeech();

  // Auto-play question when it changes (optional feature)
  useEffect(() => {
    // You can enable auto-play by uncommenting the line below
    // speak(currentQuestion);
    
    // Cleanup: stop speaking when component unmounts or question changes
    return () => {
      stopSpeaking();
    };
  }, [session.currentQuestionIndex]);

  const handleSpeakQuestion = () => {
    if (isPlaying) {
      pauseSpeaking();
    } else if (currentQuestion) {
      speak(currentQuestion);
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl border-0 bg-white">
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
                ></div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
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
                
                {/* Text-to-Speech Controls */}
                <div className="flex gap-2 ml-4">
                  {isPlaying ? (
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
                        onClick={handleStopSpeaking}
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
                      onClick={handleSpeakQuestion}
                      disabled={isSpeechLoading}
                      className="bg-green-500 hover:bg-green-600 text-white shadow-md"
                      size="sm"
                      title="Listen to question"
                    >
                      {isSpeechLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* TTS Error Display */}
              {speechTTSError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {speechTTSError}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="answer" className="text-base font-semibold text-gray-900 flex items-center justify-between">
                <span className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
                  Your Answer
                </span>
                <Button
                  type="button"
                  onClick={onMicToggle}
                  disabled={isProcessing}
                  className={`${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white shadow-md transition-all duration-300`}
                  size="sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isRecording ? (
                    <>
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Voice Answer
                    </>
                  )}
                </Button>
              </Label>
              
              {speechError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {speechError}
                </div>
              )}
              
              {isRecording && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">Recording... Speak clearly into your microphone</span>
                </div>
              )}
              
              <Textarea
                id="answer"
                value={currentAnswer}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="Type your answer here or use the voice button to speak your answer..."
                className="min-h-[200px] bg-white text-gray-900 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl text-base resize-none"
                disabled={isRecording || isProcessing}
              />
              <p className="text-sm text-gray-500">{currentAnswer.length} characters</p>
            </div>
            
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
                  onClick={onFinish}
                  disabled={isGeneratingFeedback}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg font-semibold py-6 px-6"
                >
                  {isGeneratingFeedback ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Finish & Get Feedback
                      <CheckCircle className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={onNext}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg font-semibold py-6 px-6"
                >
                  Next Question
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};