import React, { useState } from 'react';
import './CopyButton.css';

interface CopyButtonProps {
  textToCopy: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = (e: any) => {
    e.stopPropagation()
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);

    setTimeout(() => {
      setCopySuccess(false);
    }, 3000);
  };

  return (
    <div className="copy-wrapper" onClick={(e) => {handleCopy(e)}}>
      <div className="icon-container">
        <svg
          className={`copy-icon ${copySuccess ? 'hidden' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#b8b7b7"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>

        <svg
          className={`check-icon ${copySuccess ? 'visible' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 6-6" />
        </svg>
      </div>
    </div>
  );
};

export default CopyButton;
