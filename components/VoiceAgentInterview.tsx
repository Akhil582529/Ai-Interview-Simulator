import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Interview, InterviewSession } from '@/types/interview';
import { useVoiceAgent } from '@/utils/useVoiceAgent';

interface VoiceAgentInterviewProps {
  interview: Interview;
  session: InterviewSession;
  onAnswerChange: (questionIndex: number, answer: string) => void;
  onFinish: () => void;
  onExit: () => void;
}

export const VoiceAgentInterview: React.FC<VoiceAgentInterviewProps> = ({
  interview,
  session,
  onAnswerChange,
  onFinish,
  onExit,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conversationStarted, setConversationStarted] = useState(false);
  
  const {
    isConnected,
    isAgentSpeaking,
    isUserSpeaking,
    transcript,
    error,
    connect,
    disconnect,
    interrupt,
    sendMessage,
    currentVoice,
  } = useVoiceAgent();

  const currentQuestion = interview.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / interview.questions.length) * 100;

  // Start conversation when connected
  useEffect(() => {
    if (isConnected && !conversationStarted) {
      setConversationStarted(true);
      // Send first question
      const greeting = `Hello! I'm conducting an interview for the ${interview.role} position. Let's begin. ${currentQuestion}`;
      sendMessage(greeting);
    }
  }, [isConnected, conversationStarted, currentQuestion, interview.role, sendMessage]);

  // Handle connecting
  const handleConnect = async () => {
    await connect();
  };

  // Handle disconnecting
  const handleDisconnect = () => {
    disconnect();
    setConversationStarted(false);
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < interview.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      const nextQuestion = interview.questions[nextIndex];
      sendMessage(`Great, thank you. Next question: ${nextQuestion}`);
    }
  };

  // Finish interview
  const handleFinishInterview = () => {
    sendMessage("Thank you for completing the interview. We'll be in touch soon!");
    setTimeout(() => {
      disconnect();
      onFinish();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl border-0 bg-white">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center text-xl md:text-2xl font-bold">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3">
                  <Phone className="h-5 w-5" />
                </div>
                <span className="truncate">AI Voice Interview: {interview.role}</span>
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
                <span>Question {currentQuestionIndex + 1} of {interview.questions.length}</span>
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
            {/* Connection Status */}
            <div className="flex items-center justify-center gap-4">
              {!isConnected ? (
                <Button
                  onClick={handleConnect}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg font-bold py-6 px-8 text-lg"
                  size="lg"
                >
                  <Phone className="h-6 w-6 mr-3" />
                  Start Voice Interview
                </Button>
              ) : (
                <Button
                  onClick={handleDisconnect}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg font-bold py-6 px-8 text-lg"
                  size="lg"
                >
                  <PhoneOff className="h-6 w-6 mr-3" />
                  End Interview
                </Button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Status Indicators */}
            {isConnected && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Connection Status */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Connection</p>
                      <p className="text-lg font-bold text-green-600">Connected</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* AI Speaking Status */}
                <div className={`border-2 rounded-xl p-4 transition-all ${
                  isAgentSpeaking 
                    ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">AI Interviewer</p>
                      <p className={`text-lg font-bold ${isAgentSpeaking ? 'text-purple-600' : 'text-gray-400'}`}>
                        {isAgentSpeaking ? 'Speaking...' : 'Listening'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${isAgentSpeaking ? 'bg-purple-100' : 'bg-gray-200'}`}>
                      {isAgentSpeaking ? (
                        <Volume2 className="h-6 w-6 text-purple-600 animate-pulse" />
                      ) : (
                        <VolumeX className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* User Speaking Status */}
                <div className={`border-2 rounded-xl p-4 transition-all ${
                  isUserSpeaking 
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">You</p>
                      <p className={`text-lg font-bold ${isUserSpeaking ? 'text-blue-600' : 'text-gray-400'}`}>
                        {isUserSpeaking ? 'Speaking...' : 'Quiet'}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${isUserSpeaking ? 'bg-blue-100' : 'bg-gray-200'}`}>
                      {isUserSpeaking ? (
                        <Mic className="h-6 w-6 text-blue-600 animate-pulse" />
                      ) : (
                        <MicOff className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Question Display */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl p-6">
              <div className="flex items-start">
                <div className="bg-indigo-600 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  {currentQuestionIndex + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-500 text-sm mb-2">CURRENT QUESTION</h3>
                  <p className="text-gray-900 text-lg leading-relaxed font-medium">
                    {currentQuestion}
                  </p>
                </div>
              </div>
            </div>

            {/* Conversation Transcript */}
            {transcript && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900">Conversation Transcript</h3>
                </div>
                <div className="max-h-60 overflow-y-auto bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {transcript}
                  </pre>
                </div>
              </div>
            )}

            {/* Controls */}
            {isConnected && (
              <div className="flex flex-wrap gap-3 justify-center">
                {isAgentSpeaking && (
                  <Button
                    onClick={interrupt}
                    variant="outline"
                    className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <VolumeX className="h-4 w-4 mr-2" />
                    Interrupt AI
                  </Button>
                )}

                {currentQuestionIndex < interview.questions.length - 1 && (
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                  >
                    Next Question
                    <span className="ml-2">→</span>
                  </Button>
                )}

                {currentQuestionIndex === interview.questions.length - 1 && (
                  <Button
                    onClick={handleFinishInterview}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Complete Interview
                  </Button>
                )}
              </div>
            )}

            {/* Instructions */}
            {!isConnected && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  How it works
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">1.</span>
                    <span>Click "Start Voice Interview" to connect with the AI interviewer</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">2.</span>
                    <span>Allow microphone access when prompted</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">3.</span>
                    <span>The AI will ask you questions - just speak naturally</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">4.</span>
                    <span>The AI will listen and respond in real-time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">5.</span>
                    <span>Move through questions at your own pace</span>
                  </li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};