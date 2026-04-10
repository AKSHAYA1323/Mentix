const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const TestQuestion = require('../models/TestQuestion');

const router = express.Router();

const getAiModel = () => {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

const buildFallbackFeedback = ({ score, total, role, topic }) => {
  const percentage = total ? Math.round((score / total) * 100) : 0;
  let summary = 'Needs improvement';
  let nextStep = `Review the basics of ${topic} for the ${role} path and retry this test.`;

  if (percentage >= 85) {
    summary = 'Excellent performance';
    nextStep = `Move to more advanced ${role} topics after one quick revision of ${topic}.`;
  } else if (percentage >= 70) {
    summary = 'Good progress';
    nextStep = `Revise the missed concepts in ${topic} and continue to the next test.`;
  } else if (percentage >= 50) {
    summary = 'Average result';
    nextStep = `Spend one more session on ${topic} before unlocking harder questions.`;
  }

  return `
    <ul>
      <li><strong>Summary:</strong> ${summary}</li>
      <li><strong>Score:</strong> ${score}/${total} (${percentage}%)</li>
      <li><strong>Role:</strong> ${role}</li>
      <li><strong>Next Step:</strong> ${nextStep}</li>
    </ul>
  `.trim();
};

router.get('/roles', async (_req, res) => {
  try {
    const roles = await TestQuestion.distinct('role');
    res.json(roles.filter(Boolean).sort((a, b) => a.localeCompare(b)));
  } catch (error) {
    console.error('Fetch Test Roles Error:', error);
    res.status(500).json({ error: 'Failed to fetch test roles.' });
  }
});

router.get('/topics', async (req, res) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({ error: 'role is required.' });
    }

    const topics = await TestQuestion.find({ role })
      .sort({ topic: 1 })
      .select({ topic: 1, _id: 0 })
      .lean();

    res.json(topics.map((item) => item.topic));
  } catch (error) {
    console.error('Fetch Test Topics Error:', error);
    res.status(500).json({ error: 'Failed to fetch test topics.' });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions must be a non-empty array.' });
    }

    const operations = questions.map((item) => ({
      updateOne: {
        filter: { role: item.role, topic: item.topic },
        update: { $set: item },
        upsert: true,
      },
    }));

    const created = await TestQuestion.bulkWrite(operations, { ordered: false });
    res.status(201).json({
      inserted: created.upsertedCount + created.modifiedCount,
      message: 'Questions imported successfully.',
    });
  } catch (error) {
    console.error('Import Questions Error:', error);
    res.status(500).json({ error: `Failed to import questions: ${error.message}` });
  }
});

router.post('/open-test', async (req, res) => {
  try {
    const { role, topic } = req.body;

    if (!role || !topic) {
      return res.status(400).json({ error: 'Role and topic are required.' });
    }

    const questionDoc = await TestQuestion.findOne({ role, topic })
      .lean();

    if (!questionDoc || !Array.isArray(questionDoc.questions) || questionDoc.questions.length === 0) {
      return res.status(404).json({
        error: `No saved questions found for ${role} and ${topic}. Add them in MongoDB first.`,
      });
    }

    const safeQuestions = questionDoc.questions.map((question, index) => ({
      id: `q${index + 1}`,
      question: question.question,
      options: question.options,
    }));

    res.json(safeQuestions);
  } catch (error) {
    console.error('Open Test Error:', error);
    res.status(500).json({ error: `Failed to open test: ${error.message}` });
  }
});

router.post('/evaluate-test', async (req, res) => {
  try {
    const { user_answers, role, topic } = req.body;

    if (!Array.isArray(user_answers) || !role || !topic) {
      return res.status(400).json({ error: 'Missing required evaluation fields.' });
    }

    const questionDoc = await TestQuestion.findOne({ role, topic }).lean();
    if (!questionDoc || !Array.isArray(questionDoc.questions) || questionDoc.questions.length === 0) {
      return res.status(404).json({ error: `No saved questions found for ${role} and ${topic}.` });
    }

    const correctAnswers = questionDoc.questions.map((question) => question.answer);
    const results = questionDoc.questions.map((question, index) => {
      const selectedAnswer = user_answers[index] || null;
      const correctAnswer = correctAnswers[index];
      const isCorrect = selectedAnswer === correctAnswer;

      return {
        questionNumber: index + 1,
        question: question.question,
        selectedAnswer,
        correctAnswer,
        selectedOptionText: selectedAnswer ? question.options[selectedAnswer] : null,
        correctOptionText: question.options[correctAnswer],
        isCorrect,
      };
    });

    let score = 0;
    for (let i = 0; i < correctAnswers.length; i += 1) {
      if (user_answers[i] === correctAnswers[i]) {
        score += 1;
      }
    }

    const total = correctAnswers.length;
    let feedback = buildFallbackFeedback({ score, total, role, topic });
    const model = getAiModel();

    if (model) {
      const prompt = `Analyze this test result:

Score: ${score}/${total}
Role: ${role}
Topic: ${topic}

Give:
- Strengths
- Weak areas
- What to improve
- Suggested next topic

Keep it short and actionable. Format as simple HTML (e.g. <ul>, <li>, <strong>) strictly without any markdown wraps like \`\`\`html.`;

      try {
        const result = await model.generateContent(prompt);
        let aiFeedback = result.response.text().trim();

        if (aiFeedback.startsWith('```html')) {
          aiFeedback = aiFeedback.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        } else if (aiFeedback.startsWith('```')) {
          aiFeedback = aiFeedback.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        if (aiFeedback) {
          feedback = aiFeedback;
        }
      } catch (aiError) {
        console.error('AI Feedback Error:', aiError.message);
      }
    }

    res.json({
      score,
      total,
      feedback,
      results,
    });
  } catch (error) {
    console.error('Evaluate Test Error:', error);
    res.status(500).json({ error: `Failed to evaluate test: ${error.message}` });
  }
});

module.exports = router;
