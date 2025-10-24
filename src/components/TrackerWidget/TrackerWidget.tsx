import React, { useCallback, useEffect, useRef, useState } from 'react';
import './TrackerWidget.css';

interface TrackerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapChange?: (snapSide: 'left' | 'right' | null, width: number) => void;
}

const HEADER_HEIGHT = 53; 
const SIDEBAR_WIDTH = 50; 
const SNAP_THRESHOLD = 10; 
const SNAP_HOVER_TIME = 300; 

const TrackerWidget: React.FC<TrackerWidgetProps> = ({ isOpen, onClose, onSnapChange }) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 400, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [isSnapped, setIsSnapped] = useState<'left' | 'right' | null>(null);
  const [snapZoneHover, setSnapZoneHover] = useState<'left' | 'right' | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const resizeStartPosition = useRef({ x: 0, y: 0 });
  const snapHoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const presnapState = useRef<{ position: { x: number; y: number }; size: { width: number; height: number } } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }

    if (isSnapped && presnapState.current) {
      setIsSnapped(null);
      setPosition(presnapState.current.position);
      setSize(presnapState.current.size);
      dragStartPos.current = {
        x: e.clientX - presnapState.current.position.x,
        y: e.clientY - presnapState.current.position.y,
      };
      presnapState.current = null;
    } else {
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }

    setIsDragging(true);
  }, [position, isSnapped]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.stopPropagation();
      setIsResizing(true);
      setResizeDirection(direction);
      resizeStartPos.current = { x: e.clientX, y: e.clientY };
      resizeStartSize.current = { ...size };
      resizeStartPosition.current = { ...position };
    },
    [size, position]
  );

  useEffect(() => {
    if (onSnapChange) {
      onSnapChange(isSnapped, size.width);
    }
  }, [isSnapped, size.width, onSnapChange]);

  useEffect(() => {
    const handleWindowResize = () => {
      if (isSnapped) {
        if (isSnapped === 'left') {
          setPosition({ x: SIDEBAR_WIDTH, y: HEADER_HEIGHT });
          setSize(prev => ({ 
            width: Math.min(prev.width, window.innerWidth - SIDEBAR_WIDTH - 200), 
            height: window.innerHeight - HEADER_HEIGHT 
          }));
        } else if (isSnapped === 'right') {
          const maxWidth = window.innerWidth - SIDEBAR_WIDTH - 200;
          const newWidth = Math.min(size.width, maxWidth);
          setSize({ 
            width: newWidth,
            height: window.innerHeight - HEADER_HEIGHT
          });
          setPosition({ 
            x: window.innerWidth - newWidth, 
            y: HEADER_HEIGHT 
          });
        }
      } else {
        setPosition(prev => ({
          x: Math.max(SIDEBAR_WIDTH, Math.min(prev.x, window.innerWidth - size.width)),
          y: Math.max(HEADER_HEIGHT, Math.min(prev.y, window.innerHeight - size.height))
        }));
        setSize(prev => ({
          width: Math.min(prev.width, window.innerWidth - SIDEBAR_WIDTH),
          height: Math.min(prev.height, window.innerHeight - HEADER_HEIGHT)
        }));
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isSnapped, size.width]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragStartPos.current.x;
        let newY = e.clientY - dragStartPos.current.y;

        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;

        newX = Math.max(SIDEBAR_WIDTH, Math.min(newX, maxX));
        newY = Math.max(HEADER_HEIGHT, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });

        const distanceFromLeft = newX - SIDEBAR_WIDTH;
        const distanceFromRight = window.innerWidth - (newX + size.width);

        if (distanceFromLeft <= SNAP_THRESHOLD) {
          if (!snapHoverTimeout.current) {
            setSnapZoneHover('left');
            snapHoverTimeout.current = setTimeout(() => {
              presnapState.current = { position: { x: newX, y: newY }, size };
              
              setIsSnapped('left');
              const snappedWidth = Math.min(size.width, window.innerWidth - SIDEBAR_WIDTH - 200);
              setPosition({ x: SIDEBAR_WIDTH, y: HEADER_HEIGHT });
              setSize({ width: snappedWidth, height: window.innerHeight - HEADER_HEIGHT });
              setSnapZoneHover(null);
              snapHoverTimeout.current = null;
            }, SNAP_HOVER_TIME);
          }
        } else if (distanceFromRight <= SNAP_THRESHOLD) {
          if (!snapHoverTimeout.current) {
            setSnapZoneHover('right');
            snapHoverTimeout.current = setTimeout(() => {
              presnapState.current = { position: { x: newX, y: newY }, size };
              
              setIsSnapped('right');
              const snappedWidth = Math.min(size.width, window.innerWidth - SIDEBAR_WIDTH - 200);
              setPosition({ x: window.innerWidth - snappedWidth, y: HEADER_HEIGHT });
              setSize({ width: snappedWidth, height: window.innerHeight - HEADER_HEIGHT });
              setSnapZoneHover(null);
              snapHoverTimeout.current = null;
            }, SNAP_HOVER_TIME);
          }
        } else {
          if (snapHoverTimeout.current) {
            clearTimeout(snapHoverTimeout.current);
            snapHoverTimeout.current = null;
          }
          setSnapZoneHover(null);
        }
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;

        let newWidth = resizeStartSize.current.width;
        let newHeight = resizeStartSize.current.height;
        let newX = resizeStartPosition.current.x;
        let newY = resizeStartPosition.current.y;

        if (isSnapped === 'left' && resizeDirection === 'right') {
          newWidth = Math.max(200, Math.min(resizeStartSize.current.width + deltaX, window.innerWidth - SIDEBAR_WIDTH));
        } else if (isSnapped === 'right' && resizeDirection === 'left') {
          newWidth = Math.max(200, Math.min(resizeStartSize.current.width - deltaX, window.innerWidth));
          newX = window.innerWidth - newWidth;
        } else if (!isSnapped) {
          if (resizeDirection.includes('right')) {
            newWidth = Math.max(200, Math.min(resizeStartSize.current.width + deltaX, window.innerWidth - newX));
          }
          if (resizeDirection.includes('left')) {
            const maxWidthIncrease = newX - SIDEBAR_WIDTH;
            newWidth = Math.max(200, Math.min(resizeStartSize.current.width - deltaX, resizeStartSize.current.width + maxWidthIncrease));
            if (newWidth > 200) {
              newX = Math.max(SIDEBAR_WIDTH, resizeStartPosition.current.x + deltaX);
            }
          }
          if (resizeDirection.includes('bottom')) {
            newHeight = Math.max(150, Math.min(resizeStartSize.current.height + deltaY, window.innerHeight - newY));
          }
          if (resizeDirection.includes('top')) {
            const maxHeightIncrease = newY - HEADER_HEIGHT;
            newHeight = Math.max(150, Math.min(resizeStartSize.current.height - deltaY, resizeStartSize.current.height + maxHeightIncrease));
            if (newHeight > 150) {
              newY = Math.max(HEADER_HEIGHT, resizeStartPosition.current.y + deltaY);
            }
          }
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
      
      if (snapHoverTimeout.current) {
        clearTimeout(snapHoverTimeout.current);
        snapHoverTimeout.current = null;
      }
      setSnapZoneHover(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, resizeDirection, size, isSnapped]);

  if (!isOpen) return null;

  return (
    <>
      {snapZoneHover && (
        <>
          <div className={`snap-zone-overlay left ${snapZoneHover === 'left' ? 'active' : ''}`} />
          <div className={`snap-zone-overlay right ${snapZoneHover === 'right' ? 'active' : ''}`} />
        </>
      )}

      <div
        ref={widgetRef}
        className={`tracker-widget ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isSnapped ? `snapped snapped-${isSnapped}` : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
      >
        <div className="tracker-header" onMouseDown={handleDragStart}>
          <h3 className="tracker-title">Tracker Widget</h3>
        </div>

        <div className="tracker-content">
        </div>

        {!isSnapped && (
          <>
            <div
              className="resize-handle top-left"
              onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            />
            <div
              className="resize-handle top-right"
              onMouseDown={(e) => handleResizeStart(e, 'top-right')}
            />
            <div
              className="resize-handle bottom-left"
              onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
            />
            <div
              className="resize-handle bottom-right"
              onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            />

            {/* Edges */}
            <div
              className="resize-handle top"
              onMouseDown={(e) => handleResizeStart(e, 'top')}
            />
            <div
              className="resize-handle bottom"
              onMouseDown={(e) => handleResizeStart(e, 'bottom')}
            />
            <div
              className="resize-handle left"
              onMouseDown={(e) => handleResizeStart(e, 'left')}
            />
            <div
              className="resize-handle right"
              onMouseDown={(e) => handleResizeStart(e, 'right')}
            />
          </>
        )}
        
        {isSnapped === 'left' && (
          <div
            className="resize-handle right snapped-resize"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
        )}
        {isSnapped === 'right' && (
          <div
            className="resize-handle left snapped-resize"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
        )}
      </div>
    </>
  );
};

export default TrackerWidget;