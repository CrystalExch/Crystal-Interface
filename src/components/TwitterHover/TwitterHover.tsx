import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  useFloating,
  offset,
  flip,
  shift,
  arrow,
  autoUpdate,
  useInteractions,
  useHover,
  useRole,
  useDismiss,
    size,
} from '@floating-ui/react';
import './TwitterHover.css';
import type { Placement } from '@floating-ui/react';
import twitter from '../../assets/twitter-dark.svg'

type Media = { type: 'photo' | 'video' | 'animated_gif'; url: string; width?: number; height?: number };

type Preview =
  | {
    kind: 'user';
    user: {
      id: string;
      name: string;
      username: string;
      avatar: string;
      banner?: string | null;
      verified: boolean;
      verified_type?: string | null;
      created_at: string;
      followers: number | null;
      following: number | null;
      description: string;
      location?: string;
      url: string;
    };
    _stale?: boolean;
  }
  | {
    kind: 'tweet';
    tweet: {
      id: string;
      text: string;
      created_at: string;
      metrics: Record<string, number>;
      possibly_sensitive: boolean;
      media?: Media[];
      is_reply?: boolean;
      in_reply_to_username?: string;
      in_reply_to_user_id?: string;
    };
    author: {
      id: string;
      name: string;
      username: string;
      avatar: string;
      verified: boolean;
      verified_type?: string | null;
      created_at: string;
      followers: number | null;
      following: number | null;
    } | null;
    url: string;
    _stale?: boolean;
  }
  | {
    kind: 'community';
community: {
  name: string;
  description: string;
  member_count: number;
  created_at: string;
  banner_url?: string | null;
  creator?: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    verified_type?: string | null;
    followers: number;
    following: number;
  } | null;
  members_preview?: Array<{
    id?: string;
    name?: string;
    profile_image_url_https?: string;
    profilePicture?: string;
  }>;
  primary_topic?: {
    id?: string;
    name?: string;
  } | null;
};


    url: string;
    _stale?: boolean;
  };

type Props = {
  url: string;
  children: React.ReactNode;
  openDelayMs?: number;
  placement?: Placement;
  portal?: boolean;
};

/** ================= client cache / in-flight ================= */
const CLIENT_CACHE = new Map<string, { data: Preview; exp: number }>();
const INFLIGHT = new Map<string, Promise<Response>>();
CLIENT_CACHE.clear();
INFLIGHT.clear();
/** ================= API ENDPOINT =================
 * Updated to use twitterapi.io through your backend
 */
const ORIGIN_BASE = 'http://localhost:3000';
const API_PATH = '/api/x';

function joinUrl(base: string, path: string) {
  if (!base) return path;
  return base.endsWith('/') ? `${base.slice(0, -1)}${path}` : `${base}${path}`;
}

/** normalize handle/url for stable keys and input */
function normalizeXInput(s: string) {
  const raw = s.trim();
  if (!raw) return '';
  if (raw.includes('://')) return raw;
  const h = raw.startsWith('@') ? raw.slice(1) : raw;
  return `@${h}`;
}

function parseTextWithMentions(text: string, hasMedia = false) {
  if (!text) return [];

  let processedText = text;
  if (hasMedia)
    processedText = processedText.replace(/https?:\/\/t\.co\/[A-Za-z0-9]+/gi, '').trim();

  const lines = processedText.split('\n');

  const mentionRegex = /@([A-Za-z0-9_]{1,15})\b/g;
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const ethRegex = /(0x[a-fA-F0-9]{40})/g;

  const processedLines = lines.map((line, lineIndex) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // ✅ combine all patterns robustly
    const combinedRegex = new RegExp(
      `${mentionRegex.source}|${urlRegex.source}|${ethRegex.source}`,
      'gi'
    );

    let match: RegExpExecArray | null;
    while ((match = combinedRegex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));

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
        // ✅ clickable http/https links
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
        // ✅ clickable ETH address → truncated + links to Etherscan
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
}



/** format time ago (e.g., "1d", "5h", "3m") */
function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
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
  const years = Math.floor(months / 12);
  return `${years}y`;
}

/** get color based on tweet age */
function getTimeAgoColor(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const hours = Math.floor((now.getTime() - date.getTime()) / 1000 / 3600);

  if (hours < 6) return '#00ff41';
  if (hours < 24) return '#7cfc00';
  if (hours < 72) return '#ffa500';
  if (hours < 168) return 'rgb(235, 112, 112)';
  return 'rgb(235, 112, 112)';
}

