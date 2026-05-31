import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeVideo = (source, language) =>
  api.post('/analyze', { source, language });

export const analyzeFile = (file, language) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', language);
  return api.post('/analyze-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getStatus = (jobId) =>
  api.get(`/status/${jobId}`);

export const getResults = (jobId) =>
  api.get(`/results/${jobId}`);

export const chatWithVideo = (jobId, question) =>
  api.post('/chat', { job_id: jobId, question });

export default api;
