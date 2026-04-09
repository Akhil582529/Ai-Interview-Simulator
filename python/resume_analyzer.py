import pandas as pd
import numpy as np
import re
import os

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class ResumeAnalyzer:
    def __init__(self, csv_path=None):
        if csv_path is None:
            csv_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                'data',
                'IT_Job_Roles_Skills.csv'
            )

        self.csv_path = csv_path
        self.df = None
        self.vectorizer = None
        self.X = None
        self.load_and_prepare_data()

    # ------------------ DATA PREPARATION ------------------

    def load_and_prepare_data(self):
        self.df = pd.read_csv(self.csv_path, encoding='latin')

        self.df['Skills'] = self.df['Skills'].apply(self.clean_skills)
        self.df['Normalized Title'] = self.df['Job Title'].apply(self.normalize_role)

        self.vectorizer = TfidfVectorizer()
        self.X = self.vectorizer.fit_transform(self.df['Skills'])

    def clean_skills(self, text):
        text = str(text).lower()
        text = re.sub(r'[^a-zA-Z0-9, ]', '', text)
        text = re.sub(r'\bml\b', 'machine learning', text)
        text = re.sub(r'\bai\b', 'artificial intelligence', text)
        return text

    def normalize_role(self, title):
        """
        Normalise a job title to a canonical key used for deduplication.
        Two titles that map to the same key are treated as duplicates —
        only the highest-scoring one is kept.
        """
        t = str(title).lower().strip()

        # ── Expand abbreviations ──────────────────────────────────────────
        t = re.sub(r'\bjr\.?\b', 'junior', t)
        t = re.sub(r'\bsr\.?\b', 'senior', t)

        # ── Unify seniority synonyms ──────────────────────────────────────
        t = re.sub(r'\bnew\s+grad\b', 'junior', t)
        t = re.sub(r'\bentry[\s\-]?level\b', 'junior', t)

        # ── Unify role-type synonyms ──────────────────────────────────────
        # Order matters: more specific first
        t = re.sub(r'\bsoftware\s+(engineer|developer|programmer)\b', 'developer', t)
        t = re.sub(r'\b(engineer|programmer|coder)\b', 'developer', t)

        # ── Strip punctuation and normalise whitespace ────────────────────
        t = re.sub(r'[^a-z0-9 ]', '', t)
        t = re.sub(r'\s+', ' ', t).strip()

        return t

    # ------------------ PREDICTION ------------------

    def top_job_roles(self, resume_skills, top_n=5, threshold=0.3):
        resume_skills_clean = self.clean_skills(" ".join(resume_skills))
        resume_vector = self.vectorizer.transform([resume_skills_clean])

        similarities = cosine_similarity(resume_vector, self.X).flatten()
        self.df['Similarity'] = similarities

        # Sort by similarity descending
        ranked = self.df.sort_values(by='Similarity', ascending=False)
        ranked = ranked[ranked['Similarity'] >= threshold]

        # Keep only the BEST match per normalised title (deduplication)
        # Since rows are already sorted descending, first occurrence = highest score
        unique_roles = ranked.drop_duplicates(subset=['Normalized Title'], keep='first')

        top_roles = unique_roles[['Job Title', 'Similarity']].head(top_n)

        return top_roles.to_records(index=False).tolist()

    # ------------------ EVALUATION METRICS ------------------

    def top_k_accuracy(self, k=5, threshold=0.3):
        correct = 0
        total = len(self.df)

        for _, row in self.df.iterrows():
            true_role = row['Job Title']
            resume_skills = row['Skills'].split(',')

            predictions = self.top_job_roles(
                resume_skills=resume_skills,
                top_n=k,
                threshold=threshold
            )

            predicted_roles = [p[0] for p in predictions]

            if true_role in predicted_roles:
                correct += 1

        return correct / total

    def precision_at_k(self, k=5, threshold=0.3):
        precision_scores = []

        for _, row in self.df.iterrows():
            true_role = row['Job Title']
            resume_skills = row['Skills'].split(',')

            predictions = self.top_job_roles(
                resume_skills=resume_skills,
                top_n=k,
                threshold=threshold
            )

            predicted_roles = [p[0] for p in predictions]

            if predicted_roles:
                precision_scores.append(1 if true_role in predicted_roles else 0)

        return np.mean(precision_scores)

    def recall_at_k(self, k=5, threshold=0.3):
        hits = 0

        for _, row in self.df.iterrows():
            true_role = row['Job Title']
            resume_skills = row['Skills'].split(',')

            predictions = self.top_job_roles(
                resume_skills=resume_skills,
                top_n=k,
                threshold=threshold
            )

            predicted_roles = [p[0] for p in predictions]

            if true_role in predicted_roles:
                hits += 1

        return hits / len(self.df)

    def mean_reciprocal_rank(self, k=5):
        rr_scores = []

        for _, row in self.df.iterrows():
            true_role = row['Job Title']
            resume_skills = row['Skills'].split(',')

            predictions = self.top_job_roles(resume_skills, top_n=k)

            found = False
            for rank, (role, _) in enumerate(predictions, start=1):
                if role == true_role:
                    rr_scores.append(1 / rank)
                    found = True
                    break

            if not found:
                rr_scores.append(0)

        return np.mean(rr_scores)


# ------------------ MAIN (FOR TESTING / PAPER RESULTS) ------------------

if __name__ == "__main__":
    model = ResumeAnalyzer()

    print("Top-5 Accuracy      :", round(model.top_k_accuracy(k=5), 4))
    print("Precision@5         :", round(model.precision_at_k(k=5), 4))
    print("Recall@5            :", round(model.recall_at_k(k=5), 4))
    print("Mean Reciprocal Rank:", round(model.mean_reciprocal_rank(k=5), 4))