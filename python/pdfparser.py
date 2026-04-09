import pdfplumber
import pandas as pd
import spacy
from spacy.matcher import PhraseMatcher
import os

# Load spaCy model only once
nlp = spacy.load("en_core_web_sm")

# Load skills CSV once with correct path
csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'IT_Job_Roles_Skills.csv')
df = pd.read_csv(csv_path, encoding='latin')

# Prepare unique skills list globally
skills_raw = df['Skills'].dropna().str.lower().str.split(',')
unique_skills = sorted(set(skill.strip() for sublist in skills_raw for skill in sublist))

# Initialize PhraseMatcher globally
matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
patterns = [nlp.make_doc(skill) for skill in unique_skills]
matcher.add("SKILLS", patterns)

# Context keywords for filtering (expanded list)
context_keywords = {
    "experienced", "proficient", "knowledge", "expert", "skilled", "worked", 
    "familiar", "hands-on", "using", "with", "in", "developed", "built",
    "created", "implemented", "utilized", "experience", "skills", "technologies",
    "tools", "programming", "software", "development", "project", "projects"
}

def extract_text_from_pdf(file_path):
    with pdfplumber.open(file_path) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)

def skills_extraction_from_text(text, use_strict_filtering=False):
    """
    Extract skills from given text using spaCy PhraseMatcher
    
    Args:
        text: The text to extract skills from
        use_strict_filtering: If True, only extract skills with context keywords
                            If False, extract all matched skills
    """
    text = text.lower()
    doc = nlp(text)
    matches = matcher(doc)
    matched_skills = set(doc[start:end].text for _, start, end in matches)
    
    # If no strict filtering needed, return all matched skills
    if not use_strict_filtering:
        print(f"Found {len(matched_skills)} skills without filtering: {list(matched_skills)[:10]}")
        return sorted(matched_skills)
    
    # Apply context filtering (original behavior)
    filtered_skills = set()
    for sent in doc.sents:
        sent_text = sent.text.lower()
        sent_skills = {skill for skill in matched_skills if skill in sent_text}
        if sent_skills and any(kw in sent_text for kw in context_keywords):
            filtered_skills.update(sent_skills)
    
    print(f"Found {len(filtered_skills)} skills with filtering: {list(filtered_skills)[:10]}")
    return sorted(filtered_skills)

def skills_extraction_from_uploaded_file(file_content, filename):
    """Extract text and skills from uploaded PDF or DOCX file content (bytes)"""
    text = ""
    
    if filename.lower().endswith('.pdf'):
        # Use pdfplumber directly from bytes
        import io
        file_stream = io.BytesIO(file_content)
        with pdfplumber.open(file_stream) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    
    # Extract skills without strict filtering by default
    skills = skills_extraction_from_text(text, use_strict_filtering=False)
    
    # If no skills found, print debug info
    if not skills:
        print("No skills found. Debug info:")
        print(f"Text length: {len(text)}")
        print(f"First 500 chars: {text[:500]}")
        print(f"Available skills to match: {len(unique_skills)}")
    
    return skills, text