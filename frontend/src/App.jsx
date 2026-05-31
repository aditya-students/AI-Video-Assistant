import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import Sidebar from './components/Sidebar';
import AnalyzePage from './pages/AnalyzePage';
import ResultsPage from './pages/ResultsPage';
import ChatPage from './pages/ChatPage';

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <div style={{
          display: 'flex',
          gap: 24,
          padding: 24,
          minHeight: '100vh',
          maxWidth: 1280,
          margin: '0 auto',
        }}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0 }}>
            <Routes>
              <Route path="/" element={<AnalyzePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Routes>
          </main>
        </div>
      </SessionProvider>
    </BrowserRouter>
  );
}
