"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Upload, FileText, Briefcase, ArrowRight, Loader2, CheckCircle, AlertCircle, Sparkles, BookOpen } from "lucide-react";

const HomePage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    success: boolean;
    job_titles?: string[];
    extracted_skills?: string[];
  } | null>(null);
  const [error, setError] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('');
  const [isStartingInterview, setIsStartingInterview] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (validTypes.includes(uploadedFile.type)) {
        setFile(uploadedFile);
        setError('');
        setAnalysisResult(null);
      } else {
        setError('Please upload a PDF, DOCX, or TXT file');
        setFile(null);
      }
    }
  };

  const analyzeResume = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisResult(result);
      } else {
        setError(result.error || 'Failed to analyze resume');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Resume analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startInterviewWithJobTitle = async (jobTitle: string) => {
    setIsStartingInterview(true);
    setError('');
    
    try {
      const interviewData = {
        role: jobTitle,
        experience: '3 Years',
        skills: analysisResult?.extracted_skills?.join(', ') || '',
        isRecommended: true,
        autoCreate: true,
      };

      localStorage.setItem('pendingInterview', JSON.stringify(interviewData));
      window.location.href = '/interview?autoCreate=true';
      
    } catch (err) {
      setError('Failed to start interview. Please try again.');
      console.error('Interview creation error:', err);
      setIsStartingInterview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Interview Generator
              </h1>
            </div>
            <Link href="/interview">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg font-semibold">
                <BookOpen className="h-4 w-4 mr-2" />
                My Interviews
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="max-w-5xl w-full mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Interview Practice</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Ace Your Next Interview
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your resume for personalized recommendations, or start practicing right away with AI-generated questions.
            </p>
          </div>

          {/* Resume Upload Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Upload Your Resume</h3>
              <span className="ml-3 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">Optional</span>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-10 text-center mb-6 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.docx,.txt"
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <div className="bg-indigo-100 group-hover:bg-indigo-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">
                  PDF, DOCX, or TXT (max 16MB)
                </p>
              </label>
            </div>

            {file && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">Ready to analyze</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setAnalysisResult(null);
                    setError('');
                  }}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <Button
              onClick={analyzeResume}
              disabled={!file || isAnalyzing}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-6 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none text-base"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <Briefcase className="w-5 h-5 mr-2" />
                  Analyze & Get Recommendations
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          {analysisResult && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-xl border border-green-200 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Perfect Match! 🎯</h3>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Recommended Roles for You:
                </h4>
                <div className="grid gap-3">
                  {analysisResult.job_titles?.map((title, index) => (
                    <label 
                      key={index} 
                      className={`flex items-center cursor-pointer group ${
                        selectedJobTitle === title ? 'scale-[1.02]' : ''
                      } transition-transform`}
                    >
                      <input
                        type="radio"
                        name="jobTitle"
                        value={title}
                        checked={selectedJobTitle === title}
                        onChange={(e) => setSelectedJobTitle(e.target.value)}
                        className="mr-4 w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                        disabled={isStartingInterview}
                      />
                      <div className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all ${
                        selectedJobTitle === title 
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                          : 'bg-white text-gray-700 group-hover:bg-gray-50 border border-gray-200'
                      }`}>
                        {title}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {analysisResult.extracted_skills && (
                <div className="mb-6 bg-white rounded-2xl p-6 border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg text-sm mr-2">
                      {analysisResult.extracted_skills.length}
                    </span>
                    Skills Detected
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.extracted_skills.slice(0, 15).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-100"
                      >
                        {skill}
                      </span>
                    ))}
                    {analysisResult.extracted_skills.length > 15 && (
                      <span className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium">
                        +{analysisResult.extracted_skills.length - 15} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={() => selectedJobTitle && startInterviewWithJobTitle(selectedJobTitle)}
                disabled={!selectedJobTitle || isStartingInterview}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-6 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none text-base"
              >
                {isStartingInterview ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Your Interview...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Start Interview: {selectedJobTitle || 'Selected Role'}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Direct Entry Option */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Skip to Practice
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Already know your target role? Jump straight into interview practice.
              </p>
              <Link href="/interview">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all inline-flex items-center text-base">
                  <Play className="h-5 w-5 mr-2" />
                  Start General Interview
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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

export default HomePage;