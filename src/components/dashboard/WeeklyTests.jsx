import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';

const fallbackRoles = [
  'Full-Stack Developer',
  'Data Scientist',
  'UI/UX Designer',
  'DevOps Engineer',
  'AI Engineer',
  'Cybersecurity Specialist',
  'Blockchain Developer',
];

const roleFocusMap = {
  'Full-Stack Developer': ['JavaScript', 'React', 'Node.js'],
  'Data Scientist': ['Python', 'Data Analysis', 'Machine Learning'],
  'UI/UX Designer': ['User Research', 'Wireframing', 'Prototyping'],
  'DevOps Engineer': ['Linux', 'Docker', 'CI/CD'],
  'AI Engineer': ['Deep Learning', 'Computer Vision', 'NLP'],
  'Cybersecurity Specialist': ['Network Security', 'Threat Modeling', 'Incident Response'],
  'Blockchain Developer': ['Blockchain Basics', 'Smart Contracts', 'Web3 Integration'],
};

const defaultWeekGoalByRole = {
  'Full-Stack Developer': 'Understand fundamentals and build a small full-stack starter app.',
  'Data Scientist': 'Clean data, run EDA, and present insights from a sample dataset.',
  'UI/UX Designer': 'Create user flows and a clickable low-fidelity prototype.',
  'DevOps Engineer': 'Containerize an app and run a basic CI pipeline.',
  'AI Engineer': 'Implement a baseline model and evaluate metrics on a starter problem.',
  'Cybersecurity Specialist': 'Identify common attack vectors and basic defensive controls.',
  'Blockchain Developer': 'Deploy a simple smart contract and test key functions.',
};

const getWeekGoal = (roadmapSteps, role, weekNumber) => {
  if (Array.isArray(roadmapSteps) && roadmapSteps.length >= weekNumber) {
    const weekData = roadmapSteps[weekNumber - 1] || {};
    if (typeof weekData.description === 'string' && weekData.description.trim()) {
      return weekData.description.trim();
    }
    if (Array.isArray(weekData.mainFocusTopics) && weekData.mainFocusTopics.length > 0) {
      return `Cover ${weekData.mainFocusTopics.slice(0, 3).join(', ')} and complete one practical task.`;
    }
    if (typeof weekData.name === 'string' && weekData.name.trim()) {
      return weekData.name.trim();
    }
  }

  return defaultWeekGoalByRole[role] || `Complete foundational concepts and one practical milestone for Week ${weekNumber}.`;
};

const buildTests = (role, weekGoals) => {
  const roleFocus = roleFocusMap[role] || ['Core Concepts', 'Implementation', 'Problem Solving'];

  return [
    {
      id: 'goal-mastery',
      title: `${role} Week 1 Goal Mastery Test`,
      week: 'Week 1',
      weekNumber: 1,
      questions: 20,
      duration: '30 min',
      level: 'Role-Aligned',
      topic: roleFocus[0],
      goal: weekGoals[0],
      completed: false,
      score: null,
    },
    {
      id: 'concept-accuracy',
      title: `${roleFocus[0]} & ${roleFocus[1]} Week 2 Concept Check`,
      week: 'Week 2',
      weekNumber: 2,
      questions: 20,
      duration: '25 min',
      level: 'Foundation',
      topic: `${roleFocus[0]}, ${roleFocus[1]}`,
      goal: weekGoals[1] || `Validate your understanding of ${roleFocus[0]} and ${roleFocus[1]} for Week 2.`,
      completed: false,
      score: null,
    },
    {
      id: 'application',
      title: `${role} Week 3 Applied Scenario Test`,
      week: 'Week 3',
      weekNumber: 3,
      questions: 20,
      duration: '20 min',
      level: 'Applied',
      topic: roleFocus[2],
      goal: weekGoals[2] || `Apply learning to a real-world scenario focused on ${roleFocus[2]}.`,
      completed: false,
      score: null,
    },
  ];
};

const getScoreFeedback = (score) => {
  if (score >= 85) return 'Excellent. Move to advanced challenges.';
  if (score >= 70) return 'Great progress. Practice one project this week.';
  if (score >= 50) return 'Good start. Revise weak concepts and retake.';
  return 'Needs improvement. Focus on basics and guided practice.';
};

