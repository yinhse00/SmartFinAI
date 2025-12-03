import React, { useState } from 'react';
import { Amendment } from '../BackendClient';

interface AmendmentCardProps {
  amendment: Amendment;
  onApply: (amendment: Amendment) => void;
  onReject: (amendment: Amendment) => void;
  onPreview: (amendment: Amendment) => void;
  isApplying?: boolean;
}

export const AmendmentCard: React.FC<AmendmentCardProps> = ({
  amendment,
  onApply,
  onReject,
  onPreview,
  isApplying = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: '#FDE7E9', border: '#A80000', icon: '#A80000' };
      case 'important': return { bg: '#FFF4CE', border: '#8A6914', icon: '#8A6914' };
      default: return { bg: '#DFF6DD', border: '#107C10', icon: '#107C10' };
    }
  };

  const colors = getSeverityColor(amendment.severity);

  const getSeverityIcon = () => {
    switch (amendment.severity) {
      case 'critical':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill={colors.icon}>
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 4h2v5H7V4zm0 6h2v2H7v-2z"/>
          </svg>
        );
      case 'important':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill={colors.icon}>
            <path d="M8 1L1 14h14L8 1zm-.5 4h1v5h-1V5zm0 6h1v1h-1v-1z"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill={colors.icon}>
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3h1v1h-1V4zm0 2h1v6h-1V6z"/>
          </svg>
        );
    }
  };

  return (
    <div className="amendment-card" style={{ borderLeftColor: colors.border }}>
      <div className="amendment-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="severity-badge" style={{ backgroundColor: colors.bg }}>
          {getSeverityIcon()}
          <span style={{ color: colors.icon }}>{amendment.severity}</span>
        </div>
        <div className="amendment-type">
          {amendment.type === 'track_change' ? (
            <span className="type-badge track-change">Track Change</span>
          ) : (
            <span className="type-badge comment">Comment</span>
          )}
        </div>
        <button className="expand-button">
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
          >
            <path d="M2 4l4 4 4-4" stroke="#605e5c" strokeWidth="2" fill="none"/>
          </svg>
        </button>
      </div>

      <div className="amendment-reason">
        {amendment.reason}
      </div>

      {isExpanded && (
        <div className="amendment-details">
          <div className="detail-section">
            <label>Original Text:</label>
            <div className="text-preview original">
              {amendment.searchText.length > 200 
                ? `${amendment.searchText.substring(0, 200)}...` 
                : amendment.searchText}
            </div>
          </div>

          {amendment.type === 'track_change' && amendment.replacement && (
            <div className="detail-section">
              <label>Suggested Change:</label>
              <div className="text-preview replacement">
                {amendment.replacement.length > 200 
                  ? `${amendment.replacement.substring(0, 200)}...` 
                  : amendment.replacement}
              </div>
            </div>
          )}

          {amendment.regulatoryCitation && (
            <div className="detail-section">
              <label>Regulatory Reference:</label>
              <div className="citation">
                {amendment.regulatoryCitation}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="amendment-actions">
        <button 
          className="action-button preview"
          onClick={() => onPreview(amendment)}
          title="Preview in document"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3C4.36 3 1.26 5.28 0 8.5c1.26 3.22 4.36 5.5 8 5.5s6.74-2.28 8-5.5C14.74 5.28 11.64 3 8 3zm0 9a3.5 3.5 0 110-7 3.5 3.5 0 010 7zm0-5.5a2 2 0 100 4 2 2 0 000-4z"/>
          </svg>
          Preview
        </button>
        <button 
          className="action-button reject"
          onClick={() => onReject(amendment)}
          title="Dismiss this suggestion"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
          </svg>
          Dismiss
        </button>
        <button 
          className="action-button apply"
          onClick={() => onApply(amendment)}
          disabled={isApplying}
          title="Apply this change to the document"
        >
          {isApplying ? (
            <span className="spinner-small"></span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
            </svg>
          )}
          Apply
        </button>
      </div>

      <style>{`
        .amendment-card {
          background: white;
          border: 1px solid #edebe9;
          border-left: 4px solid;
          border-radius: 4px;
          margin-bottom: 12px;
          overflow: hidden;
        }

        .amendment-header {
          display: flex;
          align-items: center;
          padding: 12px;
          cursor: pointer;
          gap: 8px;
        }

        .severity-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .amendment-type {
          flex: 1;
        }

        .type-badge {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 500;
        }

        .type-badge.track-change {
          background: #E1DFDD;
          color: #323130;
        }

        .type-badge.comment {
          background: #DEECF9;
          color: #0078D4;
        }

        .expand-button {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
        }

        .expand-button svg {
          transition: transform 0.2s;
        }

        .amendment-reason {
          padding: 0 12px 12px;
          font-size: 14px;
          color: #323130;
          line-height: 1.5;
        }

        .amendment-details {
          padding: 0 12px 12px;
          border-top: 1px solid #edebe9;
          margin-top: 8px;
          padding-top: 12px;
        }

        .detail-section {
          margin-bottom: 12px;
        }

        .detail-section:last-child {
          margin-bottom: 0;
        }

        .detail-section label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #605e5c;
          margin-bottom: 4px;
        }

        .text-preview {
          font-size: 13px;
          padding: 8px;
          border-radius: 4px;
          font-family: 'Consolas', monospace;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .text-preview.original {
          background: #FDE7E9;
          color: #A80000;
        }

        .text-preview.replacement {
          background: #DFF6DD;
          color: #107C10;
        }

        .citation {
          font-size: 13px;
          color: #0078D4;
          background: #F3F2F1;
          padding: 8px;
          border-radius: 4px;
        }

        .amendment-actions {
          display: flex;
          gap: 8px;
          padding: 12px;
          background: #faf9f8;
          border-top: 1px solid #edebe9;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border: 1px solid #8a8886;
          border-radius: 4px;
          background: white;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button:hover:not(:disabled) {
          background: #f3f2f1;
        }

        .action-button.preview {
          color: #0078D4;
          border-color: #0078D4;
        }

        .action-button.reject {
          color: #A80000;
          border-color: #A80000;
        }

        .action-button.apply {
          background: #107C10;
          color: white;
          border-color: #107C10;
          flex: 1;
          justify-content: center;
        }

        .action-button.apply:hover:not(:disabled) {
          background: #0B5A0B;
        }

        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 14px;
          height: 14px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
