import { useState } from 'react';

export default function TranscriptPanel({ transcript }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="clay-card clay-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif',
          fontSize: '0.92rem',
          color: '#2d2250',
          padding: 0,
        }}
      >
        <span style={{ fontWeight: 700 }}>📄 Full Transcript</span>
        <span style={{ fontSize: '0.8rem', color: '#7c6fa0', fontWeight: 600 }}>
          {isOpen ? '▲ Hide' : '▼ Show'}
        </span>
      </button>

      {isOpen && (
        <div style={{
          marginTop: 16,
          maxHeight: 300,
          overflowY: 'auto',
          borderTop: '2px solid #e8deff',
          paddingTop: 16,
        }}>
          <pre style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.82rem',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            color: '#3d3060',
            lineHeight: 1.7,
            margin: 0,
          }}>
            {transcript}
          </pre>
        </div>
      )}
    </div>
  );
}
