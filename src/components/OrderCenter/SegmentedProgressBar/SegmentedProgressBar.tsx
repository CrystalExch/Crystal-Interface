import React, { useRef, useState, useEffect } from 'react';
import './SegmentedProgressBar.css';

interface SegmentedProgressBarProps {
  percentFilled: number;
}

const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({ percentFilled }) => {
  const segments = 25;
  const filledSegments = Math.round((percentFilled / 100) * segments);
  const showAnimation = percentFilled < 100;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentRef = containerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        root: null, 
        rootMargin: '0px',
        threshold: 0.1
      }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div className="segmented-progress-bar" ref={containerRef}>
      {[...Array(segments)].map((_, index) => (
        <div
          key={index}
          className={`
            progress-segment 
            ${index < filledSegments ? 'filled' : 'empty'}
          `}
          style={{
            animation: 
              isVisible && 
              showAnimation && 
              index >= filledSegments 
                ? `pulse 4s infinite ${(index - filledSegments) * 0.1}s` 
                : 'none'
          }}
        />
      ))}
    </div>
  );
};

export default SegmentedProgressBar;