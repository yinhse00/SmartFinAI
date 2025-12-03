import React, { useState } from 'react';
import { backendClient } from '../BackendClient';

interface LoginPanelProps {
  onLoginSuccess: () => void;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await backendClient.signIn(email, password);
    
    setIsLoading(false);
    
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Failed to sign in');
    }
  };

  return (
    <div className="login-panel">
      <div className="login-header">
        <div className="logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="8" fill="#0078D4"/>
            <path d="M12 16h24v2H12zM12 22h20v2H12zM12 28h24v2H12zM12 34h16v2H12z" fill="white"/>
            <circle cx="38" cy="38" r="8" fill="#107C10"/>
            <path d="M35 38l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
          </svg>
        </div>
        <h1>IPO AI Assistant</h1>
        <p>Sign in to analyze your prospectus documents</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 4h2v5H7V4zm0 6h2v2H7v-2z"/>
            </svg>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
        </div>

        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="login-footer">
        <p>Don't have an account? Contact your administrator.</p>
      </div>

      <style>{`
        .login-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 24px;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          margin-bottom: 16px;
        }

        .login-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #323130;
          margin: 0 0 8px 0;
        }

        .login-header p {
          font-size: 14px;
          color: #605e5c;
          margin: 0;
        }

        .login-form {
          flex: 1;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #FDE7E9;
          border-radius: 4px;
          color: #A80000;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #323130;
          margin-bottom: 6px;
        }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #8a8886;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #0078D4;
          box-shadow: 0 0 0 1px #0078D4;
        }

        .form-group input:disabled {
          background: #f3f2f1;
        }

        .login-button {
          width: 100%;
          padding: 12px;
          background: #0078D4;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .login-button:hover:not(:disabled) {
          background: #106EBE;
        }

        .login-button:disabled {
          background: #c8c6c4;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          text-align: center;
          padding-top: 16px;
          border-top: 1px solid #edebe9;
        }

        .login-footer p {
          font-size: 12px;
          color: #605e5c;
          margin: 0;
        }
      `}</style>
    </div>
  );
};
