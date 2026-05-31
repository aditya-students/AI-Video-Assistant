import ReactMarkdown from 'react-markdown';

export default function ChatBubble({ role, text }) {
  const isUser = role === 'user';

  return (
    <div className={`chat-bubble ${isUser ? 'user' : 'ai'}`}>
      <p className="bubble-label">{isUser ? 'You' : '🤖 Assistant'}</p>
      <div className="bubble-content">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
