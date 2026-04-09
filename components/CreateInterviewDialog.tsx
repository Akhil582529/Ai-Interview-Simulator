import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Briefcase, Clock, Code, Lightbulb, Loader2, Target } from "lucide-react";

interface CreateInterviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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

export const CreateInterviewDialog: React.FC<CreateInterviewDialogProps> = ({
  isOpen,
  onOpenChange,
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg font-semibold">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">New Interview</span>
          <span className="sm:hidden">New</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold text-gray-900">
            <Target className="h-6 w-6 text-indigo-600 mr-2" />
            Create New Interview
          </DialogTitle>
        </DialogHeader>
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        <div className="grid gap-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center text-gray-900 font-semibold">
              <Briefcase className="h-4 w-4 text-indigo-600 mr-2" />
              Job Role
            </Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
              className="bg-white text-gray-900 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience" className="flex items-center text-gray-900 font-semibold">
              <Clock className="h-4 w-4 text-indigo-600 mr-2" />
              Experience Level
            </Label>
            <Input
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 3 years, Senior Level"
              className="bg-white text-gray-900 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills" className="flex items-center text-gray-900 font-semibold">
              <Code className="h-4 w-4 text-indigo-600 mr-2" />
              Key Skills
            </Label>
            <Textarea
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, TypeScript, Node.js"
              className="bg-white text-gray-900 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 min-h-[100px]"
            />
            <p className="text-xs text-gray-500">Separate skills with commas</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button 
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 font-semibold"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};