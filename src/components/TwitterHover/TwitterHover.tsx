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
} from '@floating-ui/react';
import './TwitterHover.css';
import type { Placement } from '@floating-ui/react';
import verified from '../../assets/verified.png'
/** ---------- Types returned by the backend ---------- */
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
      created_at: string;
      followers: number | null;
      following: number | null;
      description: string;
      location?: string;
      url: string;
    };
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
    };
    author: { id: string; name: string; username: string; avatar: string; verified: boolean } | null;
    url: string;
  };

type Props = {
  url: string;
  children: React.ReactNode;
  openDelayMs?: number;
  placement?: Placement;
  portal?: boolean;
};

const CLIENT_CACHE = new Map<string, { data: Preview; exp: number }>();
const INFLIGHT = new Map<string, Promise<Response>>();

const API_BASE =
  (import.meta as any).env?.VITE_PREVIEW_API_BASE ||
  'http://localhost:3000';

function parseTextWithMentions(text: string, hasMedia = false) {
  let processedText = text;

  // Remove t.co URLs when media is present (they're redundant since we show media separately)
  if (hasMedia) {
    processedText = processedText.replace(/https:\/\/t\.co\/\S+/g, '').trim();
  }

  const mentionRegex = /@([A-Za-z0-9_]{1,15})\b/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(processedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processedText.slice(lastIndex, match.index));
    }

    const username = match[1];
    parts.push(
      <a
        key={`mention-${match.index}`}
        href={`https://x.com/${username}`}
        target="_blank"
        rel="noreferrer"
        className="twitter-mention"
        onClick={(e) => e.stopPropagation()}
      >
        @{username}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < processedText.length) {
    parts.push(processedText.slice(lastIndex));
  }

  return parts.length > 1 ? parts : processedText;
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

  const stableUrl = React.useMemo(() => url?.trim() || '', [url]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 }), arrow({ element: arrowRef })],
  });

  const hover = useHover(context, { delay: { open: openDelayMs, close: 250 } });
  const role = useRole(context, { role: 'dialog' });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, role, dismiss]);
