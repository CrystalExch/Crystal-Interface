import React, { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import './TooltipLabel.css';

interface TooltipLabelProps {
  label: ReactNode;
  tooltipText: ReactNode;
  className?: string;
}

const TooltipLabel: React.FC<TooltipLabelProps> = ({
  label,
  tooltipText,
  className,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const updatePosition = () => {
    if (tooltipRef.current && textRef.current) {
      const triggerRect = textRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      if (!triggerRect || !tooltipRect) return;

      let top = window.scrollY + triggerRect.top - tooltipRect.height - 10;
      let left = window.scrollX + triggerRect.left + triggerRect.width / 2;

      const margin = 10;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      left = Math.min(
        Math.max(left, margin + tooltipRect.width / 2),
        viewportWidth - margin - tooltipRect.width / 2,
      );

      top = Math.min(
        Math.max(top, margin),
        viewportHeight - margin - tooltipRect.height,
      );

      tooltipRef.current.style.transform = 'translate(-50%, 0)';
      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.left = `${left}px`;
    }
  };

  const handleMouseEnter = () => {
    setIsLeaving(false);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setIsLeaving(true);
    setTimeout(() => {
      if (isLeaving) {
        setShowTooltip(false);
      }
    }, 300);
  };

  useLayoutEffect(() => {
    if (!showTooltip) {
      setMounted(false);
      return;
    }

    updatePosition();
    setMounted(true);

    const handleScrollResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScrollResize);
    window.addEventListener('resize', handleScrollResize);

    let animationFrameId: number;
    const animate = () => {
      updatePosition();
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScrollResize);
      window.removeEventListener('resize', handleScrollResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showTooltip, isLeaving]);

  return (
    <div
      ref={textRef}
      className={`tooltip-wrapper ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="trade-dotted-underline">{label}</span>
      {showTooltip &&
        createPortal(
          <div
            ref={tooltipRef}
            style={{
              position: 'fixed',
              opacity: 0,
              pointerEvents: 'none',
              zIndex: 1000,
              transition: mounted
                ? 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'none',
            }}
            className={`swap-trade-header-tooltip ${
              mounted
                ? isLeaving
                  ? 'tooltip-leaving'
                  : 'tooltip-entering'
                : ''
            }`}
          >
            <div className="tooltip-description">{tooltipText}</div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default TooltipLabel;
