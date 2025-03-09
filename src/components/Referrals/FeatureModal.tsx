import './FeatureModal.css';

const FeatureModal = ({
  feature,
  onClose,
}: {
  feature: {
    icon: React.ReactNode;
    iconClass: string;
    title: string;
    description: string;
  };
  onClose: () => void;
}) => {
  return (
    <div className="feature-modal-overlay" onClick={onClose}>
      <div
        className="feature-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="feature-modal-header">
          <h2 className="feature-modal-title">{feature.title}</h2>
          <button className="feature-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="feature-modal-content">
          <p className="feature-modal-description">{feature.description}</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureModal;
