import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { writeFile } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResumeAnalysisResult {
  success: boolean;
  job_titles?: string[];
  extracted_skills?: string[];
  error?: string;
  serverless?: boolean;
}

export async function POST(request: NextRequest) {
  console.log('🚀 Resume analysis API called');

  // ── Vercel / serverless check ─────────────────────────────────────────────
  const isServerless =
    process.env.VERCEL === '1' ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
    process.env.NETLIFY === 'true';

  if (isServerless) {
    return NextResponse.json({
      success: false,
      serverless: true,
      error: 'Resume analysis is not available in the deployed version. Please enter your role and skills manually.',
    }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type: ${file.type}. Please upload PDF, DOCX, or TXT files only.` },
        { status: 400 }
      );
    }

    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = path.join(tempDir, `${Date.now()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    try {
      const pythonDir  = path.join(process.cwd(), 'python');
      const csvPath    = path.join(process.cwd(), 'data', 'IT_Job_Roles_Skills.csv');
      const wrapperScript = path.join(pythonDir, 'analyze_wrapper.py');

      if (!fs.existsSync(pythonDir)) throw new Error('Python directory not found.');
      if (!fs.existsSync(csvPath))   throw new Error('CSV file not found. Make sure IT_Job_Roles_Skills.csv is in the data folder.');

      if (!fs.existsSync(wrapperScript)) {
        const wrapperContent = `#!/usr/bin/env python3
import sys, json, os
sys.path.append(os.path.dirname(__file__))
try:
    from resume_analyzer import ResumeAnalyzer
    import pdfparser
    def main():
        if len(sys.argv) != 3:
            print(json.dumps({"success": False, "error": "Invalid arguments"})); sys.exit(1)
        file_path, filename = sys.argv[1], sys.argv[2]
        try:
            with open(file_path, 'rb') as f: file_content = f.read()
            skills, text = pdfparser.skills_extraction_from_uploaded_file(file_content, filename)
            if not skills:
                print(json.dumps({"success": False, "error": "No recognizable skills found"})); sys.exit(1)
            csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'IT_Job_Roles_Skills.csv'))
            if not os.path.exists(csv_path):
                print(json.dumps({"success": False, "error": f"CSV not found: {csv_path}"})); sys.exit(1)
            analyzer = ResumeAnalyzer(csv_path)
            top_matches = analyzer.top_job_roles(skills, top_n=10, threshold=0.1)
            print(json.dumps({"success": True, "job_titles": [t for t,_ in top_matches], "extracted_skills": skills}))
        except Exception as e:
            import traceback
            print(json.dumps({"success": False, "error": str(e), "traceback": traceback.format_exc()})); sys.exit(1)
    if __name__ == "__main__": main()
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Dependencies not installed: {str(e)}"})); sys.exit(1)
`;
        fs.writeFileSync(wrapperScript, wrapperContent);
        fs.chmodSync(wrapperScript, '755');
      }

      const result = await callPythonScript(wrapperScript, tempFilePath, file.name);
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

      if (result.success && result.job_titles && result.job_titles.length > 0) {
        result.job_titles = deduplicateTitles(result.job_titles).slice(0, 5);
      }

      return NextResponse.json(result);

    } catch (error) {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      throw error;
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('💥 Server error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── Deduplication ─────────────────────────────────────────────────────────────
function normaliseTitle(title: string): string {
  return title.toLowerCase()
    .replace(/\bjr\.?\b/g, 'junior').replace(/\bsr\.?\b/g, 'senior')
    .replace(/\bnew\s+grad\b/g, 'junior').replace(/\bentry[\s-]?level\b/g, 'junior')
    .replace(/\bsoftware\s+(engineer|developer|programmer)\b/g, 'developer')
    .replace(/\b(engineer|programmer|coder)\b/g, 'developer')
    .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function similarity(a: string, b: string): number {
  const setA = new Set(a.split(' ')), setB = new Set(b.split(' '));
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function deduplicateTitles(titles: string[], threshold = 0.6): string[] {
  const kept: string[] = [], normKept: string[] = [];
  for (const title of titles) {
    const norm = normaliseTitle(title);
    if (!normKept.some(e => similarity(e, norm) >= threshold)) {
      kept.push(title); normKept.push(norm);
    }
  }
  return kept;
}

// ── Python subprocess ─────────────────────────────────────────────────────────
function callPythonScript(scriptPath: string, filePath: string, filename: string): Promise<ResumeAnalysisResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [scriptPath, filePath, filename]);
    let out = '', err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', code => {
      if (code === 0) {
        try {
          const lines = out.trim().split('\n');
          resolve(JSON.parse(lines[lines.length - 1]));
        } catch { reject(new Error(`Failed to parse Python output: ${out}`)); }
      } else {
        reject(new Error(`Python script failed (code ${code}): ${err}`));
      }
    });
    proc.on('error', e => reject(new Error(`Failed to start Python: ${e.message}`)));
  });
}