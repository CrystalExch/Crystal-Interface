import React, { useCallback, useEffect, useRef, useState } from 'react';
import './TrackerWidget.css';

interface TrackerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapChange?: (snapSide: 'left' | 'right' | null, width: number) => void;
}

interface TweetData {
  type: 'tweet' | 'retweet' | 'reply' | 'quote';
  username: string;
  tweet: {
    id: string;
    text: string;
    created_at: string;
    url: string;
    metrics: {
      reply_count: number;
      retweet_count: number;
      like_count: number;
    };
    media?: Array<{
      type: string;
      url: string;
    }>;
  };
  author: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    verified_type?: string | null;
  } | null;
  timestamp: string;
}

const HEADER_HEIGHT = 53;
const SIDEBAR_WIDTH = 50;
const SNAP_THRESHOLD = 10;
const SNAP_HOVER_TIME = 300;

const TrackerWidget: React.FC<TrackerWidgetProps> = ({ isOpen, onClose, onSnapChange }) => {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 400, height: 600 });
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

  // Tweet tracking state
  const [tweets, setTweets] = useState<TweetData[]>([]);
  const [trackedUsers, setTrackedUsers] = useState<string[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const tweetsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    tweetsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [tweets]);

  // WebSocket connection
  useEffect(() => {
    if (!isOpen) return;

    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const tweetData: TweetData = JSON.parse(event.data);
      setTweets((prev) => [...prev, tweetData]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [isOpen]);

  const addUser = async () => {
    if (!newUsername.trim()) return;

    try {
      const response = await fetch('http://localhost:8000/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [newUsername.trim()] }),
      });

      if (response.ok) {
        setTrackedUsers((prev) => [...prev, newUsername.trim()]);
        setNewUsername('');
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const removeUser = async (username: string) => {
    try {
      const response = await fetch('http://localhost:8000/track', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] }),
      });

      if (response.ok) {
        setTrackedUsers((prev) => prev.filter((u) => u !== username));
      }
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const getTweetTypeLabel = (type: string) => {
    switch (type) {
      case 'tweet':
        return '💬 Tweet';
      case 'retweet':
        return '🔁 Retweet';
      case 'reply':
        return '↩️ Reply';
      case 'quote':
        return '💭 Quote';
      default:
        return type;
    }
  };

  const getTweetTypeColor = (type: string) => {
    switch (type) {
      case 'tweet':
        return '#1d9bf0';
      case 'retweet':
        return '#00ba7c';
      case 'reply':
        return '#f91880';
      case 'quote':
        return '#ffad1f';
      default:
        return '#71767b';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }
    if ((e.target as HTMLElement).closest('.tracker-controls')) {
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
          <h3 className="tracker-title">
            Live Tweet Tracker {isConnected ? '🟢' : '🔴'}
          </h3>
        </div>

        <div className="tracker-content">
          <div className="tracker-controls">
            <div className="add-user-section">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addUser()}
                placeholder="Enter username (e.g., elonmusk)"
                className="username-input"
              />
              <button onClick={addUser} className="add-button">
                Track
              </button>
            </div>

            {trackedUsers.length > 0 && (
              <div className="tracked-users">
                <div className="tracked-users-title">Tracking:</div>
                {trackedUsers.map((user) => (
                  <div key={user} className="tracked-user-chip">
                    @{user}
                    <button onClick={() => removeUser(user)} className="remove-user-btn">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="tweets-container">
            {tweets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No tweets yet</p>
                <p className="empty-subtext">Add users above to start tracking</p>
              </div>
            ) : (
              tweets.map((tweet, idx) => (
                <div key={`${tweet.tweet.id}-${idx}`} className="tweet-card">
                  <div className="tweet-header">
                    <div className="tweet-author">
                      {tweet.author && (
                        <>
                          <img src={tweet.author.avatar} alt="" className="tweet-avatar" />
                          <div className="tweet-author-info">
                            <div className="tweet-author-name">
                              {tweet.author.name}
                              {tweet.author.verified && <span className="verified-badge">✓</span>}
                            </div>
                            <div className="tweet-author-username">@{tweet.author.username}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="tweet-meta">
                      <span
                        className="tweet-type-badge"
                        style={{ backgroundColor: getTweetTypeColor(tweet.type) }}
                      >
                        {getTweetTypeLabel(tweet.type)}
                      </span>
                      <span className="tweet-time">{formatTimeAgo(tweet.timestamp)}</span>
                    </div>
                  </div>

                  <div className="tweet-text">{tweet.tweet.text}</div>

                  {tweet.tweet.media && tweet.tweet.media.length > 0 && (
                    <div className="tweet-media">
                      {tweet.tweet.media.map((media, i) => (
                        <div key={i} className="media-item">
                          {media.type === 'photo' ? (
                            <img src={media.url} alt="" className="tweet-image" />
                          ) : (
                            <video src={media.url} controls className="tweet-video" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="tweet-stats">
                    <span>💬 {tweet.tweet.metrics.reply_count}</span>
                    <span>🔁 {tweet.tweet.metrics.retweet_count}</span>
                    <span>❤️ {tweet.tweet.metrics.like_count}</span>
                  </div>

                  <a
                    href={tweet.tweet.url}
                    target="_blank"
                    rel="noreferrer"
                    className="tweet-link"
                  >
                    View on X →
                  </a>
                </div>
              ))
            )}
            <div ref={tweetsEndRef} />
          </div>
        </div>

        {!isSnapped && (
          <>
            <div className="resize-handle top-left" onMouseDown={(e) => handleResizeStart(e, 'top-left')} />
            <div className="resize-handle top-right" onMouseDown={(e) => handleResizeStart(e, 'top-right')} />
            <div className="resize-handle bottom-left" onMouseDown={(e) => handleResizeStart(e, 'bottom-left')} />
            <div className="resize-handle bottom-right" onMouseDown={(e) => handleResizeStart(e, 'bottom-right')} />
            <div className="resize-handle top" onMouseDown={(e) => handleResizeStart(e, 'top')} />
            <div className="resize-handle bottom" onMouseDown={(e) => handleResizeStart(e, 'bottom')} />
            <div className="resize-handle left" onMouseDown={(e) => handleResizeStart(e, 'left')} />
            <div className="resize-handle right" onMouseDown={(e) => handleResizeStart(e, 'right')} />
          </>
        )}

        {isSnapped === 'left' && (
          <div className="resize-handle right snapped-resize" onMouseDown={(e) => handleResizeStart(e, 'right')} />
        )}
        {isSnapped === 'right' && (
          <div className="resize-handle left snapped-resize" onMouseDown={(e) => handleResizeStart(e, 'left')} />
        )}
      </div>
    </>
  );
};

export default TrackerWidget;