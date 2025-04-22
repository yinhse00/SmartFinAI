
import React from 'react';

const MessageStyleDark: React.FC = () => {
  return (
    <style>{`
      @media (prefers-color-scheme: dark) {
        .grok-message .code-block {
          background-color: #1e293b;
          border-color: #334155;
        }
        .grok-message .code-block .code-header {
          background-color: #0f172a;
          color: #cbd5e1;
          border-color: #334155;
        }
        .grok-message .code-block code {
          color: #e2e8f0;
        }
        .grok-message .inline-code {
          background-color: #1e293b;
          color: #e2e8f0;
        }
      }
    `}</style>
  );
};

export default MessageStyleDark;