export function TwitterHover({ url, children, openDelayMs = 180, placement = 'top', portal = true }: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Preview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [hasFetched, setHasFetched] = React.useState(false);
  const [maxHeight, setMaxHeight] = React.useState<number | undefined>(undefined);
  const arrowRef = React.useRef<HTMLDivElement | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const fetchingRef = React.useRef(false);

  const stableUrl = React.useMemo(() => normalizeXInput(url || ''), [url]);

const { refs, floatingStyles, context } = useFloating({
  open,
  onOpenChange: setOpen,
  placement,
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(8),
    flip(),
    shift({ padding: 8 }),
    size({
      apply({ availableHeight, elements }) {
        Object.assign(elements.floating.style, {
          maxHeight: `${Math.min(availableHeight - 16, 500)}px`,
        });
      },
      padding: 8,
    }),
    arrow({ element: arrowRef }),
  ],
});
  const hover = useHover(context, { delay: { open: openDelayMs, close: 250 } });
  const role = useRole(context, { role: 'dialog' });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, role, dismiss]);


  const CACHE_TTL_MS = 1000 * 60 * 15;

  const fetchPreview = React.useCallback(async () => {
    if (!stableUrl) return;
    if (fetchingRef.current) return;

    const cacheKey = stableUrl;
    const cached = CLIENT_CACHE.get(cacheKey);
    if (cached && cached.exp > Date.now()) {
      setData(cached.data);
      setHasFetched(true);
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const apiUrl = `${joinUrl(ORIGIN_BASE, API_PATH)}?url=${encodeURIComponent(stableUrl)}`;

    try {
      const r = await fetch(apiUrl, { signal: abortRef.current.signal });
      if (r.status === 429) {
        console.warn('Rate limit hit — retrying once after 1.5s...');
        await new Promise((r) => setTimeout(r, 1500));
        return await fetchPreview(); // retry once
      }
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`HTTP ${r.status}: ${txt || 'Upstream error'}`);
      }

      const j = await r.json();

      if ((j as any).error) {
        setError((j as any).error);
        return;
      }

      CLIENT_CACHE.set(cacheKey, { data: j, exp: Date.now() + CACHE_TTL_MS });
      setData(j);
      setHasFetched(true);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Preview fetch error:', e);
        setError(e?.message || 'Failed to load preview');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [stableUrl]);


  React.useEffect(() => {
    if (open) {
      fetchPreview();
    }
  }, [open, fetchPreview]);
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!open) {
      timer = setTimeout(() => {
        setData(null);
        setHasFetched(false);
        setError(null);
      }, 2000); // 2 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open]);

  React.useEffect(() => {
    setData(null);
    setError(null);
    setHasFetched(false);
    if (abortRef.current) abortRef.current.abort();
  }, [stableUrl]);

  React.useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const card = open ? (
    <div
      ref={refs.setFloating}
      style={{ ...(floatingStyles as React.CSSProperties), maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
  {...getFloatingProps({
    onClick: (e) => e.stopPropagation(), 
  })}      className="twitter-hover-card"
    >
      <div ref={arrowRef} className="twitter-hover-arrow" />
{loading && (
  <div className="twitter-hover-skeleton-container">
    <div className="twitter-hover-skeleton-banner"></div>
    <div className="twitter-hover-skeleton-content">
      <div className="twitter-hover-skeleton-avatar"></div>
      <div className="twitter-hover-skeleton-text">
        <div className="twitter-hover-skeleton-line twitter-hover-skeleton-line-name"></div>
        <div className="twitter-hover-skeleton-line twitter-hover-skeleton-line-username"></div>
      </div>
      <div className="twitter-hover-skeleton-bio">
        <div className="twitter-hover-skeleton-line twitter-hover-skeleton-line-full"></div>
        <div className="twitter-hover-skeleton-line twitter-hover-skeleton-line-full"></div>
        <div className="twitter-hover-skeleton-line twitter-hover-skeleton-line-medium"></div>
      </div>
      <div className="twitter-hover-skeleton-details">
        <div className="twitter-hover-skeleton-line twitter-hover-skeleton-line-small"></div>
        <div className="twitter-hover-skeleton-line twitter-hover-skeleton-line-small"></div>
      </div>
      <div className="twitter-hover-skeleton-metrics">
        <div className="twitter-hover-skeleton-line twitter-hover-skeleton-line-metric"></div>
        <div className="twitter-hover-skeleton-line twitter-hover-skeleton-line-metric"></div>
      </div>
      <div className="twitter-hover-skeleton-button"></div>
    </div>
  </div>
)}      {error && <div className="twitter-hover-error">{error}</div>}
      {!loading && !error && data?.kind === 'user' && <UserCard {...data.user} />}
      {!loading && !error && data?.kind === 'tweet' && <TweetCard {...data} />}
      {!loading && !error && data?.kind === 'community' && <CommunityCard {...data} />}
    </div>
  ) : null;

  const canPortal = typeof document !== 'undefined' && portal;

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()} className="twitter-hover-ref">
        {children}
      </span>
      {canPortal ? (card ? createPortal(card, document.body) : null) : card}
    </>
  );
}
function VerifiedBadge({ type }: { type?: string | null }) {
  const isBusiness =
    type?.toLowerCase?.() === 'business' ||
    type?.toLowerCase?.() === 'brand' ||
    type?.toLowerCase?.() === 'organization';
  
  const isGovernment = type?.toLowerCase?.() === 'government';

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 22 22"
      fill="none"
      className="twitter-hover-verified"
      style={{ filter: isBusiness ? 'none' : undefined }}
    >
      <path
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
        fill={isBusiness ? '#D4AF37' : isGovernment ? '#829AAB' : '#1D9BF0'}
      />
    </svg>
  );
}

