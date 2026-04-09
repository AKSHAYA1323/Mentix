import { useMemo, useState } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const mentorFallback = (input) => {
  const text = input.toLowerCase();

  if (text.includes('resume')) {
    return 'Focus your resume on measurable outcomes: impact, metrics, and tech stack per project. Keep it concise and role-specific.';
  }
  if (text.includes('roadmap') || text.includes('plan')) {
    return 'A strong roadmap starts with fundamentals, then one guided project, then one independent project per skill area.';
  }
  if (text.includes('interview')) {
    return 'Use a loop: concept review, timed mock, feedback notes, and spaced repetition of weak topics every 3 days.';
  }
  if (text.includes('project')) {
    return 'Pick projects with clear scope: problem, users, architecture, deployment, and measurable result.';
  }

  return 'I can help with resume improvement, skill roadmaps, projects, interview prep, and learning strategy. Ask me a specific goal.';
};

const MentorAssistant = () => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi, I am your mentor assistant. Ask for resume guidance, roadmap planning, interview prep, or project feedback.',
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !isSending, [input, isSending]);

  const handleSend = async () => {
    if (!canSend) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res.ok) {
        throw new Error('Chat service error');
      }

      const data = await res.json();
      const reply = typeof data.reply === 'string' && data.reply.trim()
        ? data.reply
        : mentorFallback(userMessage);

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      const fallbackReply = mentorFallback(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `${fallbackReply} (Using offline mentor mode because chat API is unavailable.)`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page active">
      <h1 className="section-title animate-on-scroll">Mentor Assistant</h1>
      <p className="section-subtitle animate-on-scroll">
        Chat with your mentor assistant for guidance on skills, projects, resume, and interviews.
      </p>

      <div className="ai-panel active" style={{ position: 'relative', width: '100%', height: '520px', display: 'flex' }}>
        <div className="ai-header">
          <h4>Mentor Chat</h4>
        </div>

        <div className="ai-messages">
          {messages.map((message, index) => (
            <div key={index} className={`ai-message ${message.role === 'user' ? 'user' : 'bot'}`}>
              {message.text}
            </div>
          ))}
        </div>

        <div className="ai-input-container">
          <input
            type="text"
            className="ai-input"
            placeholder="Ask for guidance..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button className="ai-send" onClick={handleSend} disabled={!canSend}>
            <i className={`fas ${isSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorAssistant;
