import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './SidebarTooltip.css';

interface SidebarTooltipProps {
  content: React.ReactNode;
  target: HTMLElement | null;
  visible: boolean;
}

const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ content, target, visible }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (target && tooltipRef.current) {
      const rect = target.getBoundingClientRect();
      tooltipRef.current.style.top = `${rect.top + rect.height / 2}px`;
      tooltipRef.current.style.left = `${rect.right + 10}px`;
    }
  }, [target, visible]);

  if (!visible || !target) return null;

  return ReactDOM.createPortal(
    <div className="sidebar-tooltip" ref={tooltipRef}>
      {content}
    </div>,
    document.body
  );
};

export default SidebarTooltip;
