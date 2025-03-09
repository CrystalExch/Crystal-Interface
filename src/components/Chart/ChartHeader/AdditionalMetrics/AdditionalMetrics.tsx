import React, { useLayoutEffect, useRef, useState } from 'react';

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
  const [isMeasured, setIsMeasured] = useState(false);
  const metricsRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="right-section">
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
