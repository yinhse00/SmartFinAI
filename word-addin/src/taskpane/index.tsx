import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { wordService } from './WordService';
import { backendClient } from './BackendClient';
import { LoginPanel } from './components/LoginPanel';
import { AnalysisPanel } from './components/AnalysisPanel';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeAddin();
  }, []);

  const initializeAddin = async () => {
    try {
      // Initialize Office.js
      const officeReady = await wordService.initialize();
      if (!officeReady) {
        setInitError('Failed to initialize Office.js. Please ensure you are running inside Microsoft Word.');
        return;
      }

      // Check if user is already authenticated
      const authenticated = await backendClient.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsInitialized(true);
    } catch (error) {
      console.error('Initialization error:', error);
      setInitError('Failed to initialize the add-in');
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleSignOut = async () => {
    await backendClient.signOut();
    setIsAuthenticated(false);
  };

  if (initError) {
    return (
      <div className="init-error">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="#A80000">
          <path d="M24 4C12.96 4 4 12.96 4 24s8.96 20 20 20 20-8.96 20-20S35.04 4 24 4zm2 30h-4v-4h4v4zm0-8h-4V14h4v12z"/>
        </svg>
        <h2>Initialization Error</h2>
        <p>{initError}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
        <style>{`
          .init-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            padding: 24px;
            text-align: center;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .init-error h2 {
            margin: 16px 0 8px;
            color: #323130;
          }
          .init-error p {
            color: #605e5c;
            margin-bottom: 24px;
          }
          .init-error button {
            padding: 10px 24px;
            background: #0078D4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Initializing IPO AI Assistant...</p>
        <style>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #edebe9;
            border-top-color: #0078D4;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-screen p {
            margin-top: 16px;
            color: #605e5c;
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPanel onLoginSuccess={handleLoginSuccess} />;
  }

  return <AnalysisPanel onSignOut={handleSignOut} />;
};

// Wait for Office.js to be ready before rendering
Office.onReady(() => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
});
