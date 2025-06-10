import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import MetricItem from '../MetricItem/MetricItem';
import ScrollButton from '../ScrollButton/ScrollButton';

import { scrollContainer } from '../../utils';

import './AdditionalMetrics.css';

interface AdditionalMetricsProps {
  metrics: Array<{
    label: string;
    value: React.ReactNode;
    isLoading?: boolean;
  }>;
  isLoading?: boolean;
}

const AdditionalMetrics: React.FC<AdditionalMetricsProps> = ({
  metrics,
  isLoading = false,
}) => {
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
      const container = metricsRef.current;
      const isScrollable = container.scrollWidth > container.clientWidth;
      const isAtLeftEdge = container.scrollLeft <= 10;
      const isAtRightEdge =
        container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
      
      const newShowLeftArrow = isScrollable && !isAtLeftEdge;
      const newShowRightArrow = isScrollable && !isAtRightEdge;
      
      const newShowLeftFade = newShowLeftArrow;
      const newShowRightFade = newShowRightArrow;

      setShowLeftArrow(newShowLeftArrow);
      setShowRightArrow(newShowRightArrow);
      setShowLeftFade(newShowLeftFade);
      setShowRightFade(newShowRightFade);
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
          <MetricItem 
            key={index}
            label={metric.label}
            value={metric.value}
            isLoading={isLoading}
          />
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