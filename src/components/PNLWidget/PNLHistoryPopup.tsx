import React from 'react';
import './PNLHistoryPopup.css';

interface PNLHistoryEntry {
  id: string;
  date: string;
  amount: number;
  currency: string;
  type: 'gain' | 'loss';
}

interface PNLHistoryPopupProps {
  onClose: () => void;
}

const PNLHistoryPopup: React.FC<PNLHistoryPopupProps> = ({ onClose }) => {
  // Mock data - replace with actual data later
  const historyEntries: PNLHistoryEntry[] = [
    { id: '1', date: '9/16/2025, 12:59:11 AM', amount: -0.054, currency: 'MON', type: 'loss' },
    { id: '2', date: '9/16/2025, 12:48:43 AM', amount: 0.0515, currency: 'MON', type: 'gain' },
    { id: '3', date: '9/16/2025, 12:47:29 AM', amount: 0.1234, currency: 'MON', type: 'gain' },
    { id: '4', date: '9/16/2025, 12:47:06 AM', amount: -0.104, currency: 'MON', type: 'loss' },
    { id: '5', date: '9/16/2025, 12:46:17 AM', amount: -0.1, currency: 'MON', type: 'loss' },
    { id: '6', date: '9/16/2025, 12:42:10 AM', amount: -0.05, currency: 'MON', type: 'loss' },
    { id: '7', date: '9/16/2025, 12:40:57 AM', amount: 0.1034, currency: 'MON', type: 'gain' },
    { id: '8', date: '9/16/2025, 12:39:00 AM', amount: -0.104, currency: 'MON', type: 'loss' },
  ];

  const handleDelete = (id: string) => {
    console.log('Delete entry:', id);
    // Implement delete functionality
  };

  return (
    <div className="pnl-history-backdrop" onClick={onClose}>
      <div className="pnl-history-popup" onClick={(e) => e.stopPropagation()}>
        <div className="pnl-history-header">
          <h2 className="pnl-history-title">PNL History</h2>
          <button className="pnl-history-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="pnl-history-content">
          <div className="pnl-history-list">
            {historyEntries.map((entry) => (
              <div key={entry.id} className="pnl-history-entry">
                <div className="pnl-history-entry-left">
                  <div className="pnl-history-entry-label">- {entry.currency}</div>
                  <div className="pnl-history-entry-date">{entry.date}</div>
                </div>
                <div className="pnl-history-entry-right">
                  <div className={`pnl-history-entry-amount ${entry.type === 'gain' ? 'positive' : 'negative'}`}>
                    {entry.type === 'gain' ? '+' : ''}{entry.amount} {entry.currency}
                  </div>
                  <button
                    className="pnl-history-delete-btn"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pnl-history-footer">
            <span className="pnl-history-footer-text">Last 21 entries</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PNLHistoryPopup;
