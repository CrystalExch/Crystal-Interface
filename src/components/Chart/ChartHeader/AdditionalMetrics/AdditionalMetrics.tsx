import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';

import MetricItem from '../MetricItem/MetricItem';
import ScrollButton from '../ScrollButton/ScrollButton';

import { scrollContainer, shouldShowArrows } from '../../utils';

import './AdditionalMetrics.css';

interface AdditionalMetricsProps {
  metrics: Array<{ label: string; value: React.ReactNode }>;
}

const AdditionalMetrics: React.FC<AdditionalMetricsProps> = ({ metrics }) => {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const [isMeasured, setIsMeasured] = useState(false);
  const metricsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollMetrics = (direction: 'left' | 'right') => {
    if (metricsRef.current) {
      scrollContainer(
        metricsRef.current,
        direction,
        metricsRef.current.clientWidth / 2,
      );
    }
  };

  const updateArrowVisibility = () => {
    if (metricsRef.current) {
      const { showLeftArrow, showRightArrow } = shouldShowArrows(
        metricsRef.current,
      );
      setShowLeftArrow(showLeftArrow);
      setShowRightArrow(showRightArrow);
      
      const container = metricsRef.current;
      const isScrollable = container.scrollWidth > container.clientWidth;
      const isAtLeftEdge = container.scrollLeft <= 10; 
      const isAtRightEdge = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10; 
      
      setShowLeftFade(isScrollable && !isAtLeftEdge);
      setShowRightFade(isScrollable && !isAtRightEdge);
    }
  };

  useLayoutEffect(() => {
    const metricsContainer = metricsRef.current;
    if (metricsContainer) {
      metricsContainer.addEventListener('scroll', updateArrowVisibility);
      window.addEventListener('resize', updateArrowVisibility);

      const resizeObserver = new ResizeObserver(() => {
        updateArrowVisibility();
      });
      resizeObserver.observe(metricsContainer);

      updateArrowVisibility();
      setIsMeasured(true);

      return () => {
        metricsContainer.removeEventListener('scroll', updateArrowVisibility);
        window.removeEventListener('resize', updateArrowVisibility);
        resizeObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    updateArrowVisibility();
  }, [metrics]);

  return (
    <div 
      className={`right-section ${showLeftFade ? 'show-left-fade' : ''} ${showRightFade ? 'show-right-fade' : ''}`} 
      ref={sectionRef}
    >
      {isMeasured && showLeftArrow && (
        <ScrollButton direction="left" onClick={() => scrollMetrics('left')} />
      )}
      <div className="additional-metrics" ref={metricsRef}>
        {metrics.map((metric, index) => (
          <MetricItem key={index} label={metric.label} value={metric.value} />
        ))}
      </div>
      {isMeasured && showRightArrow && (
        <ScrollButton
          direction="right"
          onClick={() => scrollMetrics('right')}
        />
      )}
    </div>
  );
};

export default AdditionalMetrics;