React.useEffect(() => {
  if (open && refs.floating.current) {
    const floating = refs.floating.current;
    const rect = floating.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const availableBelow = viewportHeight - rect.top - 20;
    const availableAbove = rect.top - 20; 
    
    const maxAvailable = Math.max(availableBelow, availableAbove);
    const calculatedMaxHeight = Math.min(maxAvailable, 500); 
    
    setMaxHeight(Math.max(calculatedMaxHeight, 200)); // Minimum 200px
  }
}, [open, floatingStyles]);
  React.useEffect(() => {
    console.log('🎭 TwitterHover State:', {
      open,
      loading,
      hasFetched,
      fetchingRef: fetchingRef.current,
      dataKind: data?.kind,
      error: !!error,
      url: stableUrl
    });
  }, [open, loading, hasFetched, data?.kind, error, stableUrl]);

  const fetchPreview = React.useCallback(async () => {
    if (!stableUrl) {
      console.log('❌ TwitterHover: No URL provided');
      return;
    }

    if (fetchingRef.current) {
      console.log('⏸️ TwitterHover: Already fetching, skipping');
      return;
    }

    const key = stableUrl;
    console.log('🔍 TwitterHover: Starting fetch for URL:', key);

    const now = Date.now();
    const hit = CLIENT_CACHE.get(key);
    if (hit && hit.exp > now) {
      console.log('💾 TwitterHover: Using cached data:', hit.data);
      setData(hit.data);
      setHasFetched(true);
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    if (abortRef.current) {
      console.log('⏹️ TwitterHover: Aborting previous request');
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    try {
      const target = `${API_BASE}/api/x/preview?url=${encodeURIComponent(stableUrl)}`;
      console.log('🌐 TwitterHover: Making API request to:', target);

      let req = INFLIGHT.get(key);
      if (!req) {
        req = fetch(target, {
          signal: abortRef.current.signal,
          mode: 'cors',
          credentials: 'omit'
        });
        INFLIGHT.set(key, req);
      } else {
        console.log('🔄 TwitterHover: Request already in flight, waiting...');
      }

      const r = await req;
      console.log('📡 TwitterHover: API response status:', r.status, r.statusText);

      if (INFLIGHT.get(key) === req) {
        INFLIGHT.delete(key);
      }

      if (!r.ok) {
        const txt = await r.text();
        console.error('❌ TwitterHover: API error response:', { status: r.status, text: txt });
        if (r.status === 429) throw new Error('Rate limited (429). Try again soon.');
        throw new Error(`HTTP ${r.status}: ${txt}`);
      }

      const j = (await r.json()) as Preview;
      console.log('✅ TwitterHover: API success response:', j);

      CLIENT_CACHE.set(key, { data: j, exp: now + 60 * 60 * 1000 });
      setData(j);
      setHasFetched(true);
      console.log('💾 TwitterHover: Data cached and set in state');

    } catch (e: any) {
      const isAbort =
        e?.name === 'AbortError' ||
        (e instanceof DOMException && e.name === 'AbortError') ||
        /abort/i.test(String(e?.message));

      if (!isAbort) {
        console.error('❌ TwitterHover: Fetch error:', e);
        setError(e?.message || 'Failed to load preview');
      } else {
        console.log('⏹️ TwitterHover: Request aborted');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [stableUrl]);

  React.useEffect(() => {
    if (open && !hasFetched && !loading && !data && !error) {
      console.log('🚀 TwitterHover: Triggering fetch because popup opened');
      fetchPreview();
    }
  }, [open, hasFetched, loading, data, error, fetchPreview]);

  React.useEffect(() => {
    console.log('🔄 TwitterHover: URL changed, resetting state');
    setData(null);
    setError(null);
    setHasFetched(false);

    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, [stableUrl]);

  React.useEffect(() => {
    return () => {
      console.log('🧹 TwitterHover: Cleanup on unmount');
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const card = open ? (
<div
  ref={refs.setFloating}
  style={{
    ...floatingStyles as React.CSSProperties,
    maxHeight: maxHeight ? `${maxHeight}px` : undefined
  }}
  {...getFloatingProps()}
  className="twitter-hover-card"
>
      <div ref={arrowRef} className="twitter-hover-arrow" />
      {loading && (
        <div className="twitter-hover-skeleton">
        </div>
      )}
      {error && <div className="twitter-hover-error">{error}</div>}
      {!loading && !error && data?.kind === 'user' && (() => {
        console.log('👤 TwitterHover: Rendering UserCard with data:', data.user);
        return <UserCard {...data.user} />;
      })()}
      {!loading && !error && data?.kind === 'tweet' && (() => {
        console.log('🐦 TwitterHover: Rendering TweetCard with data:', data);
        return <TweetCard {...data} />;
      })()}
    </div>
  ) : null;

  return (
    <>
      <span ref={refs.setReference} {...getReferenceProps()} className="twitter-hover-ref">
        {children}
      </span>
      {portal ? (card ? createPortal(card, document.body) : null) : card}
    </>
  );
}

function VerifiedBadge() {
  return (
    <img src={verified} alt="Verified badge" className="twitter-hover-verified" />
  );
}

function UserCard(props: {
  id: string;
  name: string;
  username: string;
  avatar: string;
  banner?: string | null;
  verified: boolean;
  description: string;
  followers: number | null;
  following: number | null;
  created_at: string;
  url: string;
  location?: string;
}) {
  console.log('👤 UserCard: Rendering with props:', props);
  console.log('🖼️ Banner data:', {
    banner: props.banner,
    hasBanner: !!props.banner,
    bannerType: typeof props.banner
  });

  const profileUrl = `https://x.com/${props.username}`;

  return (
    <div className="twitter-hover-usercard">
      {props.banner && (
        <div className="twitter-hover-banner">
          <img
            src={props.banner}
            alt=""
            className="twitter-hover-banner-image"
            onLoad={() => console.log('✅ Banner image loaded successfully')}
            onError={() => console.log('❌ Banner image failed to load')}
          />
        </div>
      )}

      <div className="twitter-hover-body">
        <div className="twitter-hover-header">
          <img src={props.avatar} alt="" className="twitter-hover-avatar" />
          <div className="twitter-hover-header-text">
            <div className="verify-name">
              <span className="twitter-hover-name">{props.name}</span>
              {props.verified && <VerifiedBadge />}
            </div>
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="twitter-hover-username-link"
              onClick={(e) => e.stopPropagation()}
            >
              @{props.username}
            </a>
          </div>
        </div>
        {props.description && (
          <p className="twitter-hover-desc">
            {parseTextWithMentions(props.description, false)}
          </p>
        )}

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
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
            </svg>
            Joined {new Date(props.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="twitter-hover-metrics">
          {props.followers != null && (
            <span>
              <b className="twitter-hover-metrics-number">{Intl.NumberFormat().format(props.followers)}</b> Followers
            </span>
          )}
          {props.following != null && (
            <span>
              <b className="twitter-hover-metrics-number">{Intl.NumberFormat().format(props.following)}</b> Following
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

function TweetCard(payload: {
  tweet: { id: string; text: string; created_at: string; metrics: Record<string, number>; possibly_sensitive: boolean; media?: Media[] };
  author: { id: string; name: string; username: string; avatar: string; verified: boolean } | null;
  url: string;
}) {
  console.log('🐦 TweetCard: Rendering with payload:', payload);

  const a = payload.author;
  const photos = payload.tweet.media?.filter((m) => m.type === 'photo') ?? [];

  return (
    <div className="twitter-hover-tweetcard">
      <div className="twitter-hover-body">
        {a && (
          <div className="twitter-hover-header">
            <img src={a.avatar} alt="" className="twitter-hover-avatar" />
            <div className='twitter-hover-header-text'>
              <div className="verify-name">
                <span className="twitter-hover-name">{a.name}</span>
                {a.verified && <VerifiedBadge />}
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
        )}

        <div className="twitter-hover-text-container">
          <p className="twitter-hover-text">
            {parseTextWithMentions(payload.tweet.text, photos.length > 0)}
          </p>
        </div>

        {photos.length > 0 && (
          <div className={`twitter-hover-photos twitter-hover-photos-${photos.length}`}>
            {photos.map((m, i) => (
              <img key={i} src={m.url} alt="" className="twitter-hover-photo" />
            ))}
          </div>
        )}

        <div className="twitter-hover-meta">
          <span>{new Date(payload.tweet.created_at).toLocaleString()}</span>
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
            <span>{payload.tweet.metrics.reply_count >= 0 ? Intl.NumberFormat().format(payload.tweet.metrics.reply_count) : ''}</span>
          </div>
          <div className="repost-engagement-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="repost-engagement-icon">
              <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.791-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 20.12L12.068 16l1.364-1.46L16.5 16.45V8c0-1.1-.896-2-2-2H11V4h3.5c2.209 0 4 1.791 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.12z" />
            </svg>
            <span>{payload.tweet.metrics.retweet_count >= 0 ? Intl.NumberFormat().format(payload.tweet.metrics.retweet_count) : ''}</span>
          </div>
          <div className="like-engagement-stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="like-engagement-icon">
              <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
            </svg>
            <span>{payload.tweet.metrics.like_count >= 0 ? Intl.NumberFormat().format(payload.tweet.metrics.like_count) : ''}</span>
          </div>
        </div>

        <div className="twitter-hover-link">
          <a href={payload.url} target="_blank" rel="noreferrer" className="twitter-link">
            Open on X
          </a>
        </div>
      </div>
    </div>
  );
}