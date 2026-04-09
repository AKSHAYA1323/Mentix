import { useMemo, useState } from 'react';

const roleSkillMap = {
  'Full-Stack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Git'],
  'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Tailwind', 'Git'],
  'Backend Developer': ['Node.js', 'Express', 'REST API', 'MongoDB', 'SQL', 'Authentication', 'Docker'],
  'Data Scientist': ['Python', 'Pandas', 'NumPy', 'Machine Learning', 'Data Visualization', 'SQL'],
  'AI Engineer': ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP'],
  'DevOps Engineer': ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Monitoring'],
};

const normalize = (text) => text.toLowerCase();

const buildRoadmapFromGaps = (gaps) =>
  gaps.map((skill, index) => ({
    name: `${skill} Fundamentals`,
    description: `Learn ${skill} core concepts and complete one mini-project to apply it in practice.`,
    duration: '1 week',
    mainFocusTopics: [
      `${skill} basics`,
      `${skill} practical exercises`,
      `${skill} project implementation`,
    ],
    resources: [],
    priority: index < 3 ? 'High' : 'Medium',
  }));

const ResumeAnalyzer = ({ onRoadmapGenerated }) => {
  const [targetRole, setTargetRole] = useState('Full-Stack Developer');
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const requiredSkills = useMemo(() => roleSkillMap[targetRole] || [], [targetRole]);

  const analyzeResume = () => {
    if (!resumeText.trim()) {
      window.alert('Please paste your resume text first.');
      return;
    }

    const normalizedResume = normalize(resumeText);
    const matchedSkills = requiredSkills.filter((skill) => normalizedResume.includes(normalize(skill)));
    const missingSkills = requiredSkills.filter((skill) => !normalizedResume.includes(normalize(skill)));

    const score = requiredSkills.length
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
      : 0;

    setAnalysis({
      score,
      matchedSkills,
      missingSkills,
      recommendedSkills: missingSkills.slice(0, 6),
      generatedRoadmap: buildRoadmapFromGaps(missingSkills),
    });
  };

  const handleGenerateRoadmap = async () => {
    if (!analysis || !analysis.generatedRoadmap.length) {
      window.alert('Analyze the resume first to generate a roadmap.');
      return;
    }

    await onRoadmapGenerated({
      steps: analysis.generatedRoadmap,
      dreamGoal: targetRole,
      knowledgeLevel: analysis.score >= 70 ? 'intermediate' : 'beginner',
      knowledgeDetails: `Resume matched ${analysis.matchedSkills.length}/${requiredSkills.length} target skills.`,
      duration: Math.max(4, analysis.generatedRoadmap.length),
      dailyTime: 2,
      recommendedSkills: analysis.recommendedSkills,
    });
  };

  return (
    <div className="page active">
      <h1 className="section-title animate-on-scroll">Resume Analyzer</h1>
      <p className="section-subtitle animate-on-scroll">
        Paste your resume, detect skill gaps, and generate a personalized roadmap.
      </p>

      <div className="widget" style={{ marginBottom: '1rem' }}>
        <div className="form-group">
          <label htmlFor="targetRole">Target Role</label>
          <select
            id="targetRole"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          >
            {Object.keys(roleSkillMap).map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="resumeText">Resume Text</label>
          <textarea
            id="resumeText"
            rows="10"
            placeholder="Paste your full resume text here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
        </div>

        <div className="step-actions">
          <button className="step-btn primary" onClick={analyzeResume}>
            <i className="fas fa-search"></i> Analyze Resume
          </button>
          <button className="step-btn secondary" onClick={handleGenerateRoadmap}>
            <i className="fas fa-road"></i> Generate Roadmap From Gaps
          </button>
        </div>
      </div>

      {analysis && (
        <div className="widget">
          <h3 className="widget-title" style={{ marginBottom: '12px' }}>Analysis Result</h3>
          <p style={{ marginBottom: '10px' }}>
            <strong>Match Score:</strong> {analysis.score}%
          </p>

          <p style={{ marginBottom: '8px' }}><strong>Skills You Already Have:</strong></p>
          <div className="skills-list" style={{ marginBottom: '12px' }}>
            {analysis.matchedSkills.length ? analysis.matchedSkills.map((skill) => (
              <span key={skill} className="skill-tag">{skill}</span>
            )) : <span className="skill-tag">No matching skills detected</span>}
          </div>

          <p style={{ marginBottom: '8px' }}><strong>Recommended Skills To Learn:</strong></p>
          <div className="skills-list">
            {analysis.recommendedSkills.length ? analysis.recommendedSkills.map((skill) => (
              <span key={skill} className="skill-tag">{skill}</span>
            )) : <span className="skill-tag">No immediate skill gaps</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
