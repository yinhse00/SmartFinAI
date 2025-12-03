import React, { useState } from 'react';
import { ReasoningStep } from '../BackendClient';

interface ReasoningStepsProps {
  steps: ReasoningStep[];
}

export const ReasoningSteps: React.FC<ReasoningStepsProps> = ({ steps }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="reasoning-steps">
      <button 
        className="reasoning-header" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="header-left">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="#0078D4">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 017 8V4a1 1 0 011-1z"/>
          </svg>
          <span>AI Analysis Process</span>
        </div>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M2 4l4 4 4-4" stroke="#605e5c" strokeWidth="2" fill="none"/>
        </svg>
      </button>

      {isExpanded && (
        <div className="steps-list">
          {steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{step.step}</div>
              <div className="step-content">
                <div className="step-action">{step.action}</div>
                <div className="step-detail">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .reasoning-steps {
          background: #f8f8f8;
          border: 1px solid #edebe9;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .reasoning-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #323130;
        }

        .reasoning-header:hover {
          background: #f3f2f1;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .steps-list {
          padding: 0 16px 16px;
        }

        .step-item {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #edebe9;
        }

        .step-item:last-child {
          border-bottom: none;
        }

        .step-number {
          width: 24px;
          height: 24px;
          background: #0078D4;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-action {
          font-size: 13px;
          font-weight: 600;
          color: #323130;
          margin-bottom: 4px;
        }

        .step-detail {
          font-size: 12px;
          color: #605e5c;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};
