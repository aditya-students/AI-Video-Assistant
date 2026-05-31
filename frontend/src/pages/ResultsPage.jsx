import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import ResultCard from '../components/ResultCard';
import TranscriptPanel from '../components/TranscriptPanel';

export default function ResultsPage() {
  const { title, summary, actionItems, keyDecisions, openQuestions, transcript, status } = useSession();
  const navigate = useNavigate();

  if (status !== 'done' || !summary) {
    return (
      <div className="clay-card clay-lavender slide-up" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <h2 style={{ marginBottom: 12 }}>🔍 No video analyzed yet</h2>
        <p style={{ color: '#5a4d80', marginBottom: 20 }}>
          Head over to the Analyze page to process a video first.
        </p>
        <button className="clay-btn" onClick={() => navigate('/')}>
          ← Go to Analyze
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Title card */}
      <div className="clay-card clay-mint slide-up" style={{ textAlign: 'center', padding: '36px 32px' }}>
        <h1 className="display-heading" style={{ fontSize: '1.75rem', marginBottom: 8 }}>
          {title}
        </h1>
        <p style={{ color: '#2e7d5e', fontSize: '0.95rem' }}>
          Here's what AI found in your video
        </p>
      </div>

      {/* Results grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 20,
        marginTop: 24,
      }}>
        <ResultCard icon="📝" label="Summary" content={summary} variant="clay-sky" className="slide-up slide-up-1" />
        <ResultCard icon="✅" label="Action Items" content={actionItems} variant="clay-butter" className="slide-up slide-up-2" />
        <ResultCard icon="🔑" label="Key Decisions" content={keyDecisions} variant="clay-peach" className="slide-up slide-up-3" />
        <ResultCard icon="❓" label="Open Questions" content={openQuestions} variant="clay-lavender" className="slide-up slide-up-4" />
      </div>

      {/* Transcript */}
      <div className="slide-up slide-up-5" style={{ marginTop: 24 }}>
        <TranscriptPanel transcript={transcript} />
      </div>

      {/* Sticky bottom bar */}
      <div className="clay-sticky-bar slide-up">
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>💬 Ready to ask questions?</span>
        <button className="clay-btn" onClick={() => navigate('/chat')}>
          Open Chat →
        </button>
      </div>
    </div>
  );
}
