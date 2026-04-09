import whisper
import os

# Load model once (IMPORTANT)
model = whisper.load_model("turbo")

def speech_to_text(audio_path):
    try:
        result = model.transcribe(audio_path)
        return result["text"].strip()
    except Exception as e:
        print("Whisper Error:", e)
        return ""
