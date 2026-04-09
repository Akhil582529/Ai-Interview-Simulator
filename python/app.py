from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import traceback
import PyPDF2
import docx
from resume_analyzer import ResumeAnalyzer
import pdfparser

app = Flask(__name__)
CORS(app)

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# Initialize Resume Analyzer
try:
    print("Initializing Resume Analyzer...")
    resume_analyzer = ResumeAnalyzer('/Users/akhilsuryan/Desktop/ai-project/data/IT_Job_Roles_Skills.csv')
    print("Resume Analyzer initialized successfully!")
except Exception as e:
    print(f"Error initializing Resume Analyzer: {e}")
    resume_analyzer = None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file):
    """Extract text from uploaded file based on file type"""
    filename = file.filename.lower()
    file_content = file.read()
    
    try:
        if filename.endswith('.pdf'):
            # Try pdfparser first, fallback to PyPDF2
            try:
                skills, extracted_text = pdfparser.skills_extraction_from_uploaded_file(file_content, filename)
                if extracted_text.strip():
                    return extracted_text, skills
            except Exception as e:
                print(f"pdfparser failed, using PyPDF2: {e}")
            
            # Fallback to PyPDF2
            file_stream = io.BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(file_stream)
            text = "\n".join(page.extract_text() or "" for page in pdf_reader.pages).strip()
            return text, []
            
        elif filename.endswith('.docx'):
            file_stream = io.BytesIO(file_content)
            doc = docx.Document(file_stream)
            text = "\n".join(paragraph.text for paragraph in doc.paragraphs).strip()
            skills = pdfparser.skills_extraction_from_text(text) if text else []
            return text, skills
            
        elif filename.endswith('.txt'):
            text = file_content.decode('utf-8').strip()
            skills = pdfparser.skills_extraction_from_text(text) if text else []
            return text, skills
            
    except Exception as e:
        print(f"Error processing file {filename}: {e}")
    
    return "", []

@app.route('/api/analyze-resume', methods=['POST'])
def analyze_resume():
    if resume_analyzer is None:
        return jsonify({"error": "Resume analyzer not initialized"}), 500
    
    try:
        # Validate file upload
        if 'resume' not in request.files:
            return jsonify({"error": "No resume file provided"}), 400
        
        file = request.files['resume']
        if not file.filename:
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Please upload PDF, DOCX, or TXT files only"}), 400

        # Extract text and skills from file
        print(f"Processing file: {file.filename}")
        resume_text, extracted_skills = extract_text_from_file(file)
        
        if not resume_text.strip():
            return jsonify({"error": "Could not extract text from the resume"}), 400

        # Extract skills from text if not already extracted
        if not extracted_skills:
            print("Extracting skills from text...")
            extracted_skills = pdfparser.skills_extraction_from_text(resume_text)
        
        if not extracted_skills:
            return jsonify({"error": "No recognizable skills found in the resume"}), 400

        # Get parameters and analyze
        top_n = int(request.form.get('top_n', 5))
        threshold = float(request.form.get('threshold', 0.1))
        
        top_matches = resume_analyzer.top_job_roles(extracted_skills, top_n=top_n, threshold=threshold)
        job_titles = [title for title, _ in top_matches]

        return jsonify({
            "success": True,
            "job_titles": job_titles
        })

    except Exception as e:
        print(f"Error processing resume: {e}")
        print(traceback.format_exc())
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050)