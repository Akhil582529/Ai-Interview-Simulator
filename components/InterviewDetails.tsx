import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MessageSquare, Target, TrendingUp, Play, Award, Plus } from "lucide-react";
import { Interview } from '@/types/interview';
import { skillsArray, formatDate, getDifficultyLevel } from '@/utils/interviewHelpers';

interface InterviewDetailsProps {
  interview: Interview | null;
  onStartPractice: (interview: Interview) => void;
  onCreateNew: () => void;
}

export const InterviewDetails: React.FC<InterviewDetailsProps> = ({
  interview,
  onStartPractice,
  onCreateNew,
}) => {
  if (!interview) {
    return (
      <Card className="shadow-xl border-0 bg-white">
        <CardContent className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 mb-6 shadow-xl">
            <MessageSquare className="h-16 w-16 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Ready to Practice?
          </h3>
          <p className="text-gray-600 mb-8 max-w-md text-lg">
            Select an interview from your list or create a new one to start practicing 
            with AI-generated questions.
          </p>
          <Button 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg font-bold py-6 px-8 text-base"
            onClick={onCreateNew}
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Interview
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center text-2xl font-bold mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg mr-3">
                <Target className="h-6 w-6" />
              </div>
              <span>{interview.role}</span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-3 text-sm text-indigo-100 mb-4">
              <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                <Clock className="h-4 w-4 mr-2" />
                <span>{interview.experience}</span>
              </div>
              <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span>{interview.questions.length} Questions</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsArray(interview.skills).map((skill, index) => (
                <Badge key={index} className="bg-white/20 backdrop-blur-sm text-white border-0 hover:bg-white/30 font-medium">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            onClick={() => onStartPractice(interview)}
            className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg font-bold py-6 px-6 whitespace-nowrap"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Practice
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100">
          <h3 className="font-bold text-xl mb-6 text-gray-900 flex items-center">
            <div className="bg-indigo-600 p-2 rounded-lg mr-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Interview Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Total Questions</p>
                  <p className="text-2xl font-bold text-indigo-600">{interview.questions.length}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Duration</p>
                  <p className="text-2xl font-bold text-purple-600">{interview.questions.length * 3}-{interview.questions.length * 5} min</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-pink-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Difficulty</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {getDifficultyLevel(interview.experience)}
                  </p>
                </div>
                <div className="bg-pink-100 p-3 rounded-lg">
                  <Award className="h-6 w-6 text-pink-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Created on</p>
            <p className="text-gray-900 font-semibold">{formatDate(interview.createdAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};