import React, { useState } from 'react';
import closebutton from '../../assets/close_button.png';
import './RequestAccessModal.css';

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string | undefined;
}

const RequestAccessModal: React.FC<RequestAccessModalProps> = ({
  isOpen,
  onClose,
  address,
}) => {
  const [twitter, setTwitter] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!twitter.trim()) {
      return;
    }

    // Open Twitter DM or create a pre-filled tweet
    const message = `Hi @CrystalExch, I'd like to request access to the referral program.\n\nWallet: ${address}\nTwitter: ${twitter}\nReason: ${reason || 'N/A'}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;

    window.open(twitterUrl, '_blank');
    setSubmitted(true);

    // Auto-close after showing success message
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setSubmitted(false);
    setTwitter('');
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="request-modal-overlay" onClick={handleClose}>
      <div className="request-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="request-modal-header">
          <h2 className="request-modal-title">Request Referral Access</h2>
          <button className="request-modal-close" onClick={handleClose}>
            <img src={closebutton} className="close-button-icon" alt="Close" />
          </button>
        </div>

        {!submitted ? (
          <>
            <div className="request-modal-body">
              <p className="request-modal-description">
                The referral program is currently invite-only. Submit your information to request access.
              </p>

              <div className="request-input-group">
                <label className="request-input-label">Wallet Address</label>
                <input
                  type="text"
                  className="request-input"
                  value={address || ''}
                  disabled
                />
              </div>

              <div className="request-input-group">
                <label className="request-input-label">
                  Twitter Handle <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="request-input"
                  placeholder="@yourhandle"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="request-input-group">
                <label className="request-input-label">
                  Why do you want to join? (Optional)
                </label>
                <textarea
                  className="request-textarea"
                  placeholder="Tell us about your community, reach, or why you'd be a great affiliate..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={4}
                />
              </div>
            </div>

            <div className="request-modal-footer">
              <button
                className="request-submit-button"
                onClick={handleSubmit}
                disabled={!twitter.trim()}
              >
                Submit Request
              </button>
              <p className="request-footer-note">
                We'll review your application and reach out if approved.
              </p>
            </div>
          </>
        ) : (
          <div className="request-success-message">
            <div className="request-success-icon">✓</div>
            <h3>Request Submitted!</h3>
            <p>We'll review your application and contact you soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestAccessModal;
