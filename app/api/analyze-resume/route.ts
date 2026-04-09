// app/api/analyze-resume/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';

interface ResumeAnalysisResult {
  success: boolean;
  job_titles?: string[];
  extracted_skills?: string[];
  error?: string;
  debug?: any;
}

export async function POST(request: NextRequest) {
  console.log('🚀 Resume analysis API called');

  try {
    // Parse form data
    console.log('📝 Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      console.log('❌ No file uploaded');
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('📄 File received:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Validate file type
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'
    ];
    
    if (!validTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { success: false, error: `Invalid file type: ${file.type}. Please upload PDF, DOCX, or TXT files only.` },
        { status: 400 }
      );
    }

    // Create temp directory
    console.log('📁 Setting up temp directory...');
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      console.log('📁 Creating temp directory...');
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save file
    console.log('💾 Saving uploaded file...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);
    console.log('✅ File saved to:', tempFilePath);

    try {
      // Check if required files exist
      console.log('🔍 Checking required files...');
      const pythonDir = path.join(process.cwd(), 'python');
      const csvPath = path.join(process.cwd(), 'data', 'IT_Job_Roles_Skills.csv');
      const wrapperScript = path.join(pythonDir, 'analyze_wrapper.py');
      
      console.log('Python directory:', pythonDir, 'Exists:', fs.existsSync(pythonDir));
      console.log('CSV file:', csvPath, 'Exists:', fs.existsSync(csvPath));
      console.log('Wrapper script:', wrapperScript, 'Exists:', fs.existsSync(wrapperScript));

      if (!fs.existsSync(pythonDir)) {
        throw new Error('Python directory not found. Make sure the python folder exists.');
      }

      if (!fs.existsSync(csvPath)) {
        throw new Error('CSV file not found. Make sure IT_Job_Roles_Skills.csv is in the data folder.');
      }

      // Create wrapper script if it doesn't exist
      if (!fs.existsSync(wrapperScript)) {
        console.log('📝 Creating Python wrapper script...');
        const wrapperContent = `#!/usr/bin/env python3
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
            
            # Extract skills
            skills, text = pdfparser.skills_extraction_from_uploaded_file(file_content, filename)
            print(f"Extracted {len(skills)} skills", file=sys.stderr)
            
            if not skills:
                print(json.dumps({"success": False, "error": "No recognizable skills found in the resume"}))
                sys.exit(1)
            
            # Use absolute path for CSV
            csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'IT_Job_Roles_Skills.csv')
            csv_path = os.path.abspath(csv_path)
            print(f"Using CSV: {csv_path}", file=sys.stderr)
            
            if not os.path.exists(csv_path):
                print(json.dumps({"success": False, "error": f"CSV not found: {csv_path}"}))
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
    print(json.dumps({"success": False, "error": f"Dependencies not installed: {str(e)}"}))
    sys.exit(1)
`;
        fs.writeFileSync(wrapperScript, wrapperContent);
        fs.chmodSync(wrapperScript, '755');
        console.log('✅ Wrapper script created');
      }

      // Call Python script
      console.log('🔬 Starting resume analysis...');
      const result = await callPythonScript(wrapperScript, tempFilePath, file.name);
      
      // Clean up temp file
      console.log('🗑️ Cleaning up temp file...');
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

      console.log('✅ Analysis complete:', result);
      return NextResponse.json(result);

    } catch (error) {
      console.error('❌ Analysis error:', error);
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }

  } catch (error: any) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

function callPythonScript(scriptPath: string, filePath: string, filename: string): Promise<ResumeAnalysisResult> {
  return new Promise((resolve, reject) => {
    console.log('🐍 Calling Python script:', scriptPath);
    const pythonProcess = spawn('python3', [scriptPath, filePath, filename]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log('🐍 Python process closed with code:', code);
      console.log('📤 Python stdout:', output);
      console.log('📤 Python stderr:', errorOutput);

      if (code === 0) {
        try {
          // Extract just the JSON part (the last line should be the JSON result)
          const lines = output.trim().split('\n');
          const jsonLine = lines[lines.length - 1];
          const result = JSON.parse(jsonLine);
          resolve(result);
        } catch (e) {
          console.log('Raw Python output:', output);
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      } else {
        reject(new Error(`Python script failed with code ${code}. Error: ${errorOutput}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}