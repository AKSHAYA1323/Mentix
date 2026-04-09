const express = require('express');
const auth = require('../middleware/authMiddleware');
const axios = require('axios'); // or use node-fetch if you prefer
const Roadmap = require('../models/Roadmap');
const Progress = require('../models/Progress');

const router = express.Router();

function localMentorReply(message) {
  const text = String(message || '').toLowerCase();

  if (text.includes('resume')) {
    return 'Improve your resume by quantifying impact, listing your stack clearly, and tailoring bullets to the target role.';
  }
  if (text.includes('roadmap') || text.includes('plan')) {
    return 'Use a weekly plan: fundamentals, guided implementation, independent mini-project, then revision and assessment.';
  }
  if (text.includes('interview')) {
    return 'Prepare with a loop: revise concepts, solve timed questions, review mistakes, and repeat weak topics every few days.';
  }
  if (text.includes('project')) {
    return 'Choose one scoped project with clear requirements, architecture, milestones, and deployment.';
  }

  return 'I can help with roadmap planning, resume improvements, interview preparation, and project strategy. Ask your goal in one sentence.';
}

function isEducationalOrCSELocal(message) {
  const text = String(message || '').toLowerCase();
  const keywords = [
    'study', 'learn', 'course', 'education', 'college', 'career', 'resume', 'roadmap', 'interview',
    'project', 'programming', 'code', 'cse', 'computer', 'algorithm', 'data structure', 'react',
    'javascript', 'node', 'python', 'java', 'sql', 'mongodb', 'ai', 'ml', 'devops', 'cloud'
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

function canUseOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || typeof key !== 'string') return false;
  // Google keys often begin with AIza and are not valid OpenAI keys.
  if (key.startsWith('AIza')) return false;
  return key.startsWith('sk-');
}

// In your chat route:
router.post('/chat', async (req, res) => {
  const userMessage = req.body?.message;
  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ reply: 'Please send a valid message.' });
  }

  // Always allow local filtering and local fallback so chat never appears broken.
  if (!isEducationalOrCSELocal(userMessage)) {
    return res.json({
      reply: "I can help you with educational or CSE topics. Please ask something related to your learning or career path."
    });
  }

  if (!canUseOpenAI()) {
    return res.json({ reply: localMentorReply(userMessage) });
  }

  // Call AI provider when key is configured correctly.
  try {
    const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo", // or your model
      messages: [{ role: "user", content: userMessage }]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });

    const reply = aiResponse.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('AI API error:', error.response ? error.response.data : error.message);
    // Ensure frontend gets a usable mentor response even when provider fails.
    res.json({ reply: localMentorReply(userMessage) });
  }
});

router.get('/protected', auth, (req, res) => {
  res.json({ msg: `Hello, ${req.user.name}! This is protected data.` });
});

// Save or update roadmap for logged-in user
router.post('/roadmap', auth, async (req, res) => {
  try {
    const { steps, dreamGoal, duration, knowledgeLevel, knowledgeDetails, dailyTime } = req.body;
    if (!Array.isArray(steps)) {
      return res.status(400).json({ msg: 'Steps must be an array.' });
    }
    let roadmap = await Roadmap.findOne({ userId: req.user.userId });
    if (roadmap) {
      roadmap.steps = steps;
      roadmap.dreamGoal = dreamGoal || '';
      roadmap.duration = duration || 12;
      roadmap.knowledgeLevel = knowledgeLevel || '';
      roadmap.knowledgeDetails = knowledgeDetails || '';
      roadmap.dailyTime = dailyTime || 2;
      roadmap.updatedAt = Date.now();
      await roadmap.save();
    } else {
      roadmap = new Roadmap({
        userId: req.user.userId,
        steps,
        dreamGoal: dreamGoal || '',
        duration: duration || 12,
        knowledgeLevel: knowledgeLevel || '',
        knowledgeDetails: knowledgeDetails || '',
        dailyTime: dailyTime || 2
      });
      await roadmap.save();
    }
    res.json({ success: true, roadmap });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Fetch roadmap for logged-in user
router.get('/roadmap', auth, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user.userId });
    res.json({ roadmap });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Save or update progress for logged-in user
router.post('/progress', auth, async (req, res) => {
  try {
    const { completedSteps } = req.body;
    if (!Array.isArray(completedSteps)) {
      return res.status(400).json({ msg: 'completedSteps must be an array.' });
    }
    let progress = await Progress.findOne({ userId: req.user.userId });
    if (progress) {
      progress.completedSteps = completedSteps;
      progress.updatedAt = Date.now();
      await progress.save();
    } else {
      progress = new Progress({ userId: req.user.userId, completedSteps });
      await progress.save();
    }
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Fetch progress for logged-in user
router.get('/progress', auth, async (req, res) => {
  try {
    const progress = await Progress.findOne({ userId: req.user.userId });
    res.json({ progress });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;