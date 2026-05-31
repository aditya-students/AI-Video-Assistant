import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SessionContext = createContext(null);

const STORAGE_KEY = 'ai-video-assistant-session';

const defaultState = {
  jobId: null,
  language: 'english',
  title: '',
  transcript: '',
  summary: '',
  actionItems: '',
  keyDecisions: '',
  openQuestions: '',
  chatHistory: [],
  currentStep: 0,
  stepName: '',
  status: 'idle',
  errorMessage: '',
};

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return { ...defaultState, ...JSON.parse(data) };
  } catch (e) { /* ignore */ }
  return { ...defaultState };
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

export function SessionProvider({ children }) {
  const [state, setState] = useState(loadFromStorage);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const update = useCallback((partial) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setResults = useCallback((data) => {
    setState((prev) => ({
      ...prev,
      title: data.title || '',
      transcript: data.transcript || '',
      summary: data.summary || '',
      actionItems: data.action_items || '',
      keyDecisions: data.key_decisions || '',
      openQuestions: data.open_questions || '',
      status: 'done',
    }));
  }, []);

  const addChat = useCallback((role, text) => {
    setState((prev) => ({
      ...prev,
      chatHistory: [...prev.chatHistory, { role, text, id: Date.now() }],
    }));
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ ...defaultState });
  }, []);

  return (
    <SessionContext.Provider value={{ ...state, update, setResults, addChat, reset }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
