import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { chatWithVideo } from '../api/client';
import ChatBubble from '../components/ChatBubble';

const SUGGESTIONS = [
  'Summarize in one sentence',
  'Who owns what tasks?',
  'What was left unresolved?',
  'What key decisions were made?',
];

export default function ChatPage() {
  const { jobId, chatHistory, addChat, status } = useSession();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [chatHistory, loading]);

  if (!jobId || status !== 'done') {
    return (
      <div className="clay-card clay-lavender slide-up" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <h2 style={{ marginBottom: 12 }}>💬 No video to chat with</h2>
        <p style={{ color: '#5a4d80', marginBottom: 20 }}>
          Analyze a video first, then come back to chat about it.
        </p>
        <button className="clay-btn" onClick={() => navigate('/')}>
          ← Go to Analyze
        </button>
      </div>
    );
  }

  const handleSend = async (text) => {
    const question = (text || input).trim();
    if (!question || loading) return;

    addChat('user', question);
    setInput('');
    setLoading(true);

    try {
      const { data } = await chatWithVideo(jobId, question);
      addChat('ai', data.answer);
    } catch (err) {
      addChat('ai', '❌ Sorry, I couldn\'t process that question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <div className="clay-card clay-lavender slide-up" style={{ padding: '24px 28px' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: 4 }}>💬 Chat with your video</h2>
        <p style={{ color: '#5a4d80', fontSize: '0.88rem' }}>
          Ask anything — answers come only from the transcript
        </p>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '20px 4px',
        minHeight: 0,
      }}>
        {chatHistory.length === 0 && (
          <div className="chat-bubble ai">
            <p className="bubble-label">🤖 Assistant</p>
            <p>Hey! I've analyzed your video. Ask me anything about it.</p>
          </div>
        )}

        {chatHistory.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role} text={msg.text} />
        ))}

        {loading && (
          <div className="chat-bubble ai">
            <p className="bubble-label">🤖 Assistant</p>
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {chatHistory.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 4px 12px' }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} className="clay-pill" onClick={() => handleSend(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: 'flex',
        gap: 12,
        padding: '16px 0 4px',
        borderTop: '2px solid #e8deff',
      }}>
        <input
          id="chat-input"
          type="text"
          className="clay-input"
          placeholder="Ask a question about the video…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button
          id="chat-send-btn"
          className="clay-btn"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
