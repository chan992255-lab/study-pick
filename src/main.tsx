import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { StudyProvider } from './context/StudyContext';
import { ToastProvider } from './context/ToastContext';
import './index.css';

// 홈 화면에 추가한 앱이 오프라인에서도 열리도록 서비스 워커를 등록한다.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 등록 실패는 앱 동작에 영향을 주지 않는다. */
    });
  });
}

const container = document.getElementById('root');
if (!container) throw new Error('#root 를 찾을 수 없습니다.');

createRoot(container).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <StudyProvider>
          <App />
        </StudyProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
