import React, { memo, useMemo, useRef, useState, useEffect } from 'react';
import './SegmentedProgressBar.css';

interface SegmentedProgressBarProps {
  percentFilled: number;
}

const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = memo(
  ({ percentFilled }) => {
    const segments = 25;
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    const filledSegments = useMemo(
      () => Math.round((percentFilled / 100) * segments),
      [percentFilled]
    );

    const segmentElements = useMemo(() => {
      const showAnimation = percentFilled < 100;
      const elements: JSX.Element[] = [];

      for (let i = 0; i < segments; i++) {
        const isFilled = i < filledSegments;
        const className = `progress-segment ${isFilled ? 'filled' : 'empty'}`;
        const animationStyle =
          isVisible && showAnimation && i >= filledSegments
            ? { animation: `pulse 4s infinite ${(i - filledSegments) * 0.1}s` }
            : undefined;

        elements.push(
          <div key={i} className={className} style={animationStyle} />
        );
      }

      return elements;
    }, [filledSegments, isVisible, percentFilled]);

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
      isVisible ? (<div className="segmented-progress-bar" ref={containerRef}>
        {segmentElements}
    </div>) : (<div className="segmented-progress-bar-hidden" ref={containerRef}>
    </div>)
    );
  }
)

export default SegmentedProgressBar;