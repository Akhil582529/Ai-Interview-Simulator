export const parseQuestionsFromText = (questionsText: string): string[] => {
  const lines = questionsText.split('\n');
  const questions: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const numberMatch = line.match(/^(\d+)[\.\)]\s*(.+)/);
    if (numberMatch && numberMatch[2]) {
      questions.push(numberMatch[2].trim());
    } else if (line && questions.length > 0 && !line.match(/^[\d\*\-\#]/) && line.length > 20) {
      if (questions[questions.length - 1].length < 200) {
        questions[questions.length - 1] += " " + line;
      }
    }
  }
  return questions.length > 0 ? questions : [questionsText];
};

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const skillsArray = (skills: string) => 
  skills.split(',').map(s => s.trim()).filter(s => s);

export const getDifficultyLevel = (experience: string): string => {
  const exp = experience.toLowerCase();
  if (exp.includes('senior') || exp.includes('lead')) return 'Advanced';
  if (exp.includes('junior') || exp.includes('entry')) return 'Beginner';
  return 'Intermediate';
};