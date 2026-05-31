import ReactMarkdown from 'react-markdown';

export default function ResultCard({ icon, label, content, variant, className = '' }) {
  return (
    <div className={`clay-card ${variant} ${className}`}>
      <p className="text-uppercase text-muted" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        {label}
      </p>
      <div className="result-card-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
