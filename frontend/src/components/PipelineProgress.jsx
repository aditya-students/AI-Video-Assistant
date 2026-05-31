import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getStatus, getResults } from '../api/client';

const STEPS = [
  { label: 'Downloading audio', hint: '~10–30s' },
  { label: 'Transcribing', hint: '~30–90s' },
  { label: 'Generating summary', hint: '~15–30s' },
  { label: 'Extracting insights', hint: '~15–30s' },
  { label: 'Building RAG index', hint: '~5–10s' },
];

export default function PipelineProgress() {
  const { jobId, currentStep, status, errorMessage, update, setResults } = useSession();
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (status !== 'running' || !jobId) return;

    const poll = async () => {
      try {
        const { data } = await getStatus(jobId);
        update({
          currentStep: data.step,
          stepName: data.step_name,
        });

        if (data.status === 'done') {
          clearInterval(intervalRef.current);
          const results = await getResults(jobId);
          setResults(results.data);
          navigate('/results');
        } else if (data.status === 'error') {
          clearInterval(intervalRef.current);
          update({ status: 'error', errorMessage: data.error || 'Processing failed' });
        }
      } catch (err) {
        clearInterval(intervalRef.current);
        update({
          status: 'error',
          errorMessage: err.response?.data?.detail || 'Failed to connect to server',
        });
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => clearInterval(intervalRef.current);
  }, [status, jobId]);

  if (status === 'error') {
    return (
      <div className="clay-error slide-up" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 8 }}>❌ Something went wrong</h3>
        <p>{errorMessage || 'An unknown error occurred'}</p>
      </div>
    );
  }

  if (status !== 'running') return null;

  const progress = Math.max(0, Math.min(100, (currentStep / STEPS.length) * 100));

  return (
    <div className="clay-card clay-white slide-up" style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 18, fontSize: '1.05rem' }}>⚙️ Processing your video...</h3>

      <div className="pipeline-steps">
        {STEPS.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div key={i} className="pipeline-step">
              <div className={`step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`} />
              <div style={{ flex: 1 }}>
                <span style={{
                  fontWeight: isActive ? 700 : 500,
                  color: isDone ? '#4aad8a' : isActive ? '#1e1446' : '#a898c8',
                  fontSize: '0.88rem',
                }}>
                  {step.label}
                </span>
                {isActive && (
                  <span style={{ fontSize: '0.72rem', color: '#7c6fa0', marginLeft: 8 }}>
                    {step.hint}
                  </span>
                )}
              </div>
              {isDone && <span style={{ color: '#4aad8a', fontWeight: 700 }}>✓</span>}
            </div>
          );
        })}
      </div>

      <div className="clay-progress" style={{ marginTop: 18 }}>
        <div className="clay-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
