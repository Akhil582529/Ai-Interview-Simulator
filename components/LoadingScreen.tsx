import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white shadow-2xl border-0">
        <CardContent className="flex flex-col items-center py-12 px-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl mb-6">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Creating Your Interview</h2>
          <p className="text-gray-600 text-center">
            Generating personalized questions based on your profile...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};