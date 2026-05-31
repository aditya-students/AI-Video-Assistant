import { useState, useRef } from 'react';
import { useSession } from '../context/SessionContext';
import { analyzeVideo } from '../api/client';
import PipelineProgress from '../components/PipelineProgress';

const ACCEPTED = '.mp4,.mp3,.wav,.m4a,.webm,.ogg';

export default function AnalyzePage() {
  const { status, update } = useSession();
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('english');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const isRunning = status === 'running';

  const handleSubmit = async () => {
    const source = url.trim() || (file ? file.name : '');
    if (!source) return;

    update({ status: 'running', currentStep: 0, stepName: '', language, errorMessage: '' });

    try {
      const { data } = await analyzeVideo(source, language);
      update({ jobId: data.job_id });
    } catch (err) {
      update({
        status: 'error',
        errorMessage: err.response?.data?.detail || 'Failed to start analysis. Is the backend running?',
      });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setUrl('');
    }
  };

  return (
    <div className="analyze-page">
      {/* Hero */}
      <div className="clay-card clay-lavender slide-up" style={{ textAlign: 'center', padding: '40px 32px' }}>
        <h1 className="display-heading" style={{ fontSize: '2rem', marginBottom: 10 }}>
          Analyze any video with AI
        </h1>
        <p style={{ fontSize: '1rem', color: '#5a4d80', maxWidth: 560, margin: '0 auto' }}>
          Paste a YouTube link or upload a local file to get a summary, action items, decisions, and more.
        </p>
      </div>

      {/* Input card */}
      <div className="clay-card clay-white slide-up slide-up-2" style={{ maxWidth: 680, margin: '24px auto 0', padding: '32px' }}>
        <input
          id="youtube-url-input"
          type="text"
          className="clay-input"
          placeholder="Paste a YouTube URL…"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setFile(null); }}
          disabled={isRunning}
        />

        <div className="clay-divider">or</div>

        <div
          className={`clay-dropzone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="dropzone-icon">📁</div>
          {file ? (
            <p className="dropzone-file">{file.name}</p>
          ) : (
            <p>Drag & drop a file here, or click to browse<br />
              <span className="text-small text-muted">.mp4, .mp3, .wav supported</span>
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            style={{ display: 'none' }}
            onChange={(e) => { setFile(e.target.files[0]); setUrl(''); }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button
            className={`clay-pill ${language === 'english' ? 'active' : ''}`}
            onClick={() => setLanguage('english')}
          >
            🇺🇸 English
          </button>
          <button
            className={`clay-pill ${language === 'hinglish' ? 'active' : ''}`}
            onClick={() => setLanguage('hinglish')}
          >
            🇮🇳 Hinglish
          </button>
        </div>

        <button
          id="analyze-button"
          className="clay-btn clay-btn-full"
          style={{ marginTop: 24 }}
          onClick={handleSubmit}
          disabled={isRunning || (!url.trim() && !file)}
        >
          ✨ Analyze Video
        </button>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <PipelineProgress />
      </div>
    </div>
  );
}