const WeeklyTests = ({ roadmapSteps = [] }) => {
  const [availableRoles, setAvailableRoles] = useState(fallbackRoles);
  const [careerPath, setCareerPath] = useState(fallbackRoles[0]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [topicsLoaded, setTopicsLoaded] = useState(false);
  const [testState, setTestState] = useState('selection');
  const [tests, setTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [reports, setReports] = useState({});
  const [error, setError] = useState(null);

  const weekGoals = useMemo(
    () => [1, 2, 3].map((weekNumber) => getWeekGoal(roadmapSteps, careerPath, weekNumber)),
    [roadmapSteps, careerPath]
  );
  const storageKey = useMemo(() => `weekly-tests:${careerPath}`, [careerPath]);

  const generatedTests = useMemo(
    () => buildTests(careerPath, weekGoals),
    [careerPath, weekGoals]
  );

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get(buildApiUrl('/api/tests/roles'));
        if (Array.isArray(response.data) && response.data.length > 0) {
          setAvailableRoles(response.data);
          setCareerPath((currentRole) => (response.data.includes(currentRole) ? currentRole : response.data[0]));
        }
      } catch (err) {
        console.error('Failed to fetch test roles:', err);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!careerPath) return;

      setTopicsLoaded(false);
      try {
        const response = await axios.get(buildApiUrl(`/api/tests/topics?role=${encodeURIComponent(careerPath)}`));
        if (Array.isArray(response.data) && response.data.length > 0) {
          setAvailableTopics(response.data);
        } else {
          setAvailableTopics([]);
        }
      } catch (err) {
        console.error('Failed to fetch test topics:', err);
        setAvailableTopics([]);
      } finally {
        setTopicsLoaded(true);
      }
    };

    fetchTopics();
  }, [careerPath]);

  useEffect(() => {
    if (!topicsLoaded) return;

    const topicAlignedTests = generatedTests.map((test, index) => ({
      ...test,
      topic: availableTopics[index] || test.topic,
    }));

    const savedState = localStorage.getItem(storageKey);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const savedTests = Array.isArray(parsed.tests) ? parsed.tests : [];
        const savedReports = parsed.reports && typeof parsed.reports === 'object' ? parsed.reports : {};

        const mergedTests = topicAlignedTests.map((test) => {
          const savedTest = savedTests.find((item) => item.id === test.id);
          return savedTest
            ? { ...test, completed: !!savedTest.completed, score: savedTest.score ?? null }
            : test;
        });

        setTests(mergedTests);
        setReports(savedReports);
      } catch (error) {
        console.error('Failed to load saved weekly test state:', error);
        setTests(topicAlignedTests);
        setReports({});
      }
    } else {
      setTests(topicAlignedTests);
      setReports({});
    }

    if (testState === 'selection') {
      setActiveTest(null);
      setActiveQuestions([]);
      setSelectedAnswers({});
      setError(null);
    }
  }, [generatedTests, availableTopics, topicsLoaded, storageKey]);

  useEffect(() => {
    if (!topicsLoaded || tests.length === 0) return;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        tests,
        reports,
      })
    );
  }, [tests, reports, topicsLoaded, storageKey]);

  const unlockedTestId = useMemo(() => {
    const nextTest = tests.find((test) => !test.completed);
    return nextTest ? nextTest.id : null;
  }, [tests]);

  const overall = useMemo(() => {
    const completed = tests.filter((test) => test.completed);
    const avgScore = completed.length
      ? Math.round(completed.reduce((acc, test) => acc + (test.score || 0), 0) / completed.length)
      : 0;

    return {
      completedCount: completed.length,
      total: tests.length,
      avgScore,
    };
  }, [tests]);

  const handleTakeTest = async (testId) => {
    const test = tests.find((item) => item.id === testId);
    if (!test) return;

    if (!topicsLoaded) {
      window.alert('Topics are still loading from MongoDB. Please wait one moment and click Open Test again.');
      return;
    }

    if (!test.topic) {
      window.alert('No MongoDB topic was found for this test yet. Please add questions for this role first.');
      return;
    }

    if (!test.completed && unlockedTestId && test.id !== unlockedTestId) {
      window.alert(`Please complete ${tests.find((item) => item.id === unlockedTestId)?.week || 'the current week'} test first.`);
      return;
    }

    setActiveTest(test);
    setTestState('generating');
    setError(null);

    try {
      const response = await axios.post(buildApiUrl('/api/tests/open-test'), {
        role: careerPath,
        topic: test.topic,
      });

      const questionsData = response.data.map((question, index) => ({
        id: question.id || `q${index + 1}`,
        question: question.question,
        optionsHash: question.options,
      }));

      setActiveQuestions(questionsData);
      setSelectedAnswers({});
      setTestState('taking_test');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to open saved test. Add questions in MongoDB for this role and test.');
      setTestState('selection');
      setActiveTest(null);
    }
  };

  const handleSelectAnswer = (questionId, optionKey) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleSubmitTest = async () => {
    if (!activeTest || activeQuestions.length === 0) return;

    const unanswered = activeQuestions.some((question) => !selectedAnswers[question.id]);
    if (unanswered) {
      window.alert('Please answer all questions before submitting the test.');
      return;
    }

    setTestState('evaluating');
    setError(null);

    try {
      const mappedAnswers = activeQuestions.map((question) => selectedAnswers[question.id]);

      const response = await axios.post(buildApiUrl('/api/tests/evaluate-test'), {
        user_answers: mappedAnswers,
        role: careerPath,
        topic: activeTest.topic,
      });

      const { score, total, feedback, results = [] } = response.data;
      const scorePercentage = Math.round((score / total) * 100);

      const report = {
        testId: activeTest.id,
        week: activeTest.week,
        score: scorePercentage,
        percentageAttained: scorePercentage,
        correctCount: score,
        totalQuestions: total,
        feedback,
        results,
        submittedAt: new Date().toLocaleString(),
      };

      setTests((prev) =>
        prev.map((test) =>
          test.id === activeTest.id
            ? { ...test, completed: true, score: scorePercentage }
            : test
        )
      );
      setReports((prev) => ({ ...prev, [activeTest.id]: report }));
      setActiveTest(null);
      setActiveQuestions([]);
      setSelectedAnswers({});
      setTestState('selection');
    } catch (err) {
      console.error(err);
      setError('Failed to evaluate test on the server.');
      setTestState('taking_test');
    }
  };

  if (testState === 'generating' || testState === 'evaluating') {
    return (
      <div className="page active">
        <h1 className="section-title">Weekly Role Tests</h1>
        <div className="widget" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '20px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#f47b20', marginBottom: '20px' }}></i>
          <h3>{testState === 'generating' ? `Opening your saved ${careerPath} test...` : 'Grading your test and preparing feedback...'}</h3>
          <p style={{ color: '#666' }}>Questions are loaded from MongoDB based on the selected role.</p>
        </div>
      </div>
    );
  }

  if (testState === 'taking_test' && activeTest) {
    return (
      <div className="page active">
        <h1 className="section-title">Weekly Role Tests</h1>
        <div className="widget" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
            <h3 className="widget-title" style={{ margin: 0 }}>{activeTest.title}</h3>
            <div style={{ fontWeight: 'bold', color: '#666' }}>
              {Object.keys(selectedAnswers).length} / {activeQuestions.length} Answered
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>{activeTest.goal}</p>
          <p style={{ color: '#666', marginBottom: '20px', fontWeight: 600 }}>Topic: {activeTest.topic}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginBottom: '30px' }}>
            {activeQuestions.map((question, questionIndex) => (
              <div key={question.id} style={{ backgroundColor: '#f9fbfb', padding: '25px', borderRadius: '12px', border: '1px solid #eee' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#333', lineHeight: '1.5' }}>
                  <span style={{ color: '#f47b20', marginRight: '8px' }}>Q{questionIndex + 1}.</span> {question.question}
                </h4>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {Object.entries(question.optionsHash).map(([key, value]) => (
                    <label
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 15px',
                        backgroundColor: '#fff',
                        border: selectedAnswers[question.id] === key ? '2px solid #f47b20' : '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={selectedAnswers[question.id] === key}
                        onChange={() => handleSelectAnswer(question.id, key)}
                        style={{ accentColor: '#f47b20', transform: 'scale(1.2)' }}
                      />
                      <span style={{ fontWeight: 'bold' }}>{key}:</span>
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="step-actions" style={{ marginTop: '6px' }}>
            <button className="step-btn primary" onClick={handleSubmitTest} style={{ width: '100%', justifyContent: 'center', padding: '15px' }}>
              <i className="fas fa-check-double"></i>
              Submit & Evaluate Test
            </button>
            <button
              className="step-btn secondary"
              onClick={() => {
                setActiveTest(null);
                setActiveQuestions([]);
                setSelectedAnswers({});
                setTestState('selection');
              }}
              style={{ width: '100%', justifyContent: 'center', padding: '15px', marginTop: '10px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      <h1 className="section-title animate-on-scroll">Weekly Role Tests</h1>
      <p className="section-subtitle animate-on-scroll">
        One test is assigned per week. Complete the current week&apos;s test to unlock the next week.
      </p>

      {error && (
        <div style={{ backgroundColor: '#fdecea', color: '#e74c3c', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
          {error}
        </div>
      )}

      <div className="widget" style={{ marginBottom: '1.5rem', backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px', color: '#333' }}>Select Your Path</label>
        <select
          value={careerPath}
          onChange={(event) => setCareerPath(event.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', backgroundColor: '#fafafa' }}
        >
          {availableRoles.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <p style={{ margin: '15px 0 0 0', color: 'var(--text-secondary)' }}>
          <strong>Week 1 Goal:</strong> {weekGoals[0]}
        </p>
        {availableTopics.length > 0 && (
          <p style={{ margin: '10px 0 0 0', color: 'var(--text-secondary)' }}>
            <strong>Topics found in MongoDB:</strong> {availableTopics.join(', ')}
          </p>
        )}
        {!topicsLoaded && (
          <p style={{ margin: '10px 0 0 0', color: '#666' }}>
            Loading topics from MongoDB...
          </p>
        )}
      </div>

      <div className="stats-overview" style={{ marginBottom: '1rem' }}>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{overall.completedCount}/{overall.total}</h3>
            <p>Tests Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>{overall.avgScore}%</h3>
            <p>Average Score</p>
          </div>
        </div>
      </div>

      <div className="resources-grid">
        {tests.map((test) => (
          <div key={test.id} className="resource-card" style={{ alignItems: 'flex-start', cursor: 'default', opacity: !test.completed && unlockedTestId !== test.id ? 0.6 : 1 }}>
            <div className="resource-content" style={{ width: '100%' }}>
              <div className="resource-type">{`${test.week} • ${test.level}`}</div>
              <h4 className="resource-title">{test.title}</h4>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>{test.goal}</p>
              <p style={{ color: '#666', marginBottom: '8px', fontWeight: 600 }}>Topic: {test.topic}</p>
              <div className="resource-meta" style={{ marginBottom: '12px' }}>
                <span><i className="fas fa-database" style={{ color: '#f47b20', marginRight: '4px' }}></i> Up to {test.questions} stored questions</span>
                <span>{test.duration}</span>
              </div>

              {test.completed ? (
                <>
                  <p style={{ marginBottom: '10px' }}>
                    <strong>Score:</strong>{' '}
                    <span style={{ color: test.score >= 70 ? '#2ecc71' : test.score >= 50 ? '#f39c12' : '#e74c3c', fontSize: '1.1em', fontWeight: 'bold' }}>
                      {reports[test.id]?.correctCount ?? Math.round(((test.score || 0) / 100) * test.questions)} / {reports[test.id]?.totalQuestions ?? test.questions}
                    </span>
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Percentage: {test.score}% . {getScoreFeedback(test.score)}
                  </p>

                  {reports[test.id] && (
                    <div className="widget" style={{ marginTop: '12px', border: '1px solid #eee', backgroundColor: '#fdfdfd' }}>
                      <h4 className="widget-title" style={{ marginBottom: '12px', color: '#f47b20' }}>Evaluation</h4>
                      <p style={{ marginBottom: '8px' }}>
                        <strong>Correct:</strong> {reports[test.id].correctCount} / {reports[test.id].totalQuestions}
                      </p>
                      <p style={{ marginBottom: '12px' }}>
                        <strong>Wrong:</strong> {reports[test.id].totalQuestions - reports[test.id].correctCount}
                      </p>
                      <div className="ai-feedback-content" dangerouslySetInnerHTML={{ __html: reports[test.id].feedback }} style={{ fontSize: '0.95rem', lineHeight: '1.5' }}></div>

                      {reports[test.id].results?.some((item) => !item.isCorrect) && (
                        <div style={{ marginTop: '16px' }}>
                          <h4 style={{ marginBottom: '10px', color: '#333' }}>Wrong Answers Review</h4>
                          <div style={{ display: 'grid', gap: '10px' }}>
                            {reports[test.id].results.filter((item) => !item.isCorrect).map((item) => (
                              <div key={`${test.id}-${item.questionNumber}`} style={{ padding: '12px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#fff' }}>
                                <p style={{ marginBottom: '8px', fontWeight: 600 }}>
                                  Q{item.questionNumber}. {item.question}
                                </p>
                                <p style={{ marginBottom: '4px', color: '#c0392b' }}>
                                  Your answer: {item.selectedAnswer ? `${item.selectedAnswer} - ${item.selectedOptionText}` : 'Not answered'}
                                </p>
                                <p style={{ margin: 0, color: '#27ae60' }}>
                                  Correct answer: {item.correctAnswer} - {item.correctOptionText}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  {unlockedTestId === test.id ? 'Assigned for this week. Open and attempt now.' : 'Locked until previous week test is completed.'}
                </p>
              )}

              <div className="step-actions" style={{ marginTop: '12px' }}>
                <button
                  className="step-btn primary"
                  onClick={() => handleTakeTest(test.id)}
                  disabled={!test.completed && unlockedTestId !== test.id}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {test.completed ? <><i className="fas fa-redo"></i> Retake Test</> : unlockedTestId === test.id ? <><i className="fas fa-play"></i> Open Test</> : <><i className="fas fa-lock"></i> Locked</>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyTests;
