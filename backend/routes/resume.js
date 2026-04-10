const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');

// Set up memory storage for multer
const upload = multer({ storage: multer.memoryStorage() });

// Predefined list of skills to match
const ALL_SKILLS = [
  "Python", "Java", "C++", "SQL", "DSA", 
  "Machine Learning", "HTML", "CSS", 
  "JavaScript", "React"
];

// Map of required skills per role
const REQUIRED_SKILLS = {
  "Software Engineer": ["Python", "Java", "C++", "DSA", "SQL"],
  "Data Scientist": ["Python", "Machine Learning", "SQL", "DSA"],
  "Web Developer": ["HTML", "CSS", "JavaScript", "React", "SQL"]
};

// Helper function to extract skills from text
function extractSkills(text) {
  const normalizedText = text.toLowerCase();
  return ALL_SKILLS.filter(skill => normalizedText.includes(skill.toLowerCase()));
}

router.post('/analyze-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const dreamRole = req.body.role;
    if (!dreamRole || !REQUIRED_SKILLS[dreamRole]) {
      return res.status(400).json({ error: 'Invalid or missing Dream Role.' });
    }

    // 1. Extract text from PDF
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    // 2. Extract matched skills from the text
    const extractedSkills = extractSkills(resumeText);

    // 3. Compare with role requirements
    const requiredSkillsForRole = REQUIRED_SKILLS[dreamRole];
    
    // Matched specific to the role
    const matchedRoleSkills = requiredSkillsForRole.filter(skill => extractedSkills.includes(skill));
    
    // Missing skills
    const missingSkills = requiredSkillsForRole.filter(skill => !extractedSkills.includes(skill));

    // Calculate ATS Score
    const score = Math.round((matchedRoleSkills.length / requiredSkillsForRole.length) * 100);

    // 4. Generate roadmap
    const roadmap = missingSkills.map(skill => {
      return {
        skill: skill,
        task: `Learn ${skill}: 2 days learning + 2 days practice`,
        duration: '4 days'
      };
    });

    // 5. Send Response
    res.json({
      ats_score: score,
      extracted_skills: extractedSkills,
      missing_skills: missingSkills,
      roadmap: roadmap
    });
    
  } catch (error) {
    console.error('Resume Analysis Error:', error);
    res.status(500).json({ error: `Failed to analyze resume: ${error.message}` });
  }
});

module.exports = router;
