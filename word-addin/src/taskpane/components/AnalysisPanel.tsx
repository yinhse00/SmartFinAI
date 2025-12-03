import React, { useState, useEffect } from 'react';
import { wordService, DocumentContent } from '../WordService';
import { backendClient, AnalysisResult, Amendment } from '../BackendClient';
import { AmendmentCard } from './AmendmentCard';
import { ComplianceScore } from './ComplianceScore';
import { ReasoningSteps } from './ReasoningSteps';

interface AnalysisPanelProps {
  onSignOut: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ onSignOut }) => {
  const [documentContent, setDocumentContent] = useState<DocumentContent | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [userRequest, setUserRequest] = useState('');
  const [selectedSectionType, setSelectedSectionType] = useState('business');
  const [error, setError] = useState<string | null>(null);
  const [applyingAmendmentId, setApplyingAmendmentId] = useState<string | null>(null);
  const [dismissedAmendments, setDismissedAmendments] = useState<Set<string>>(new Set());

  const sectionTypes = [
    { value: 'business', label: 'Business Section' },
    { value: 'risk_factors', label: 'Risk Factors' },
    { value: 'financial', label: 'Financial Information' },
    { value: 'management', label: 'Management & Directors' },
    { value: 'corporate_governance', label: 'Corporate Governance' },
    { value: 'use_of_proceeds', label: 'Use of Proceeds' },
    { value: 'summary', label: 'Summary' },
  ];

  useEffect(() => {
    loadDocumentContent();
  }, []);

  const loadDocumentContent = async () => {
    try {
      const content = await wordService.getDocumentContent();
      setDocumentContent(content);
    } catch (err) {
      console.error('Error loading document:', err);
      setError('Failed to read document content');
    }
  };

  const handleAnalyze = async () => {
    if (!documentContent) {
      setError('No document content available');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setDismissedAmendments(new Set());

    try {
      const result = await backendClient.analyzeDocument({
        content: documentContent.text,
        sectionType: selectedSectionType,
        language: documentContent.language,
        userRequest: userRequest || undefined
      });

      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAmendment = async (amendment: Amendment) => {
    setApplyingAmendmentId(amendment.id);

    try {
      let success = false;

      if (amendment.type === 'track_change' && amendment.replacement) {
        success = await wordService.applyTrackChange(
          amendment.searchText,
          amendment.replacement,
          amendment.commentText || amendment.reason
        );
      } else if (amendment.commentText) {
        success = await wordService.addComment(
          amendment.searchText,
          amendment.commentText
        );
      }

      if (success) {
        await backendClient.logAmendmentAction(amendment.id, 'applied');
        // Remove from visible list
        setDismissedAmendments(prev => new Set([...prev, amendment.id]));
      } else {
        setError('Could not find the text in the document. It may have been modified.');
      }
    } catch (err) {
      console.error('Error applying amendment:', err);
      setError('Failed to apply amendment');
    } finally {
      setApplyingAmendmentId(null);
      await wordService.clearAllHighlights();
    }
  };

  const handleRejectAmendment = async (amendment: Amendment) => {
    await backendClient.logAmendmentAction(amendment.id, 'rejected');
    setDismissedAmendments(prev => new Set([...prev, amendment.id]));
    await wordService.clearAllHighlights();
  };

  const handlePreviewAmendment = async (amendment: Amendment) => {
    await wordService.clearAllHighlights();
    await wordService.highlightText(amendment.searchText, true);
  };

  const visibleAmendments = analysisResult?.amendments.filter(
    a => !dismissedAmendments.has(a.id)
  ) || [];

  const criticalCount = visibleAmendments.filter(a => a.severity === 'critical').length;
  const importantCount = visibleAmendments.filter(a => a.severity === 'important').length;

  return (
    <div className="analysis-panel">
      <div className="panel-header">
        <div className="header-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#0078D4">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span>IPO AI Assistant</span>
        </div>
        <button className="sign-out-button" onClick={onSignOut}>
          Sign Out
        </button>
      </div>

      {documentContent && (
        <div className="document-info">
          <div className="info-item">
            <span className="info-label">Words:</span>
            <span className="info-value">{documentContent.wordCount.toLocaleString()}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Language:</span>
            <span className="info-value">
              {documentContent.language === 'zh' ? '中文' : 
               documentContent.language === 'mixed' ? 'Mixed' : 'English'}
            </span>
          </div>
        </div>
      )}

      <div className="controls-section">
        <div className="control-group">
          <label>Document Section</label>
          <select 
            value={selectedSectionType}
            onChange={(e) => setSelectedSectionType(e.target.value)}
            disabled={isAnalyzing}
          >
            {sectionTypes.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Specific Request (Optional)</label>
          <textarea
            value={userRequest}
            onChange={(e) => setUserRequest(e.target.value)}
            placeholder="e.g., Focus on risk disclosure completeness..."
            disabled={isAnalyzing}
            rows={2}
          />
        </div>

        <button 
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !documentContent}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner"></span>
              Analyzing Document...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 011 1v3h3a1 1 0 110 2H9v3a1 1 0 11-2 0V9H4a1 1 0 110-2h3V4a1 1 0 011-1z"/>
              </svg>
              Analyze for Compliance
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 4h2v5H7V4zm0 6h2v2H7v-2z"/>
          </svg>
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {analysisResult && (
        <div className="results-section">
          <ComplianceScore
            score={analysisResult.complianceScore}
            amendmentCount={visibleAmendments.length}
            criticalCount={criticalCount}
            importantCount={importantCount}
          />

          <ReasoningSteps steps={analysisResult.reasoningSteps} />

          {analysisResult.missingElements.length > 0 && (
            <div className="missing-elements">
              <h3>Missing Required Elements</h3>
              <ul>
                {analysisResult.missingElements.map((element, i) => (
                  <li key={i}>{element}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="amendments-section">
            <h3>Suggested Amendments ({visibleAmendments.length})</h3>
            {visibleAmendments.length === 0 ? (
              <div className="no-amendments">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="#107C10">
                  <path d="M24 4C12.96 4 4 12.96 4 24s8.96 20 20 20 20-8.96 20-20S35.04 4 24 4zm-4 30l-10-10 2.82-2.82L20 28.34l15.18-15.18L38 16 20 34z"/>
                </svg>
                <p>All amendments have been addressed!</p>
              </div>
            ) : (
              visibleAmendments.map(amendment => (
                <AmendmentCard
                  key={amendment.id}
                  amendment={amendment}
                  onApply={handleApplyAmendment}
                  onReject={handleRejectAmendment}
                  onPreview={handlePreviewAmendment}
                  isApplying={applyingAmendmentId === amendment.id}
                />
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .analysis-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #faf9f8;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: white;
          border-bottom: 1px solid #edebe9;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #323130;
        }

        .sign-out-button {
          padding: 6px 12px;
          background: none;
          border: 1px solid #8a8886;
          border-radius: 4px;
          font-size: 12px;
          color: #605e5c;
          cursor: pointer;
        }

        .sign-out-button:hover {
          background: #f3f2f1;
        }

        .document-info {
          display: flex;
          gap: 16px;
          padding: 12px 16px;
          background: white;
          border-bottom: 1px solid #edebe9;
        }

        .info-item {
          display: flex;
          gap: 4px;
          font-size: 13px;
        }

        .info-label {
          color: #605e5c;
        }

        .info-value {
          font-weight: 600;
          color: #323130;
        }

        .controls-section {
          padding: 16px;
          background: white;
          border-bottom: 1px solid #edebe9;
        }

        .control-group {
          margin-bottom: 12px;
        }

        .control-group:last-of-type {
          margin-bottom: 16px;
        }

        .control-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #323130;
          margin-bottom: 6px;
        }

        .control-group select,
        .control-group textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #8a8886;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
        }

        .control-group select:focus,
        .control-group textarea:focus {
          outline: none;
          border-color: #0078D4;
          box-shadow: 0 0 0 1px #0078D4;
        }

        .control-group textarea {
          resize: vertical;
          min-height: 60px;
        }

        .analyze-button {
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
        }

        .analyze-button:hover:not(:disabled) {
          background: #106EBE;
        }

        .analyze-button:disabled {
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

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #FDE7E9;
          color: #A80000;
          font-size: 13px;
        }

        .error-banner button {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #A80000;
        }

        .results-section {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .missing-elements {
          background: #FFF4CE;
          border: 1px solid #8A6914;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .missing-elements h3 {
          font-size: 14px;
          font-weight: 600;
          color: #8A6914;
          margin: 0 0 8px 0;
        }

        .missing-elements ul {
          margin: 0;
          padding-left: 20px;
        }

        .missing-elements li {
          font-size: 13px;
          color: #605e5c;
          margin-bottom: 4px;
        }

        .amendments-section h3 {
          font-size: 14px;
          font-weight: 600;
          color: #323130;
          margin: 0 0 12px 0;
        }

        .no-amendments {
          text-align: center;
          padding: 32px;
          background: white;
          border: 1px solid #edebe9;
          border-radius: 8px;
        }

        .no-amendments p {
          margin: 12px 0 0;
          color: #107C10;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
