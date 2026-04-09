import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, MessageSquare, Trash2, Play } from "lucide-react";
import { Interview } from '@/types/interview';
import { skillsArray } from '@/utils/interviewHelpers';

interface InterviewListProps {
  interviews: Interview[];
  selectedInterview: Interview | null;
  onSelectInterview: (interview: Interview) => void;
  onDeleteInterview: (id: string) => void;
  onStartPractice: (interview: Interview) => void;
}

export const InterviewList: React.FC<InterviewListProps> = ({
  interviews,
  selectedInterview,
  onSelectInterview,
  onDeleteInterview,
  onStartPractice,
}) => {
  return (
    <Card className="shadow-xl border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardTitle className="flex items-center text-lg font-bold">
          <BookOpen className="h-5 w-5 mr-2" />
          Your Interviews
        </CardTitle>
        <CardDescription className="text-indigo-100">
          {interviews.length === 0 
            ? "No interviews yet" 
            : `${interviews.length} interview${interviews.length === 1 ? '' : 's'}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {interviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Create your first interview</p>
          </div>
        ) : (
          interviews.map((interview) => (
            <Card 
              key={interview.id} 
              className={`cursor-pointer transition-all duration-200 border-2 ${
                selectedInterview?.id === interview.id 
                  ? 'border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]' 
                  : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
              }`}
              onClick={() => onSelectInterview(interview)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-sm text-gray-900 truncate pr-2">
                    {interview.role}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteInterview(interview.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center text-xs text-gray-600 mb-3">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{interview.experience}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {skillsArray(interview.skills).slice(0, 2).map((skill, index) => (
                    <Badge key={index} className="bg-indigo-100 text-indigo-700 text-xs border-0 font-medium">
                      {skill}
                    </Badge>
                  ))}
                  {skillsArray(interview.skills).length > 2 && (
                    <Badge className="bg-gray-100 text-gray-600 text-xs border-0 font-medium">
                      +{skillsArray(interview.skills).length - 2}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-8 px-3 text-xs font-semibold shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartPractice(interview);
                    }}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};