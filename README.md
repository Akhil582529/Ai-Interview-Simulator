# 🎙️ AI-Powered Interview Preparation System
Link - https://ai-interview-simulator-five-peach.vercel.app

> A full-stack, voice-driven interview practice platform with real-time gaze tracking, adaptive AI feedback, and resume-based job role prediction.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase-9-orange?logo=firebase)](https://firebase.google.com)

---

## ✨ Features

- 🎤 **Voice-Only Interview Mode** — AI interviewer speaks questions via ElevenLabs TTS; you answer using your microphone
- 👁️ **Real-Time Gaze Tracking** — MediaPipe FaceMesh monitors your eye contact, head pose, blink rate, and attention score live via webcam
- 🤖 **AI Question Generation** — Google Gemini 2.5 Flash generates role-specific interview questions tailored to your experience and skills
- 📊 **Structured Feedback Dashboard** — Per-question scoring (good/partial/poor/unanswered), overall rating, strengths, improvements, and tips
- 📄 **Resume Analysis** — Upload your resume (PDF/DOCX/TXT) to get job role predictions using TF-IDF cosine similarity
- 🔁 **Smart Deduplication** — Semantic normalisation removes duplicate job role recommendations
- 🔐 **Secure Architecture** — All API keys stay server-side; Firebase authentication for user sessions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, TypeScript, Tailwind CSS |
| AI — Questions & Feedback | Google Gemini 2.5 Flash |
| Text-to-Speech | ElevenLabs (`eleven_turbo_v2_5`) |
| Speech-to-Text | ElevenLabs Scribe v1 |
| Gaze Tracking | Google MediaPipe FaceMesh |
| Resume Analysis | Python, scikit-learn (TF-IDF + Cosine Similarity) |
| Auth & Database | Firebase Auth + Firestore |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-interview-prep.git
cd ai-interview-prep
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install Python dependencies

```bash
pip install scikit-learn pandas numpy PyPDF2 python-docx
```

### 4. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id

# OpenAI (for voice agent mode)
OPENAI_API_KEY=your_openai_api_key

# Firebase (Client-side — must have NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_MESSAGING_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
ai-interview-prep/
├── app/
│   ├── (auth)/              # Sign in / Sign up pages
│   ├── (root)/
│   │   └── interview/       # Main interview page
│   └── api/                 # Server-side API routes
│       ├── analyze-resume/
│       ├── elevenlabs-stt/
│       ├── generate-feedback/
│       ├── generate-interview/
│       └── text-to-speech/
├── components/
│   ├── PracticeMode.tsx     # Voice interview UI
│   ├── GazeTracker.tsx      # Webcam + gaze overlay
│   ├── FeedbackScreen.tsx   # Results dashboard
│   └── ...
├── python/
│   ├── resume_analyzer.py   # TF-IDF job role prediction
│   ├── pdfparser.py         # Resume skill extraction
│   └── analyze_wrapper.py   # Python subprocess entry point
├── data/
│   └── IT_Job_Roles_Skills.csv  # Job roles dataset (493 entries)
├── services/
│   ├── interviewService.ts
│   └── elevenLabsService.ts
└── utils/
    ├── useGazeTracking.ts   # MediaPipe gaze hook
    ├── useSpeechToText.ts   # ElevenLabs STT hook
    └── useTextToSpeech.ts   # ElevenLabs TTS hook
```

---

## 🎯 How It Works

1. **Upload Resume** → Python extracts skills → TF-IDF model predicts top 5 matching job roles
2. **Select Role** → Gemini generates 10 tailored interview questions
3. **Start Interview** → "Ready for Voice Interview" modal appears
4. **Voice Interview Begins** → ElevenLabs reads each question aloud → MediaPipe starts tracking gaze
5. **Answer via Mic** → ElevenLabs STT transcribes your spoken answer
6. **Finish** → Gemini analyses all answers → Structured feedback dashboard rendered
7. **Review** → See per-question scores, strengths, improvements, tips + gaze attention report

---

## 📊 Model Performance

| Metric | Result |
|--------|--------|
| Resume Analysis Top-5 Accuracy | 89.1% |
| Precision@5 | 87.6% |
| Dataset Size (Raw) | 493 entries |
| After Deduplication | 338 unique roles |
| TTS Average Latency | ~425ms |
| Gaze Tracking Frame Rate | 20–30 FPS |

---

## ⚙️ API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/generate-interview` | POST | Generate interview questions via Gemini |
| `/api/generate-feedback` | POST | Get structured feedback via Gemini |
| `/api/text-to-speech` | POST | Convert question text to audio |
| `/api/elevenlabs-stt` | POST | Transcribe spoken answer to text |
| `/api/analyze-resume` | POST | Analyse resume and predict job roles |

---

## 🌐 Deployment

This project is deployed on **Vercel**.

> ⚠️ **Note:** The resume analysis feature (Python subprocess) is not available in the deployed version as Vercel does not support Python runtimes. Users can manually enter their role and skills instead.

To deploy your own instance:

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy!

---

## 🔒 Environment Variables on Vercel

Make sure to add all variables from `.env.local` to your Vercel project settings. Client-side Firebase variables **must** have the `NEXT_PUBLIC_` prefix to be accessible in the browser.


## 🙏 Acknowledgements

- [Google Gemini](https://ai.google.dev) for LLM capabilities
- [ElevenLabs](https://elevenlabs.io) for TTS and STT
- [Google MediaPipe](https://mediapipe.dev) for FaceMesh
- [Vercel](https://vercel.com) for hosting
- Amity University Noida for academic support
