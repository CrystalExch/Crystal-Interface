import React, { useEffect, useRef, useState } from 'react';
import crystalxp from '../../assets/CrystalX.png';
import arrow from '../../assets/arrow.svg';
import CrownIcon from '../../assets/crownicon.png';
import defaultPfp from '../../assets/leaderboard_default.png';
import firstPlacePfp from '../../assets/leaderboard_first.png';
import secondPlacePfp from '../../assets/leaderboard_second.png';
import thirdPlacePfp from '../../assets/leaderboard_third.png';
import LeaderboardImage from '../../assets/leaderboardbanner.png';
import CopyButton from '../CopyButton/CopyButton';

import './Leaderboard.css';

interface DigitRollerProps {
  digit: string;
  duration?: number;
}

const DigitRoller: React.FC<DigitRollerProps> = ({
  digit,
  duration = 600,
}) => {
  const prevRef = useRef(parseInt(digit, 10) || 0);
  const wheelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const node = wheelRef.current;
  if (!node) return;

  const from = prevRef.current;                  
  const to   = parseInt(digit, 10) || 0;          
  const DIGIT_HEIGHT = 1.2;                          
  const distance   = (to - from + 10) % 10;         

  if (distance === 0) {
    node.style.transition = '';
    node.style.transform  = `translateY(-${to * DIGIT_HEIGHT}em)`;
    return;
  }

  const endIndex = from + distance;              

  requestAnimationFrame(() => {
    node.style.transition = `transform ${duration}ms ease-in-out`;
    node.style.transform  = `translateY(-${endIndex * DIGIT_HEIGHT}em)`;
  });

  const onEnd = () => {
    node.style.transition = '';                    
    requestAnimationFrame(() => {
      prevRef.current = to;                        
      node.style.transform = `translateY(-${to * DIGIT_HEIGHT}em)`;
    });
  };

  node.addEventListener('transitionend', onEnd, { once: true });
  return () => { node.removeEventListener('transitionend', onEnd); };
}, [digit, duration]);

const staticDigits = Array.from({length: 20}, (_, i) => i % 10);

return (
  <div className="digit-roller-container">
    <div ref={wheelRef} className="digit-wheel">
      {staticDigits.map((n, i) => <div key={i}>{n}</div>)}
    </div>
  </div>
);
};


interface NumberRollerProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: React.ReactNode;
}

const NumberRoller: React.FC<NumberRollerProps> = ({ 
  value, 
  duration = 1000,
  decimals = 2,
  suffix
}) => {
  const formattedValue = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  const characters = formattedValue.split('');
  
  return (
    <div className="number-roller">
      {characters.map((char, index) => (
        char === '.' || char === ',' ? (
          <span key={`separator-${index}`} className="separator">{char}</span>
        ) : (
          <DigitRoller 
            key={`digit-${index}`} 
            digit={char} 
            duration={duration}
          />
        )
      ))}
      {suffix && <span className="roller-suffix">{suffix}</span>}
    </div>
  );
};

interface OverviewResponse {
  address: string;
  username: string;
  rank: number;
  boosted_points: number;
  referral_points: number;
  global_total_points: number;
  wallets_above_0_01: number;
  top_three: Array<{
    address: string;
    username: string;
    total_points: number;
    boosted_points: number;
    referral_points: number;
  }>;
  page: {
    [address: string]: [string, number, number];
  };
}

interface LeaderboardProps {
  setpopup?: (value: number) => void;
  orders: any[];
  address: any;
  username: any;
}

const ITEMS_FIRST_PAGE = 47;
const ITEMS_OTHER_PAGES = 50;