function UserCard(props: {
  id: string;
  name: string;
  username: string;
  avatar: string;
  banner?: string | null;
  verified: boolean;
  verified_type?: string | null;
  description: string;
  followers: number | null;
  following: number | null;
  created_at: string;
  url: string;
  location?: string;
}) {
  const profileUrl = `https://x.com/${props.username}`;
  const isBusiness = props.verified_type === 'business';

  return (
    <div className="twitter-hover-usercard">
      {props.banner && (
        <div className="twitter-hover-banner">
          <img src={props.banner} alt="" className="twitter-hover-banner-image" />
        </div>
      )}
      <div className="twitter-hover-body">
        <div className="twitter-hover-top-row">
          <div className="twitter-hover-header">
            <img
              src={props.avatar}
              alt=""
              className="twitter-hover-avatar"
              style={{ borderRadius: isBusiness ? '6px' : '50%' }}
            />
            <div className="twitter-hover-header-text">
              <div className="verify-name">
                <span className="twitter-hover-name">{props.name}</span>
                {props.verified && <VerifiedBadge type={props.verified_type} />}
              </div>
              <a
                href={profileUrl}
                target="_blank"
                rel="noreferrer"
                className="twitter-hover-username"
                onClick={(e) => e.stopPropagation()}
              >
                @{props.username}
              </a>
            </div>
          </div>
          <a
            href={profileUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <img className="twitter-hover-icon" src={twitter} />
          </a>
        </div>
        {props.description && <p className="twitter-hover-desc">{parseTextWithMentions(props.description, false)}</p>}

        <div className="twitter-hover-details">
          {props.location && props.location.trim() && (
            <span className="twitter-hover-location">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="twitter-hover-location-icon">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {props.location}
            </span>
          )}
          <span className="twitter-hover-join-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="twitter-hover-calendar-icon">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c-1.1 0-2-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
            </svg>
            Joined {new Date(props.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="twitter-hover-metrics">
          {props.following != null && (
            <span>
              <b className="twitter-hover-metrics-number">{Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(props.following)}</b> Following
            </span>
          )}
          {props.followers != null && (
            <span>
              <b className="twitter-hover-metrics-number">{Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(props.followers)}</b> Followers
            </span>
          )}
        </div>
        <div className="twitter-hover-link">
          <a href={profileUrl} target="_blank" rel="noreferrer" className="twitter-link">
            See Profile on X
          </a>
        </div>
      </div>
    </div>
  );
}

function CommunityCard({
  community,
  url,
}: {
community: {
  name: string;
  description: string;
  member_count: number;
  created_at: string;
  banner_url?: string | null;
  creator?: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    verified_type?: string | null;
    followers: number;
    following: number;
  } | null;
  members_preview?: Array<{
    id?: string;
    name?: string;
    profile_image_url_https?: string;
    profilePicture?: string;
  }>;
  primary_topic?: {
    id?: string;
    name?: string;
  } | null;
};

  url: string;
}) {
  return (
    <div className="twitter-hover-communitycard">
      {community.banner_url && (
        <div className="twitter-hover-banner">
          <img src={community.banner_url} alt="" className="twitter-hover-banner-image" />
        </div>
      )}

      <div className="twitter-hover-body">
        <div className="twitter-hover-top-row">
          <div className="twitter-community-hover-header-text">
            <div className="verify-name">
              <span className="twitter-hover-name">{community.name}</span>
              {community.primary_topic?.name && (
                <span
                  className="twitter-hover-topic"
                  style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    padding: '2px 8px',
                    background: '#1d9bf0',
                    color: '#fff',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {community.primary_topic.name}
                </span>
              )}

            </div>

            <div className="twitter-hover-community-members">
              <div className="member-avatars">
                {community.members_preview?.slice(0, 4).map(
                  (
                    m: {
                      id?: string;
                      name?: string;
                      profile_image_url_https?: string;
                      profilePicture?: string;
                    },
                    i: number
                  ) => (
                    <img
                      key={m.id || i}
                      src={m.profile_image_url_https || m.profilePicture || ''}
                      alt={m.name || ''}
                      className="member-avatar"
                      style={{ zIndex: 4 - i }}
                    />
                  )
                )}
              </div>
              <span>
                <b className="twitter-hover-metrics-number">
                  {community.member_count}</b> members</span>
            </div>
          </div>

          <div className="twitter-community-top-right-section">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <img className="twitter-hover-icon" src={twitter} />
            </a>

            <div
              className="twitter-hover-time-ago"
              style={{ color: getTimeAgoColor(community.created_at) }}
            >
              <span>{formatTimeAgo(community.created_at)}</span>
            </div>
          </div>
        </div>

{community.description && (
  <p className="twitter-hover-desc">{parseTextWithMentions(community.description, false)}</p>
)}

        {community.creator && (
          <div
            style={{
              borderTop: '1.5px solid #b5bcf818',
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                color: '#8098a5',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              Created by
            </span>

            <div
              className="twitter-hover-author-info"
              style={{ borderBottom: 'none', paddingBottom: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img
                  src={community.creator.avatar}
                  alt=""
                  className="twitter-hover-avatar"
                  style={{
                    width: '2.75rem',
                    height: '2.75rem',
                    borderRadius: '50%',
                  }}
                />
                <div className="twitter-hover-header-text">
                  <div className="verify-name">
                    <span className="twitter-hover-name">{community.creator.name}</span>
                    {community.creator.verified && (
                      <VerifiedBadge
                        type={community.creator.verified_type || undefined}
                      />
                    )}
                  </div>
                  <a
                    href={`https://x.com/${community.creator.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="twitter-hover-username-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    @{community.creator.username}
                  </a>
                </div>
              </div>
            </div>

            <div className="twitter-hover-metrics">
              <span>
                <b className="twitter-hover-metrics-number">
                  {Intl.NumberFormat('en', { notation: 'compact' }).format(
                    community.creator.following
                  )}
                </b>{' '}
                Following
              </span>
              <span>
                <b className="twitter-hover-metrics-number">
                  {Intl.NumberFormat('en', { notation: 'compact' }).format(
                    community.creator.followers
                  )}
                </b>{' '}
                Followers
              </span>
            </div>
          </div>
        )}

        {/* ===== View Community Link ===== */}
        <div className="twitter-hover-link">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="twitter-link"
          >
            View community on X
          </a>
        </div>
      </div>
    </div>
  );
}



function TweetCard(payload: {
  tweet: {
    id: string;
    text: string;
    created_at: string;
    metrics: Record<string, number>;
    possibly_sensitive: boolean;
    media?: Media[];
    is_reply?: boolean;
    in_reply_to_username?: string;
    in_reply_to_user_id?: string;
  };
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    verified_type?: string | null;
    created_at: string;
    followers: number | null;
    following: number | null;
  } | null;
  url: string;
}) {
  const a = payload.author;
  const allMedia = payload.tweet.media ?? [];
  const photos = allMedia.filter((m) => m.type === 'photo');
  const videos = allMedia.filter((m) => m.type === 'video' || m.type === 'animated_gif');
  const hasAnyMedia = allMedia.length > 0;
  const isBusiness = a?.verified_type === 'business';

  return (
    <div className="twitter-hover-tweetcard">
      <div className="twitter-hover-body">
        {a && (
          <div className="twitter-hover-top-row">
            <div className="twitter-hover-header">
              <img
                src={a.avatar}
                alt=""
                className="twitter-hover-avatar"
                style={{ borderRadius: isBusiness ? '6px' : '50%' }}
              />
              <div className="twitter-hover-header-text">
                <div className="verify-name">
                  <span className="twitter-hover-name">{a.name}</span>
                  {a.verified && <VerifiedBadge type={a.verified_type} />}
                </div>
                <a
                  href={`https://x.com/${a.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="twitter-hover-username-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{a.username}
                </a>
              </div>
            </div>
            <div className="twitter-top-right-section">
              <a
                href={`https://x.com/${a.username}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <img className="twitter-hover-icon" src={twitter} />
              </a>
              <div className="twitter-hover-time-ago" style={{ color: getTimeAgoColor(payload.tweet.created_at) }}>
                <span>{formatTimeAgo(payload.tweet.created_at)}</span>
              </div>
            </div>
          </div>
        )}

        {a && (
          <div className="twitter-hover-author-info">
            {a.created_at && (
              <span className="twitter-hover-join-date">
                Joined {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
            {a.followers != null && (
              <span className="twitter-hover-tweet-metrics-label">
                <b className="twitter-hover-metrics-number">{Intl.NumberFormat('en', { notation: 'compact' }).format(a.followers)}</b> Followers
              </span>
            )}
          </div>
        )}

        <div className="twitter-hover-text-container-new">
          {payload.tweet.is_reply && payload.tweet.in_reply_to_username && (
            <div className="twitter-reply-indicator">
              <div className="twitter-reply-line"></div>
              <div className="twitter-reply-text">
                Replying to{' '}
                <a
                  href={`https://x.com/${payload.tweet.in_reply_to_username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="twitter-reply-mention"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{payload.tweet.in_reply_to_username}
                </a>
              </div>
            </div>
          )}
          <p className="twitter-hover-text">{parseTextWithMentions(payload.tweet.text, hasAnyMedia)}</p>

          {photos.length > 0 && (
            <div className={`twitter-hover-photos twitter-hover-photos-${photos.length}`}>
              {photos.map((m, i) => (
                <img key={i} src={m.url} alt="" className="twitter-hover-photo" />
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
                      style={{ borderRadius: '0.5rem', width: '100%', height: 'auto' }}
                    />
                  ) : (
                    <video
                      src={m.url}
                      controls
                      className="twitter-hover-video"
                      style={{ borderRadius: '0.5rem', width: '100%', height: 'auto' }}
                      preload="metadata"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="twitter-hover-meta">
          <span>{new Date(payload.tweet.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}</span>
          <div className="bookmark-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="bookmark-icon">
              <path d="M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z" />
            </svg>
          </div>
        </div>

        <div className="twitter-hover-engagement">
          <div className="comment-engagement-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="comment-engagement-icon">
              <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z" />
            </svg>
            <span className="engagement-state-value">{payload.tweet.metrics.reply_count >= 0 ? Intl.NumberFormat().format(payload.tweet.metrics.reply_count) : ''}</span>
          </div>
          <div className="repost-engagement-stat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="repost-engagement-icon">
              <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.791-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 20.12L12.068 16l1.364-1.46L16.5 16.45V8c0-1.1-.896-2-2-2H11V4h3.5c2.209 0 4 1.791 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.12z" />
            </svg>
            <span className="engagement-state-value">{payload.tweet.metrics.retweet_count >= 0 ? Intl.NumberFormat().format(payload.tweet.metrics.retweet_count) : ''}</span>
          </div>
          <div className="like-engagement-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="like-engagement-icon">
              <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
            </svg>
            <span className="engagement-state-value">{payload.tweet.metrics.like_count >= 0 ? Intl.NumberFormat().format(payload.tweet.metrics.like_count) : ''}</span>
          </div>
        </div>

        <div className="twitter-hover-link">
          <a href={payload.url} target="_blank" rel="noreferrer" className="twitter-link">
            Read More on X
          </a>
        </div>
      </div>
    </div>
  );
}