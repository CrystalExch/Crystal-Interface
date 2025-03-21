import './SegmentedProgressBar.css';

const SegmentedProgressBar = ({ percentFilled }: { percentFilled: number }) => {
  const segments = 25;
  const filledSegments = Math.round((percentFilled / 100) * segments);
  const showAnimation = percentFilled < 100;

  return (
    <div className="segmented-progress-bar">
      {[...Array(segments)].map((_, index) => (
        <div
          key={index}
          className={`
            progress-segment 
            ${index < filledSegments ? 'filled' : 'empty'}
          `}
          style={{animation: showAnimation && index >= filledSegments ? `pulse 4s infinite ${`${((index - filledSegments) * 0.08)}s`}` : ''
          }}
        />
      ))}
    </div>
  );
};

export default SegmentedProgressBar;
