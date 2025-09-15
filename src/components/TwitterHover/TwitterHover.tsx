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

function parseTextWithMentions(text: string) {
  const mentionRegex = /@([A-Za-z0-9_]{1,15})\b/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
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

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 1 ? parts : text;
}

export function TwitterHover({ url, children, openDelayMs = 180, placement = 'top', portal = true }: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Preview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [hasFetched, setHasFetched] = React.useState(false);

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
      style={floatingStyles as React.CSSProperties}
      {...getFloatingProps()}
      className="twitter-hover-card"
    >
      <div ref={arrowRef} className="twitter-hover-arrow" />
      {loading && (
        <div className="twitter-hover-skeleton">
          <div>Loading preview...</div>
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
    {parseTextWithMentions(props.description)}
  </p>
)}

<div className="twitter-hover-details">
  {props.location && props.location.trim() && (
    <span className="twitter-hover-location">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="twitter-hover-location-icon">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
      {props.location}
    </span>
  )}
  <span className="twitter-hover-join-date">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="twitter-hover-calendar-icon">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
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
            {parseTextWithMentions(payload.tweet.text)}
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
          {new Date(payload.tweet.created_at).toLocaleString()}
        </div>

        <div className="twitter-hover-engagement">
          {payload.tweet.metrics.like_count > 0 && (
            <span className="engagement-stat">
              <b>{Intl.NumberFormat().format(payload.tweet.metrics.like_count)}</b> likes
            </span>
          )}
          {payload.tweet.metrics.retweet_count > 0 && (
            <span className="engagement-stat">
              <b>{Intl.NumberFormat().format(payload.tweet.metrics.retweet_count)}</b> reposts
            </span>
          )}
          {payload.tweet.metrics.reply_count > 0 && (
            <span className="engagement-stat">
              <b>{Intl.NumberFormat().format(payload.tweet.metrics.reply_count)}</b> replies
            </span>
          )}
          {payload.tweet.metrics.quote_count > 0 && (
            <span className="engagement-stat">
              <b>{Intl.NumberFormat().format(payload.tweet.metrics.quote_count)}</b> quotes
            </span>
          )}
          {payload.tweet.metrics.impression_count > 0 && (
            <span className="engagement-stat">
              <b>{Intl.NumberFormat().format(payload.tweet.metrics.impression_count)}</b> views
            </span>
          )}
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