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

// Verification badge component matching TwitterHover
const VerifiedBadge: React.FC<{ type?: string | null }> = ({ type }) => {
  if (type === 'business' || type === 'Business') {
    return (
      <svg
        viewBox="0 0 22 22"
        aria-label="Verified account"
        role="img"
        className="twitter-hover-verified"
        style={{ fill: '#d4af37' }}
      >
        <g>
          <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
        </g>
      </svg>
    );
  }

  if (type === 'government' || type === 'Government') {
    return (
      <svg
        viewBox="0 0 22 22"
        aria-label="Verified account"
        role="img"
        className="twitter-hover-verified"
        style={{ fill: '#829aab' }}
      >
        <g>
          <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 22 22"
      aria-label="Verified account"
      role="img"
      className="twitter-hover-verified"
    >
      <g>
        <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
      </g>
    </svg>
  );
};

// Parse text with mentions, links, and ETH addresses
const parseTextWithMentions = (text: string, hasMedia = false) => {
  if (!text) return [];

  let processedText = text;
  if (hasMedia) {
    processedText = processedText.replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/gi, '').trim();
  }

  const lines = processedText.split('\n');
  const mentionRegex = /@([A-Za-z0-9_]{1,15})\b/g;
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const ethRegex = /(0x[a-fA-F0-9]{40})/g;

  const processedLines = lines.map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    const combinedRegex = new RegExp(
      `${mentionRegex.source}|${urlRegex.source}|${ethRegex.source}`,
      'gi'
    );

    let match: RegExpExecArray | null;
    while ((match = combinedRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      const token = match[0];

      if (token.startsWith('@')) {
        const username = token.slice(1);
        parts.push(
          <a
            key={`mention-${lineIndex}-${match.index}`}
            href={`https://x.com/${username}`}
            target="_blank"
            rel="noreferrer"
            className="twitter-mention"
            onClick={(e) => e.stopPropagation()}
          >
            @{username}
          </a>
        );
      } else if (/^https?:\/\//i.test(token)) {
        parts.push(
          <a
            key={`url-${lineIndex}-${match.index}`}
            href={token}
            target="_blank"
            rel="noreferrer"
            className="twitter-link-inline"
            onClick={(e) => e.stopPropagation()}
          >
            {token}
          </a>
        );
      } else if (/^0x[a-fA-F0-9]{40}$/.test(token)) {
        const truncated = `${token.slice(0, 6)}...${token.slice(-4)}`;
        parts.push(
          <a
            key={`eth-${lineIndex}-${match.index}`}
            href={`https://etherscan.io/address/${token}`}
            target="_blank"
            rel="noreferrer"
            className="twitter-eth-address"
            onClick={(e) => e.stopPropagation()}
          >
            {truncated}
          </a>
        );
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < line.length) parts.push(line.slice(lastIndex));
    return parts.length > 0 ? parts : line;
  });

  return processedLines.reduce<React.ReactNode[]>((acc, line, index) => {
    acc.push(line);
    if (index < processedLines.length - 1) acc.push(<br key={`br-${index}`} />);
    return acc;
  }, []);
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
};

const getTimeAgoColor = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return '#3cdd47';
  if (seconds < 300) return '#4cd964';
  if (seconds < 3600) return '#ffcc00';
  return '#ff9500';
};

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
  const [tweets, setTweets] = useState<TweetData[]>(() => {
    console.log('🔄 Initializing tweets state');
    return [];
  });
  const [trackedUsers, setTrackedUsers] = useState<string[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const tweetsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('📊 Tweets state changed:', tweets.length, tweets);
  }, [tweets]);

  const scrollToBottom = () => {
    tweetsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [tweets]);

  // WebSocket connection
  useEffect(() => {
    if (!isOpen) return;

    console.log('🔌 Connecting WebSocket...');
    const ws = new WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log('📨 Raw message received:', event.data);
      try {
        const tweetData: TweetData = JSON.parse(event.data);
        console.log('✅ Parsed tweet data:', tweetData);
        setTweets((prev) => {
          console.log('📝 Current tweets:', prev.length, 'Adding new tweet');
          const newTweets = [...prev, tweetData];
          console.log('📝 New tweet count:', newTweets.length);
          return newTweets;
        });
      } catch (error) {
        console.error('❌ Error:', error);
      }
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
        return 'Tweet';
      case 'retweet':
        return 'Retweet';
      case 'reply':
        return 'Reply';
      case 'quote':
        return 'Quote';
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
        <div className="widget-tracker-header" onMouseDown={handleDragStart}>
          <h3 className="tracker-title">
            Twitter Alerts
          </h3>
        </div>

        <div className="tracker-content">
          {/* <div className="tracker-controls">
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
          </div> */}

          <div className="tweets-container">
            {tweets.length === 0 ? (
              <div className="empty-state">
                <p>No tweets yet</p>
                <p className="empty-subtext">Add users above to start tracking</p>
              </div>
            ) : (
              tweets.map((tweet, idx) => {
                const hasMedia = (tweet.tweet.media?.length || 0) > 0;
                const photos = tweet.tweet.media?.filter(m => m.type === 'photo') || [];
                const videos = tweet.tweet.media?.filter(m => m.type === 'video' || m.type === 'animated_gif') || [];
                const isBusiness = tweet.author?.verified_type === 'business';

                return (
                  <div key={`${tweet.tweet.id}-${idx}`} className="tweet-card">
                    <div className="twitter-hover-top-row">
                      <div className="twitter-alerts-header">
                        {tweet.author && (
                          <>
                            <img
                              src={tweet.author.avatar}
                              alt=""
                              className="twitter-alerts-avatar"
                              style={{ borderRadius: isBusiness ? '6px' : '50%' }}
                            />
                            <div className="twitter-alerts-header-text">
                              <div className="verify-name">
                                <span className="twitter-alerts-name">{tweet.author.name}</span>
                              </div>
                              <a
                                href={`https://x.com/${tweet.author.username}`}
                                target="_blank"
                                rel="noreferrer"
                                className="twitter-alerts-username-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                @{tweet.author.username}
                              </a>
                              <div
                                className="twitter-alerts-time-ago"
                              >
                                <span>• {formatTimeAgo(tweet.tweet.created_at)}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="twitter-top-right-section">

                      </div>
                    </div>

                    <div className="twitter-alerts-text-container-new">
                      <p className="twitter-alerts-text">
                        {parseTextWithMentions(tweet.tweet.text, hasMedia)}
                      </p>

                      {photos.length > 0 && (
                        <div className={`twitter-hover-photos twitter-hover-photos-${Math.min(photos.length, 4)}`}>
                          {photos.map((m, i) => (
                            <img
                              key={i}
                              src={m.url}
                              alt=""
                              className="twitter-hover-photo"
                            />
                          ))}
                        </div>
                      )}

                      {videos.length > 0 && (
                        <div className="twitter-hover-videos">
                          {videos.map((m, i) => (
                            <div key={i} className="twitter-hover-video-container">
                              {m.type === 'animated_gif' ? (
                                <video
                                  src={m.url}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="twitter-hover-video"
                                />
                              ) : (
                                <video
                                  src={m.url}
                                  controls
                                  className="twitter-hover-video"
                                  preload="metadata"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
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