
import React from 'react';
import MessageStyleDark from './MessageStyleDark';

interface MessageStyleProps {
  isTypingComplete: boolean;
}

const MessageStyle: React.FC<MessageStyleProps> = ({ isTypingComplete }) => {
  return (
    <>
      <style>{`
        .grok-message {
          opacity: ${isTypingComplete ? 1 : 0};
          height: ${isTypingComplete ? 'auto' : 0};
          overflow: hidden;
          transition: opacity 0.3s ease;
        }
        .grok-message .paragraph {
          margin-bottom: 1rem;
        }
        .grok-message .code-block {
          background-color: #f8f9fc;
          border-radius: 6px;
          margin: 1rem 0;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .grok-message .code-block .code-header {
          background-color: #edf2f7;
          padding: 0.5rem 1rem;
          font-family: monospace;
          font-size: 0.875rem;
          color: #4a5568;
          border-bottom: 1px solid #e2e8f0;
        }
        .grok-message .code-block pre {
          padding: 1rem;
          overflow-x: auto;
          margin: 0;
        }
        .grok-message .code-block code {
          font-family: monospace;
          font-size: 0.875rem;
          color: #2d3748;
          background: transparent;
        }
        .grok-message .inline-code {
          background-color: #f1f5f9;
          padding: 0.1rem 0.3rem;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
          color: #4a5568;
        }
        .grok-message .bullet {
          color: #6366f1;
          display: inline-block;
          margin-right: 0.5rem;
        }
      `}</style>
      <MessageStyleDark />
    </>
  );
};

export default MessageStyle;
