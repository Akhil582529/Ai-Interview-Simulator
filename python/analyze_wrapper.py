#!/usr/bin/env python3
# python/analyze_wrapper.py

import sys
import json
import os

# Add current directory to Python path
sys.path.append(os.path.dirname(__file__))

try:
    from resume_analyzer import ResumeAnalyzer
    import pdfparser
    
    def main():
        if len(sys.argv) != 3:
            print(json.dumps({"success": False, "error": "Invalid arguments"}))
            sys.exit(1)
        
        file_path = sys.argv[1]
        filename = sys.argv[2]
        
        try:
            # Read file content
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            print(f"Processing file: {filename}", file=sys.stderr)
            print(f"File size: {len(file_content)} bytes", file=sys.stderr)
            
            # Extract skills using existing pdfparser
            skills, text = pdfparser.skills_extraction_from_uploaded_file(file_content, filename)
            print(f"Extracted {len(skills)} skills: {skills[:5]}...", file=sys.stderr)
            
            if not skills:
                print(json.dumps({"success": False, "error": "No recognizable skills found in the resume"}))
                sys.exit(1)
            
            # Use absolute path for CSV
            csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'IT_Job_Roles_Skills.csv')
            csv_path = os.path.abspath(csv_path)
            print(f"Using CSV path: {csv_path}", file=sys.stderr)
            
            if not os.path.exists(csv_path):
                print(json.dumps({"success": False, "error": f"CSV file not found at: {csv_path}"}))
                sys.exit(1)
            
            # Analyze resume
            analyzer = ResumeAnalyzer(csv_path)
            top_matches = analyzer.top_job_roles(skills, top_n=5, threshold=0.1)
            job_titles = [title for title, _ in top_matches]
            
            print(f"Found {len(job_titles)} job matches", file=sys.stderr)
            
            result = {
                "success": True,
                "job_titles": job_titles,
                "extracted_skills": skills
            }
            
            print(json.dumps(result))
            
        except Exception as e:
            import traceback
            print(json.dumps({
                "success": False, 
                "error": str(e),
                "traceback": traceback.format_exc()
            }))
            sys.exit(1)

    if __name__ == "__main__":
        main()

except ImportError as e:
    print(json.dumps({"success": False, "error": f"Python dependencies not installed: {str(e)}"}))
    sys.exit(1)