import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Sparkles } from "lucide-react";
import { CreateInterviewDialog } from './CreateInterviewDialog';
import { useTextToSpeech } from '@/utils/useTextToSpeech';
// import { VoiceSettings } from '@/components/VoiceSettings';

// const { voices, currentVoiceIndex, rate, pitch, volume, setVoice, setRate, setPitch, setVolume, speak } = useTextToSpeech();

// <VoiceSettings
//   voices={voices}
//   currentVoiceIndex={currentVoiceIndex}
//   rate={rate}
//   pitch={pitch}
//   volume={volume}
//   onVoiceChange={setVoice}
//   onRateChange={setRate}
//   onPitchChange={setPitch}
//   onVolumeChange={setVolume}
//   onTest={() => speak("This is a test of the voice settings.")}
// />

interface HeaderProps {
  isDialogOpen: boolean;
  onDialogChange: (open: boolean) => void;
  role: string;
  setRole: (role: string) => void;
  experience: string;
  setExperience: (experience: string) => void;
  skills: string;
  setSkills: (skills: string) => void;
  onSave: () => void;
  loading: boolean;
  error: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  isDialogOpen,
  onDialogChange,
  role,
  setRole,
  experience,
  setExperience,
  skills,
  setSkills,
  onSave,
  loading,
  error,
}) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Interview Generator
              </h1>
              <p className="text-xs md:text-sm text-gray-600">Practice makes perfect</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 font-semibold shadow-md">
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <CreateInterviewDialog
              isOpen={isDialogOpen}
              onOpenChange={onDialogChange}
              role={role}
              setRole={setRole}
              experience={experience}
              setExperience={setExperience}
              skills={skills}
              setSkills={setSkills}
              onSave={onSave}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
    </header>
  );
};