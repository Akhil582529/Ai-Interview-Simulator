export interface Interview {
  id: string;
  role: string;
  experience: string;
  skills: string;
  questions: string[];
  createdAt: Date;
}

export interface InterviewSession {
  interviewId: string;
  currentQuestionIndex: number;
  answers: string[];
  feedback?: string;
  isCompleted: boolean;
}