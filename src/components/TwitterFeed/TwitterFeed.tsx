import React, { useEffect, useRef, useState } from 'react';

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

interface TwitterFeedProps {
  trackedUsers: string[];
}

// Verification badge component
const VerifiedBadge: React.FC<{ type?: string | null }> = ({ type }) => {
  if (type === 'business' || type === 'Business') {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 22 22"
        aria-label="Verified account"
        role="img"
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
        width="20"
        height="20"
        viewBox="0 0 22 22"
        aria-label="Verified account"
        role="img"
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
      width="20"
      height="20"
      viewBox="0 0 22 22"
      aria-label="Verified account"
      role="img"
      style={{ fill: '#1d9bf0' }}
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
  return `${days}d`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const TwitterFeed: React.FC<TwitterFeedProps> = ({ trackedUsers }) => {
  const [tweets, setTweets] = useState<TweetData[]>([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const tweetsEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial tweets
  useEffect(() => {
    if (trackedUsers.length === 0) {
      setTweets([]);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const fetchTweets = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/tweets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames: trackedUsers }),
        });

        if (response.ok) {
          const data = await response.json();
          setTweets(data);
        }
      } catch (error) {
        console.error('Error fetching tweets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();

    // Setup WebSocket for real-time updates
    if (!wsRef.current) {
      const ws = new WebSocket('ws://localhost:3001');
      ws.onopen = () => console.log('Connected to tweet stream');
      ws.onmessage = (event) => {
        const newTweet: TweetData = JSON.parse(event.data);
        if (trackedUsers.includes(newTweet.username)) {
          setTweets((prev) => [newTweet, ...prev].slice(0, 100));
        }
      };
      wsRef.current = ws;
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [trackedUsers]);

  // Auto-scroll to bottom when new tweets arrive
  useEffect(() => {
    tweetsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tweets]);

  const handleTweetClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (trackedUsers.length === 0) {
    return (
      <div className="tracker-twitter-feed">
        <div className="twitter-feed-header">
          <h3>Live Feed</h3>
        </div>
        <div className="twitter-feed-content">
          <div className="twitter-feed-empty">
            <div className="twitter-feed-empty-icon">🐦</div>
            <p>No subscriptions active</p>
            <p className="twitter-feed-empty-subtext">
              Add subscriptions on the right to start tracking
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tracker-twitter-feed">
      <div className="twitter-feed-header">
        <h3>Live Feed</h3>
        {loading && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Loading...</span>}
      </div>
      <div className="twitter-feed-content">
        {tweets.length === 0 && !loading ? (
          <div className="twitter-feed-empty">
            <div className="twitter-feed-empty-icon">📭</div>
            <p>No tweets yet</p>
            <p className="twitter-feed-empty-subtext">
              Waiting for tweets from your subscriptions...
            </p>
          </div>
        ) : (
          tweets.map((tweet, idx) => {
            const hasMedia = (tweet.tweet.media?.length || 0) > 0;
            const photos = tweet.tweet.media?.filter(m => m.type === 'photo') || [];
            const videos = tweet.tweet.media?.filter(m => m.type === 'video' || m.type === 'animated_gif') || [];
            const isBusiness = tweet.author?.verified_type === 'business';

            return (
              <div
                key={`${tweet.tweet.id}-${idx}`}
                className="twitter-feed-tweet-card"
                onClick={() => handleTweetClick(tweet.tweet.url)}
              >
                <div className="twitter-feed-tweet-header">
                  {tweet.author && (
                    <>
                      <img
                        src={tweet.author.avatar}
                        alt=""
                        className="twitter-feed-tweet-avatar"
                        style={{ borderRadius: isBusiness ? '8px' : '50%' }}
                      />
                      <div className="twitter-feed-tweet-info">
                        <div className="twitter-feed-tweet-author">
                          <span className="twitter-feed-tweet-name">{tweet.author.name}</span>
                          {tweet.author.verified && (
                            <VerifiedBadge type={tweet.author.verified_type} />
                          )}
                          <span className="twitter-feed-tweet-type-badge {tweet.type}">
                            {tweet.type}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span className="twitter-feed-tweet-username">
                            @{tweet.author.username}
                          </span>
                          <span className="twitter-feed-tweet-time">
                            • {formatTimeAgo(tweet.tweet.created_at)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="twitter-feed-tweet-text">
                  {parseTextWithMentions(tweet.tweet.text, hasMedia)}
                </div>

                {photos.length > 0 && (
                  <div className="twitter-feed-tweet-media">
                    {photos.map((m, i) => (
                      <img
                        key={i}
                        src={m.url}
                        alt=""
                        className="twitter-feed-tweet-image"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ))}
                  </div>
                )}

                {videos.length > 0 && (
                  <div className="twitter-feed-tweet-media">
                    {videos.map((m, i) => (
                      <div key={i}>
                        {m.type === 'animated_gif' ? (
                          <video
                            src={m.url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="twitter-feed-tweet-video"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <video
                            src={m.url}
                            controls
                            className="twitter-feed-tweet-video"
                            preload="metadata"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="twitter-feed-tweet-stats">
                  <div className="twitter-feed-tweet-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="twitter-feed-tweet-stat-icon">
                      <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"/>
                    </svg>
                    {formatNumber(tweet.tweet.metrics.reply_count)}
                  </div>
                  <div className="twitter-feed-tweet-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="twitter-feed-tweet-stat-icon">
                      <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"/>
                    </svg>
                    {formatNumber(tweet.tweet.metrics.retweet_count)}
                  </div>
                  <div className="twitter-feed-tweet-stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="twitter-feed-tweet-stat-icon">
                      <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"/>
                    </svg>
                    {formatNumber(tweet.tweet.metrics.like_count)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={tweetsEndRef} />
      </div>
    </div>
  );
};

export default TwitterFeed;