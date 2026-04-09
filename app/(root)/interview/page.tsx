"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSpeechToText } from "@/utils/useSpeechToText";
import { Interview, InterviewSession } from '@/types/interview';
import { parseQuestionsFromText } from '@/utils/interviewHelpers';
import { generateInterview, generateFeedback } from '@/services/interviewService';
import { Header } from '@/components/Header';
import { InterviewList } from '@/components/InterviewList';
import { InterviewDetails } from '@/components/InterviewDetails';
import { PracticeMode } from '@/components/PracticeMode';
import { VoiceAgentInterview } from '@/components/VoiceAgentInterview';
import { FeedbackScreen } from '@/components/FeedbackScreen';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { GazeMetrics } from '@/utils/useGazeTracking';
import { StructuredFeedback } from '@/services/interviewService';

const Page = () => {
  const searchParams = useSearchParams();
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [gazeReport, setGazeReport] = useState<GazeMetrics | null>(null);
  const [structuredFeedback, setStructuredFeedback] = useState<StructuredFeedback | null>(null);
  
  // Toggle between regular practice and voice agent
  const [useVoiceAgent, setUseVoiceAgent] = useState(false);

  // ── Refs to avoid stale closures in transcript handler ──────────────────
  const currentAnswerRef = useRef(currentAnswer);
  const currentSessionRef = useRef(currentSession);

  useEffect(() => { currentAnswerRef.current = currentAnswer; }, [currentAnswer]);
  useEffect(() => { currentSessionRef.current = currentSession; }, [currentSession]);

  // Speech-to-text hook
  const {
    isRecording,
    isProcessing,
    transcript,
    error: speechError,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useSpeechToText();

  // ── Fix: use refs so we always read the latest answer/session ───────────
  useEffect(() => {
    if (!transcript) return;

    const latestAnswer  = currentAnswerRef.current;
    const latestSession = currentSessionRef.current;

    const updated = latestAnswer
      ? latestAnswer + ' ' + transcript
      : transcript;

    // Update displayed answer
    setCurrentAnswer(updated);

    // Save into session answers array at the correct question index
    if (latestSession) {
      const newAnswers = [...latestSession.answers];
      newAnswers[latestSession.currentQuestionIndex] = updated;
      setCurrentSession({ ...latestSession, answers: newAnswers });
    }

    resetTranscript();
  }, [transcript]);

  useEffect(() => {
    const autoCreate = searchParams.get('autoCreate');
    if (autoCreate === 'true') {
      handleAutoCreateInterview();
    }
  }, [searchParams]);

  const handleAutoCreateInterview = async () => {
    const pendingData = localStorage.getItem('pendingInterview');
    if (!pendingData) return;

    try {
      const data = JSON.parse(pendingData);
      setIsAutoCreating(true);
      
      const result = await generateInterview(
        data.role,
        data.experience,
        data.skills,
        data.isRecommended
      );
      
      const questions = parseQuestionsFromText(result.questions);

      const newInterview: Interview = {
        id: Date.now().toString(),
        role: data.role,
        experience: data.experience,
        skills: data.skills,
        questions,
        createdAt: new Date()
      };

      setInterviews(prev => [newInterview, ...prev]);
      setSelectedInterview(newInterview);
      startPracticeInterview(newInterview, false);
      localStorage.removeItem('pendingInterview');
    } catch (err) {
      console.error('Auto-create error:', err);
      setError('Failed to create interview automatically');
    } finally {
      setIsAutoCreating(false);
    }
  };

  const handleSave = async () => {
    if (!role.trim() || !experience.trim() || !skills.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await generateInterview(role, experience, skills);
      const questions = parseQuestionsFromText(data.questions);

      const newInterview: Interview = {
        id: Date.now().toString(),
        role,
        experience,
        skills,
        questions,
        createdAt: new Date()
      };

      setInterviews(prev => [newInterview, ...prev]);
      setSelectedInterview(newInterview);
      setRole("");
      setExperience("");
      setSkills("");
      setIsDialogOpen(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startPracticeInterview = (interview: Interview, voiceMode: boolean = false) => {
    setUseVoiceAgent(voiceMode);
    setStructuredFeedback(null);
    setGazeReport(null);
    setCurrentSession({
      interviewId: interview.id,
      currentQuestionIndex: 0,
      answers: new Array(interview.questions.length).fill(""),
      isCompleted: false
    });
    setCurrentAnswer("");
    setSelectedInterview(interview);
  };

  const handleAnswerChange = (value: string) => {
    setCurrentAnswer(value);
    if (currentSessionRef.current) {
      const newAnswers = [...currentSessionRef.current.answers];
      newAnswers[currentSessionRef.current.currentQuestionIndex] = value;
      setCurrentSession({ ...currentSessionRef.current, answers: newAnswers });
    }
  };

  // For voice agent mode
  const handleVoiceAnswerChange = (questionIndex: number, answer: string) => {
    if (currentSession) {
      const newAnswers = [...currentSession.answers];
      newAnswers[questionIndex] = answer;
      setCurrentSession({ ...currentSession, answers: newAnswers });
    }
  };

  const handleMicToggle = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const goToNextQuestion = () => {
    if (!currentSession || !selectedInterview) return;
    if (currentSession.currentQuestionIndex < selectedInterview.questions.length - 1) {
      const nextIndex = currentSession.currentQuestionIndex + 1;
      setCurrentSession({ ...currentSession, currentQuestionIndex: nextIndex });
      setCurrentAnswer(currentSession.answers[nextIndex] || "");
    }
  };

  const goToPreviousQuestion = () => {
    if (!currentSession) return;
    if (currentSession.currentQuestionIndex > 0) {
      const prevIndex = currentSession.currentQuestionIndex - 1;
      setCurrentSession({ ...currentSession, currentQuestionIndex: prevIndex });
      setCurrentAnswer(currentSession.answers[prevIndex] || "");
    }
  };

  const finishInterview = async () => {
    if (!currentSession || !selectedInterview) return;

    // Use the ref to get the very latest session answers
    const latestSession = currentSessionRef.current;
    if (!latestSession) return;

    setIsGeneratingFeedback(true);
    try {
      const data = await generateFeedback(selectedInterview, latestSession.answers);
      setStructuredFeedback(data.structured);
      setCurrentSession({
        ...latestSession,
        feedback: data.feedback,
        isCompleted: true
      });
    } catch (error) {
      setCurrentSession({
        ...latestSession,
        feedback: "Thank you for completing the interview! Unfortunately, we couldn't generate detailed feedback at this time.",
        isCompleted: true
      });
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const exitPracticeMode = () => {
    setCurrentSession(null);
    setCurrentAnswer("");
    setUseVoiceAgent(false);
    setGazeReport(null);
    setStructuredFeedback(null);
    if (isRecording) stopRecording();
  };

  const handleDeleteInterview = (id: string) => {
    setInterviews(prev => prev.filter(interview => interview.id !== id));
    if (selectedInterview?.id === id) setSelectedInterview(null);
  };

  // Loading screen
  if (isAutoCreating) return <LoadingScreen />;

  // Practice mode
  if (currentSession && selectedInterview) {
    if (currentSession.isCompleted && currentSession.feedback) {
      return (
        <FeedbackScreen
          interview={selectedInterview}
          feedback={currentSession.feedback}
          structured={structuredFeedback ?? undefined}
          onExit={exitPracticeMode}
          onPracticeAgain={() => startPracticeInterview(selectedInterview, false)}
          gazeReport={gazeReport ?? undefined}
        />
      );
    }

    if (useVoiceAgent) {
      return (
        <VoiceAgentInterview
          interview={selectedInterview}
          session={currentSession}
          onAnswerChange={handleVoiceAnswerChange}
          onFinish={finishInterview}
          onExit={exitPracticeMode}
        />
      );
    }

    return (
      <PracticeMode
        interview={selectedInterview}
        session={currentSession}
        currentAnswer={currentAnswer}
        onAnswerChange={handleAnswerChange}
        onNext={goToNextQuestion}
        onPrevious={goToPreviousQuestion}
        onFinish={finishInterview}
        onExit={exitPracticeMode}
        isGeneratingFeedback={isGeneratingFeedback}
        isRecording={isRecording}
        isProcessing={isProcessing}
        speechError={speechError}
        onMicToggle={handleMicToggle}
        onGazeReport={(metrics) => setGazeReport(metrics)}
      />
    );
  }
  
  // Main view
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header
        isDialogOpen={isDialogOpen}
        onDialogChange={setIsDialogOpen}
        role={role}
        setRole={setRole}
        experience={experience}
        setExperience={setExperience}
        skills={skills}
        setSkills={setSkills}
        onSave={handleSave}
        loading={loading}
        error={error}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <InterviewList
              interviews={interviews}
              selectedInterview={selectedInterview}
              onSelectInterview={setSelectedInterview}
              onDeleteInterview={handleDeleteInterview}
              onStartPractice={(interview) => startPracticeInterview(interview, false)}
            />
          </div>

          <div className="lg:col-span-2">
            {selectedInterview ? (
              <div className="space-y-4">
                <InterviewDetails
                  interview={selectedInterview}
                  onStartPractice={() => startPracticeInterview(selectedInterview, false)}
                  onCreateNew={() => setIsDialogOpen(true)}
                />
                
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 flex items-center">
                        <Phone className="h-6 w-6 mr-2" />
                        AI Voice Interview
                      </h3>
                      <p className="text-purple-100 mb-4">
                        Have a real conversation with an AI interviewer! Practice speaking naturally and get real-time feedback.
                      </p>
                      <ul className="space-y-2 text-sm text-purple-100">
                        <li className="flex items-center"><span className="mr-2">✓</span> Natural voice conversation</li>
                        <li className="flex items-center"><span className="mr-2">✓</span> Real-time interaction</li>
                        <li className="flex items-center"><span className="mr-2">✓</span> Practice verbal communication</li>
                      </ul>
                    </div>
                    <Button
                      onClick={() => startPracticeInterview(selectedInterview, true)}
                      className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg font-bold py-6 px-6"
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Start Voice Interview
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <InterviewDetails
                interview={null}
                onStartPractice={() => {}}
                onCreateNew={() => setIsDialogOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-100 mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600">
            AI Interview Generator • Practice makes perfect! ✨
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Page;