const Leaderboard: React.FC<LeaderboardProps> = ({
  setpopup = () => { },
  orders,
  address,
  username,
}) => {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [manualPaging, setManualPaging] = useState(false);
  const rowsRef = useRef<HTMLDivElement>(null);
  const prevPageRef = useRef<number>(currentPage);

  useEffect(() => {
    prevPageRef.current = currentPage;
  }, [currentPage]);
  const loading = !overview;
  const placeholderCount = (loading || paginationLoading)
    ? (paginationLoading && prevPageRef.current === 0 && currentPage === 1
      ? ITEMS_OTHER_PAGES
      : currentPage === 0
        ? ITEMS_FIRST_PAGE
        : ITEMS_OTHER_PAGES)
    : 0;

  
  useEffect(() => {
    if (!address) return;
    let mounted = true;

    if (overview) {
      setPaginationLoading(true);
    }

    const fetchOverview = () => {
      fetch(
        `https://api.crystal.exchange/points/${address}?index=${currentPage}`
      )
        .then((res) => {
          if (!res.ok) throw new Error(`status ${res.status}`);
          return res.json() as Promise<OverviewResponse>;
        })
        .then((data) => {
          if (!mounted) return;
          setOverview(data);
          setPaginationLoading(false);
        })
        .catch((err) => {
          console.error('fetch overview error', err);
          setPaginationLoading(false);
        });
    };

    fetchOverview();
    const iv = setInterval(fetchOverview, 3000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [address, currentPage]);

  useEffect(() => {
    const calculate = () => {
      const target = new Date('2025-06-01T00:00:00-04:00').getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calculate();
    const t = setInterval(calculate, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (manualPaging && rowsRef.current) {
      const rows = rowsRef.current.querySelectorAll<HTMLElement>('.leaderboard-row');
      if (rows.length) rows[rows.length - 1].scrollIntoView({ behavior: 'auto' });
      setManualPaging(false);
    }
  }, [manualPaging]);

  const handleConnectWallet = () => setpopup(4);

  const totalPages = overview
    ? (() => {
      const totalUsers = overview.wallets_above_0_01;
      const afterTop3 = Math.max(totalUsers - 3, 0);
      if (afterTop3 <= ITEMS_FIRST_PAGE) return 1;
      return 1 + Math.ceil((afterTop3 - ITEMS_FIRST_PAGE) / ITEMS_OTHER_PAGES);
    })()
    : 1;

  const goToPreviousPage = () => {
    if (currentPage > 0) {
    setManualPaging(true);
     setPaginationLoading(true);
      setCurrentPage((p) => p - 1);
    }
  };

  const goToNextPage = () => {
    if (overview && currentPage < totalPages - 1) {
      setManualPaging(true);
      setPaginationLoading(true);
      setCurrentPage((p) => p + 1);
    }
  };

  const goToUserPosition = () => {
    if (!overview) return;
    const r = overview.rank;

    if (r <= 3) {
      setPaginationLoading(true);
      setCurrentPage(0);
      setTimeout(
        () => {
          document
            .querySelector('.leaderboard-banner')
            ?.scrollIntoView({ behavior: 'smooth' });
        },
        100
      );
    } else {
      let page = 0;
      if (r > 3 + ITEMS_FIRST_PAGE) {
        page = 1 + Math.floor((r - (3 + ITEMS_FIRST_PAGE) - 1) / ITEMS_OTHER_PAGES);
      }

      if (currentPage !== page) {
        setPaginationLoading(true);
        setCurrentPage(page);
      }

      setTimeout(
        () => {
          document
            .querySelector('.current-user-row')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        200
      );
    }
  };

  const getDisplayAddress = (addr: string) =>
    addr.startsWith('0x') ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
    
  return (
    <div className={`leaderboard-container ${loading ? 'is-loading' : ''}`}>
      {!address && (
        <div className="connect-wallet-overlay">
          <div className="connect-wallet-content">
            <h2>{t('connectYourWallet')}</h2>
            <p>{t('connectYourWalletSubtitle')}</p>
            <button
              type="button"
              className="leaderboard-connect-wallet-button"
              onClick={handleConnectWallet}
            >
              <div className="connect-content">{t('connectWallet')}</div>
            </button>
          </div>
        </div>
      )}

      <div className="leaderboard-banner">
        <div className="banner-overlay">
          <img src={LeaderboardImage} className="leaderboard-image" />
          <div className="view-rules-button" onClick={() => setpopup(15)}>
            {t('viewRules')}
          </div>
          <div className="countdown-timer">
            <div className="countdown-time">
              {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </div>
          </div>

          <div className="progress-container">
            <div className={`xp-display ${loading ? 'loading' : ''}`}>
              {loading ? (
                <div className="total-xp-loading" />
              ) : (
                <span className="progress-bar-amount-header">
                  <NumberRoller 
                    value={overview!.global_total_points}
                    decimals={2}
                    duration={800}
                  /> / 1,000,000,000.00
                  <img src={crystalxp} className="xp-icon" />
                </span>
              )}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: loading
                    ? '0%'
                    : `${(overview!.global_total_points / 1_000_000_000) * 100}%`,
                }}
              />
            </div>
          </div>

          {!loading && (
            <div className="leaderboard-user-info">
              <div className="info-column">
                <div className="column-header">
                  {t('username')}{' '}
                  <button
                    className="edit-username-button"
                    onClick={() => setpopup(16)}
                  >
                    {t('edit')}
                  </button>
                </div>
                <div className="column-content">
                  <span className="leaderboard-user-address">
                    @{username && username.trim() !== ''
                      ? (username.startsWith('0x') ? getDisplayAddress(username) : username)
                      : overview!.username && overview!.username.trim() !== ''
                        ? (overview!.username.startsWith('0x') ? getDisplayAddress(overview!.username) : overview!.username)
                        : getDisplayAddress(overview!.address)}
                    <CopyButton textToCopy={overview!.address} />
                  </span>
                </div>
              </div>
              <div className="column-divider" />

              <div className="info-column">
                <div className="earned-xp-header">
                  <img src={crystalxp} className="xp-icon" />
                  <div className="column-header">{t('earned')}</div>
                </div>
                <div className="column-content">
                  <NumberRoller 
                    value={overview!.boosted_points} 
                    decimals={2}
                    duration={800}
                  />
                </div>
              </div>
              <div className="column-divider" />

              <div className="info-column">
                <div className="earned-xp-header">
                  <img src={crystalxp} className="xp-icon" />
                  <div className="column-header">{t('bonusCommision')}</div>
                </div>
                <div className="column-content">
                  <NumberRoller 
                    value={overview!.referral_points} 
                    decimals={2}
                    duration={800}
                  />
                </div>
              </div>
              <div className="column-divider" />

              <div className="info-column">
                <div className="column-header">{t('rank')}</div>
                <div className="column-content">#{overview!.rank}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="top-factions">
        {loading
          ? Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className={`faction-card rank-${i + 1}`}>
                {i === 0 && (
                  <div className="crown-icon-container">
                    <img src={CrownIcon} className="crown-icon" />
                  </div>
                )}
                <div className="faction-rank">{i + 1}</div>
                <div className="faction-info">
                  <div className="pfp-container">
                    <div className="pfp-loading account-loading-animation" />
                  </div>
                  <div className="account-top-name-loading account-loading-animation" />
                  <div className="account-top-xp-loading account-loading-animation" />
                </div>
              </div>
            ))
          : overview!.top_three.map((f, i) => {
            const displayName = overview!.address === f.address ? username || overview!.username || getDisplayAddress(overview!.address) :
              f.username && f.username !== f.address
                ? f.username
                : getDisplayAddress(f.address);
            return (
              <div
                key={f.address}
                className={`faction-card rank-${i + 1} ${overview!.address === f.address ? 'user-faction' : ''
                  }`}
              >
                {i === 0 && (
                  <div className="crown-icon-container">
                    <img src={CrownIcon} className="crown-icon" />
                  </div>
                )}
                <div className="faction-rank">{i + 1}</div>
                <div className="faction-info">
                  <div className="pfp-container">
                    <img src={[firstPlacePfp, secondPlacePfp, thirdPlacePfp][i]} className="pfp-image" />
                  </div>
                  <div className="faction-name">
                    {displayName}
                    <div className="copy-button-wrapper">
                      <CopyButton textToCopy={f.address} />
                    </div>
                  </div>
                  <div className="faction-xp">
                    <NumberRoller 
                      value={f.total_points < 0.01 ? 0 : f.total_points}
                      decimals={2}
                      duration={800}
                      suffix={<img src={crystalxp} className="top-xp-icon" />}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>

        <div className="leaderboard-headers">
          <div className="header-rank">{t('rank')}</div>
          <div className="header-bonus">{t('totalXP')}</div>
        </div>

        <div
  ref={rowsRef}
  className={`leaderboard-rows ${paginationLoading ? 'is-loading' : ''}`}
>
  {(loading || paginationLoading)
    ? Array(placeholderCount).fill(0).map((_, i) => (
        <div key={i} className="leaderboard-row">
                <div className="leaderboard-inner-row">
                  <div className="row-rank">
                    <span className="loading-placeholder" />
                  </div>
                  <div className="row-faction">
                    <div className="row-pfp-container">
                      <div className="row-pfp-loading loading-placeholder" />
                    </div>
                    <span className="faction-row-name loading-placeholder" />
                  </div>
                  <div className="row-xp">
                    <div className="leaderboard-xp-amount loading-placeholder" />
                  </div>
                </div>
              </div>
            ))
          : Object.entries(overview!.page).map(
            ([addr, [_username, boosted, referral]], idx) => {
              const total = boosted + referral;
              const displayName = overview!.address === addr ? username || overview!.username || getDisplayAddress(overview!.address) :
                _username && _username !== addr
                  ? _username
                  : getDisplayAddress(addr);

              const startIndex =
                currentPage === 0
                  ? 3
                  : 3 + ITEMS_FIRST_PAGE + (currentPage - 1) * ITEMS_OTHER_PAGES;
              const rank = startIndex + idx + 1;

              const isCurrent = addr === overview!.address;

              return (
                <div
                  key={addr}
                  className={`leaderboard-row ${isCurrent ? 'current-user-row' : ''
                    }`}
                >
                  <div className="leaderboard-inner-row">
                    <div className="row-rank">
                      <span>#{rank}</span>
                    </div>
                    <div className="row-faction">
                      <div className="row-pfp-container">
                        <img src={defaultPfp} className="row-pfp-image" />
                      </div>
                      <span className="faction-row-name">
                        {displayName}
                        <div className="copy-button-wrapper">
                          <CopyButton textToCopy={addr} />
                        </div>
                      </span>
                      <div className="user-self-tag">
                        {isCurrent && orders.length > 0 && (
                          <div className="orders-indicator-container">
                            <div
                              className="orders-indicator"
                              title={`You have ${orders.length} open orders earning points`}
                            />
                          </div>
                        )}
                        {isCurrent && (
                          <span className="current-user-tag">You</span>
                        )}
                      </div>
                    </div>
                    <div className="row-xp">
                      <div className="leaderboard-xp-amount">
                        <NumberRoller 
                          value={total < 0.01 ? 0 : total}
                          decimals={2}
                          duration={800}
                          suffix={<img src={crystalxp} className="xp-icon" />}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>

        <div className="pagination-controls">
          <button
            className="go-to-user-position-button"
            onClick={goToUserPosition}
            disabled={!overview || loading}
          >
            {t('viewYourPosition')}
          </button>

          <div className="page-navigation">
            <button
              className="pagination-arrow prev-arrow"
              onClick={goToPreviousPage}
              disabled={currentPage === 0 || loading || paginationLoading}
            >
              <img src={arrow} className="leaderboard-control-left-arrow" />
            </button>

            <div className="page-indicator">
              {t('page')} {currentPage + 1} {t('of')} {totalPages}
            </div>

            <button
              className="pagination-arrow next-arrow"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1 || loading || paginationLoading}
            >
              <img src={arrow} className="leaderboard-control-right-arrow" />
            </button>
          </div>
        </div>
    </div>
  );
};

export default Leaderboard;