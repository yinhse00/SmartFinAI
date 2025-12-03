import React from 'react';

interface ComplianceScoreProps {
  score: number;
  amendmentCount: number;
  criticalCount: number;
  importantCount: number;
}

export const ComplianceScore: React.FC<ComplianceScoreProps> = ({
  score,
  amendmentCount,
  criticalCount,
  importantCount
}) => {
  const getScoreColor = () => {
    if (score >= 80) return '#107C10';
    if (score >= 60) return '#8A6914';
    return '#A80000';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Needs Work';
    return 'Critical Issues';
  };

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="compliance-score">
      <div className="score-circle-container">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#edebe9"
            strokeWidth="10"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={getScoreColor()}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="score-value">
          <span className="score-number" style={{ color: getScoreColor() }}>
            {score}
          </span>
          <span className="score-percent">%</span>
        </div>
      </div>

      <div className="score-label" style={{ color: getScoreColor() }}>
        {getScoreLabel()}
      </div>

      <div className="score-breakdown">
        <div className="breakdown-item">
          <span className="breakdown-count">{amendmentCount}</span>
          <span className="breakdown-label">Total Issues</span>
        </div>
        <div className="breakdown-divider"></div>
        <div className="breakdown-item critical">
          <span className="breakdown-count">{criticalCount}</span>
          <span className="breakdown-label">Critical</span>
        </div>
        <div className="breakdown-divider"></div>
        <div className="breakdown-item important">
          <span className="breakdown-count">{importantCount}</span>
          <span className="breakdown-label">Important</span>
        </div>
      </div>

      <style>{`
        .compliance-score {
          text-align: center;
          padding: 20px;
          background: white;
          border: 1px solid #edebe9;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .score-circle-container {
          position: relative;
          display: inline-block;
          margin-bottom: 8px;
        }

        .score-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: baseline;
        }

        .score-number {
          font-size: 32px;
          font-weight: 700;
        }

        .score-percent {
          font-size: 16px;
          color: #605e5c;
        }

        .score-label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .score-breakdown {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid #edebe9;
        }

        .breakdown-item {
          text-align: center;
        }

        .breakdown-count {
          display: block;
          font-size: 20px;
          font-weight: 600;
          color: #323130;
        }

        .breakdown-item.critical .breakdown-count {
          color: #A80000;
        }

        .breakdown-item.important .breakdown-count {
          color: #8A6914;
        }

        .breakdown-label {
          font-size: 11px;
          color: #605e5c;
          text-transform: uppercase;
        }

        .breakdown-divider {
          width: 1px;
          height: 32px;
          background: #edebe9;
        }
      `}</style>
    </div>
  );
};
