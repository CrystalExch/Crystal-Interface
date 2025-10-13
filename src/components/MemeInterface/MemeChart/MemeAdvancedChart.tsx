import React, { useEffect, useRef, useState } from 'react';

import { LocalStorageSaveLoadAdapter } from './LocalStorageSaveLoadAdapter';
import { memeOverrides } from './memeOverrides';

interface MemeAdvancedChartProps {
  data: any;
  token: any;
  selectedInterval: string;
  setSelectedInterval: any;
  setOverlayVisible: (visible: boolean) => void;
  tradehistory: any[];
  isMarksVisible?: boolean;
  realtimeCallbackRef: any;
  monUsdPrice?: number;
  address: any;
  devAddress: any;
  trackedAddresses: string[];
}

const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const toSub = (n: number) =>
  String(n)
    .split('')
    .map((d) => SUB[+d])
    .join('');

function formatMemePrice(price: number): string {
  if (!isFinite(price)) return '';
  if (Math.abs(price) < 1e-18) return '0';

  const neg = price < 0 ? '-' : '';
  const abs = Math.abs(price);

  if (abs >= 1_000_000_000)
    return neg + (abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (abs >= 1_000_000)
    return neg + (abs / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1_000)
    return neg + (abs / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';

  if (abs >= 100) return neg + abs.toFixed(0).replace(/\.00$/, '');
  if (abs >= 10) return neg + abs.toFixed(1).replace(/\.00$/, '');
  if (abs >= 1) return neg + abs.toFixed(2).replace(/\.00$/, '');
  if (abs >= 1e-1) return neg + abs.toFixed(3).replace(/\.00$/, '');
  if (abs >= 1e-2) return neg + abs.toFixed(4).replace(/\.00$/, '');
  if (abs >= 1e-3) return neg + abs.toFixed(5).replace(/\.00$/, '');
  if (abs >= 1e-4) return neg + abs.toFixed(6).replace(/\.00$/, '');

  const exp = Math.floor(Math.log10(abs));
  let zeros = -exp - 1;
  if (zeros < 0) zeros = 0;

  const tailDigits = 2;
  const factor = Math.pow(10, tailDigits);
  let scaled = abs * Math.pow(10, zeros + 1);
  let t = Math.round(scaled * factor);

  if (t >= Math.pow(10, 1 + tailDigits)) {
    zeros = Math.max(0, zeros - 1);
    scaled = abs * Math.pow(10, zeros + 1);
    t = Math.round(scaled * factor);
  }

  const s = t.toString().padStart(1 + tailDigits, '0');
  const tail2 = s.slice(0, 3);

  return `${neg}0.0${toSub(zeros)}${tail2}`;
}

const RES_SECONDS: Record<string, number> = {
  '1s': 1, '5s': 5, '15s': 15,
  '1m': 60, '5m': 300, '15m': 900,
  '1h': 3600, '4h': 14400, '1d': 86400
};

function toSec(x: number) {
  return x >= 10_000_000_000 ? Math.floor(x / 1000) : x;
}

const MemeAdvancedChart: React.FC<MemeAdvancedChartProps> = ({
  data,
  token,
  selectedInterval,
  setSelectedInterval,
  setOverlayVisible,
  tradehistory,
  isMarksVisible = true,
  realtimeCallbackRef,
  monUsdPrice = 0,
  address,
  devAddress,
  trackedAddresses,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);

  const dataRef = useRef<any>({});
  const tokenRef = useRef(token);
  const tradeHistoryRef = useRef<any[]>(tradehistory ?? []);
  const addressRef = useRef<any>(address);
  const devAddressRef = useRef<any>(devAddress);
  const trackedAddressesRef = useRef<string[]>(Array.isArray(trackedAddresses) ? trackedAddresses : []);
  const selectedIntervalRef = useRef<string>(selectedInterval);

  const [marksVersion, setMarksVersion] = useState<number>(0);
  const marksVersionRef = useRef<number>(0);

  const widgetRef = useRef<any>();
  const localAdapterRef = useRef<LocalStorageSaveLoadAdapter>();
  const subsRef = useRef<Record<string, string>>({});
  const onResetCacheNeededRef = useRef<(() => void) | null>(null);

  const [showMarketCap, setShowMarketCap] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('meme_chart_showMarketCap');
      return raw ? JSON.parse(raw) === true : false;
    } catch {
      return false;
    }
  });

  const [showUSD, setShowUSD] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('meme_chart_showUSD');
      return raw ? JSON.parse(raw) === true : false;
    } catch {
      return false;
    }
  });

  const basePair = () => `${token.symbol}/${showUSD ? 'USD' : 'MON'}`;
  const tvSymbol = () => `${basePair()}|m${marksVersionRef.current}`;

  const toResKey = (sym: string, res: string) => sym + 'MON' + res;

  function enforceOpenEqualsPrevClose(bars: any[] = []) {
    if (!Array.isArray(bars) || bars.length === 0) return bars;
    const out = [...bars].sort((a, b) => a.time - b.time);
    let prevClose: number | undefined = undefined;

    for (let i = 0; i < out.length; i++) {
      const b = { ...out[i] };
      if (prevClose !== undefined) {
        b.open = prevClose;
        if (b.high < b.open) b.high = b.open;
        if (b.low > b.open) b.low = b.open;
      }
      prevClose = b.close;
      out[i] = b;
    }
    return out;
  }

  useEffect(() => { tradeHistoryRef.current = tradehistory ?? []; }, [tradehistory]);
  useEffect(() => { addressRef.current = address; }, [address]);
  useEffect(() => { devAddressRef.current = devAddress; }, [devAddress]);
  useEffect(() => { trackedAddressesRef.current = Array.isArray(trackedAddresses) ? trackedAddresses : []; }, [trackedAddresses]);
  useEffect(() => { selectedIntervalRef.current = selectedInterval; }, [selectedInterval]);
  useEffect(() => { marksVersionRef.current = marksVersion; }, [marksVersion]);

  useEffect(() => {
    setMarksVersion((v) => v + 1);
  }, [JSON.stringify(trackedAddresses ?? [])]);

  useEffect(() => {
    if (!widgetRef.current?.activeChart) return;
    try {
      const chart = widgetRef.current.activeChart();
      const res = chart.resolution();
      chart.setSymbol(tvSymbol(), res, () => { });
    } catch { }
  }, [marksVersion]);

  useEffect(() => {
    onResetCacheNeededRef.current?.();
  }, [selectedInterval, address, devAddress, tradehistory]);

  useEffect(() => {
    if (data && data[0] && data[1]) {
      const [bars, resRaw] = data as [any[], string];
      const res =
        typeof resRaw === 'string'
          ? resRaw.endsWith('s')
            ? resRaw.slice(0, -1).toUpperCase() + 'S'
            : resRaw.toUpperCase()
          : String(resRaw);
      const key = toResKey(token.symbol, res);
      dataRef.current[key] = enforceOpenEqualsPrevClose(bars);
    }
  }, [data, token.symbol]);

  useEffect(() => {
    localAdapterRef.current = new LocalStorageSaveLoadAdapter();
    widgetRef.current = new (window as any).TradingView.widget({
      container: chartRef.current,
      library_path: '/charting_library/',
      autosize: true,
      symbol: tvSymbol(),
      interval:
        selectedInterval === '1d'
          ? '1D'
          : selectedInterval === '4h'
            ? '240'
            : selectedInterval === '1h'
              ? '60'
              : selectedInterval.endsWith('s')
                ? selectedInterval.slice(0, -1).toUpperCase() + 'S'
                : selectedInterval.slice(0, -1),
      timezone: 'Etc/UTC',
      locale: 'en',
      debug: false,
      theme: 'dark',
      supported_resolutions: [
        '1S',
        '5S',
        '15S',
        '1',
        '5',
        '15',
        '60',
        '240',
        '1D',
      ],
      enabled_features: ['seconds_resolution'],
      auto_save_delay: 0.1,
      disabled_features: [
        'header_symbol_search',
        'symbol_search_hot_key',
        'header_compare',
        'header_undo_redo',
        'header_settings',
        'header_screenshot',
        'header_saveload',
        'edit_buttons_in_legend',
        'use_localstorage_for_settings',
        'symbol_info',
      ],
      custom_formatters: {
        priceFormatterFactory: (_symbolInfo: any, _minTick: number) => {
          return {
            format: (price: number) => {
              let adjusted = showMarketCap ? price * 1_000_000_000 : price;
              if (showUSD && monUsdPrice > 0) {
                adjusted = adjusted * monUsdPrice;
              }
              return formatMemePrice(adjusted);
            },
          };
        },
      },

      custom_css_url: '/AdvancedTradingChart.css',
      custom_font_family: 'Funnel Display',
      loading_screen: {
        backgroundColor: 'rgb(6,6,6)',
        foregroundColor: 'rgb(209, 209, 250)',
      },
      favorites: {
        intervals: ['1S', '5S', '15S', '1', '5', '15', '60', '240', '1D'],
      },
      overrides: memeOverrides,
      studies: ['Volume@tv-basicstudies'],
      studies_overrides: {
        'volume.volume.color.0': 'rgba(239, 81, 81, 0.4)',
        'volume.volume.color.1': 'rgba(131, 251, 145, 0.4)',
        'volume.volume.transparency': 10,
      },
      save_load_adapter: localAdapterRef.current,

      datafeed: {
        onReady: (callback: Function) => {
          setTimeout(() => {
            callback({
              supported_resolutions: [
                '1S',
                '5S',
                '15S',
                '1',
                '5',
                '15',
                '60',
                '240',
                '1D',
              ],
              exchanges: [
                {
                  value: 'crystal.exchange',
                  name: 'Crystal Exchange',
                  desc: 'Crystal Exchange',
                },
              ],
              supports_marks: true,
            });
          }, 0);
        },

        resolveSymbol: (symbolName: string, onResolve: Function) => {
          const [pure] = String(symbolName).split('|');
          setTimeout(() => {
            onResolve({
              name: pure,
              full_name: pure,
              description: pure,
              type: 'crypto',
              session: '24x7',
              timezone: 'Etc/UTC',
              exchange: 'crystal.exchange',
              minmov: 1,
              pricescale:
                10 ** Math.max(0, 5 - Math.floor(Math.log10(0.000001)) - 1),
              has_intraday: true,
              has_seconds: true,
              seconds_multipliers: ['1', '5', '15'],
              has_volume: true,
              supported_resolutions: [
                '1S',
                '5S',
                '15S',
                '1',
                '5',
                '15',
                '60',
                '240',
                '1D',
              ],
              data_status: 'streaming',
            });
          }, 0);
        },

        getBars: async (
          _symbolInfo: any,
          resolution: string,
          periodParams: any,
          onHistoryCallback: Function,
          onErrorCallback: Function,
        ) => {
          const { from, to } = periodParams || {};

          try {
            setSelectedInterval(
              resolution.endsWith('S')
                ? `${resolution.slice(0, -1)}s`
                : resolution === '1D'
                  ? '1d'
                  : resolution === '240'
                    ? '4h'
                    : resolution === '60'
                      ? '1h'
                      : resolution + 'm',
            );

            const key = toResKey(token.symbol, resolution);

            await new Promise<void>((resolve) => {
              const check = () => {
                if (dataRef.current[key]) {
                  clearInterval(intervalCheck);
                  resolve();
                }
              };

              const intervalCheck = setInterval(check, 50);
              check();
            });
            let bars = enforceOpenEqualsPrevClose(dataRef.current[key]) || [];
            const nextTime =
              bars
                .map((bar: any) => bar.time / 1000)
                .filter((t) => t < from)
                .pop() || null;
            bars = bars.filter(
              (bar: any) => bar.time >= from * 1000 && bar.time <= to * 1000,
            );
            setTimeout(() => {
              if (bars && bars.length) {
                onHistoryCallback(bars, { nextTime, noData: false });
              } else {
                onHistoryCallback([], { nextTime, noData: false });
              }
            }, 0);
          } catch (error) {
            console.error('Error fetching meme chart bars:', error);
            onErrorCallback(error);
          }
        },

        getMarks: async (
          _symbolInfo: any,
          from: number,
          to: number,
          onDataCallback: (marks: any[]) => void,
        ) => {
          try {
            const you = String(addressRef.current || '').toLowerCase();
            const dev = String(devAddressRef.current || '').toLowerCase();

            const tracked = Array.isArray(trackedAddressesRef.current)
              ? trackedAddressesRef.current.map(a => String(a || '').toLowerCase()).filter(Boolean)
              : [];

            const includeCaller = (raw: string | undefined) => {
              const c = String(raw || '').toLowerCase();
              if (!c) return false;
              if (tracked.length === 0) return c === you || c === dev;
              return tracked.includes(c);
            };

            const labelFor = (caller: string, isBuy: boolean) => {
              const c = caller.toLowerCase();
              if (c === dev) return isBuy ? 'DB' : 'DS';
              if (c === you) return isBuy ? 'B' : 'S';
              return isBuy ? 'B' : 'S';
            };

            const rows = (tradeHistoryRef.current ?? [])
              .map((t: any) => ({
                ...t,
                __tsSec: toSec(Number(t.timestamp ?? t.blockTimestamp ?? t.time ?? 0)),
                __caller: String(t.caller ?? t.account?.id ?? '')
              }))
              .filter(t => t.__tsSec >= from && t.__tsSec <= to)
              .filter(t => includeCaller(t.__caller));

            const step = RES_SECONDS[selectedIntervalRef.current] ?? 60;
            const bucket = (sec: number) => Math.floor(sec / step) * step;

            type Agg = {
              buys: number;
              sells: number;
              last?: any;
            };
            const byBucket = new Map<number, Agg>();

            for (const tr of rows) {
              const k = bucket(tr.__tsSec);
              const isBuy = !!tr.isBuy;
              const rec = byBucket.get(k) ?? { buys: 0, sells: 0 };
              if (isBuy) rec.buys++; else rec.sells++;
              if (!rec.last || tr.__tsSec >= rec.last.__tsSec) rec.last = tr;
              byBucket.set(k, rec);
            }

            const marks = Array.from(byBucket.entries()).map(([tSec, rec]) => {
              const src = rec.last!;
              const isBuy = !!src.isBuy;
              const caller = src.__caller;
              const label = labelFor(caller, isBuy);
              const summary = `${rec.buys} buy${rec.buys !== 1 ? 's' : ''}, ${rec.sells} sell${rec.sells !== 1 ? 's' : ''}`;
              const amt = Number(src.tokenAmount ?? 0);

              return {
                id: `${tSec}-${label}-${rec.buys}-${rec.sells}`,
                time: tSec,
                color: isBuy
                  ? { background: 'rgb(131, 251, 155)', border: '' }
                  : { background: 'rgb(210, 82, 82)', border: '' },
                label,
                labelFontColor: 'black',
                minSize: 17,
                text: `${summary} • ${label} • ${amt} ${token.symbol}`
              };
            }).sort((a, b) => a.time - b.time);

            onDataCallback(marks);
          } catch (e) {
            console.error('getMarks error', e);
            onDataCallback([]);
          }
        },

        subscribeBars: (
          _symbolInfo: any,
          resolution: string,
          onRealtimeCallback: (bar: any) => void,
          subscriberUID: string,
          onResetCacheNeeded: () => void,
        ) => {
          const key = `${token.symbol}MON${resolution}`;
          realtimeCallbackRef.current[key] = onRealtimeCallback;
          subsRef.current[subscriberUID] = key;
          onResetCacheNeededRef.current = onResetCacheNeeded;
        },

        unsubscribeBars: (subscriberUID: string) => {
          const key = subsRef.current[subscriberUID];
          if (key) delete realtimeCallbackRef.current[key];
          delete subsRef.current[subscriberUID];
        },
      },
    });

    widgetRef.current.onChartReady(() => {
      setChartReady(true);
      widgetRef.current.headerReady().then(() => {
        if (!widgetRef.current.activeChart()) {
          console.warn('Chart not ready yet');
          return;
        }

        const monBtn = widgetRef.current.createButton();
        monBtn.setAttribute('title', 'Switch Currencies');
        monBtn.innerHTML = showUSD
          ? `<span style="color:rgb(209,209,250)">USD</span> / <span>MON</span>`
          : `<span>USD</span> / <span style="color:rgb(209,209,250)">MON</span>`;
        monBtn.addEventListener('click', () => {
          setOverlayVisible(true);
          try {
            setShowUSD((prev) => {
              const next = !prev;
              localStorage.setItem('meme_chart_showUSD', JSON.stringify(next));
              widgetRef.current
                .activeChart()
                .setSymbol(
                  `${token.symbol}/${next ? 'USD' : 'MON'}|m${marksVersionRef.current}`,
                  widgetRef.current.activeChart().resolution(),
                  () => setOverlayVisible(false),
                );
              return next;
            });
          } catch (error) {
            setOverlayVisible(false);
            console.error('Error toggling currency:', error);
          }
        });

        const priceBtn = widgetRef.current.createButton();
        priceBtn.setAttribute('title', 'Toggle Market Cap');
        priceBtn.innerHTML = showMarketCap
          ? `<span style="color:rgb(209,209,250)">Market Cap</span> / <span>Price</span>`
          : `<span>Market Cap</span> / <span style="color:rgb(209,209,250)">Price</span>`;
        priceBtn.addEventListener('click', () => {
          setOverlayVisible(true);
          try {
            setShowMarketCap((prev) => {
              const next = !prev;
              localStorage.setItem('meme_chart_showMarketCap', JSON.stringify(next));
              const currentResolution = widgetRef.current.activeChart().resolution();
              setTimeout(() => {
                widgetRef.current
                  .activeChart()
                  .setSymbol(tvSymbol(), currentResolution, () =>
                    setOverlayVisible(false),
                  );
              }, 10);
              return next;
            });
          } catch (error) {
            setOverlayVisible(false);
            console.error('Error toggling MarketCap:', error);
          }
        });
      });
      const chartId = `meme_layout_${token.symbol}`;

      localAdapterRef.current
        ?.getChartContent(chartId)
        .then((content) => {
          if (content) {
            let layout =
              typeof content === 'string' ? JSON.parse(content) : content;
            if (layout) {
              widgetRef.current.load(layout);
            }
          }
        })
        .catch((err: string) => {
          console.error('Error loading meme chart layout:', err);
        });

      widgetRef.current.subscribe('onAutoSaveNeeded', () => {
        widgetRef.current.save((layout: any) => {
          if (layout.charts && Array.isArray(layout.charts)) {
            layout.charts.forEach((chart: any) => {
              if (chart.timeScale) {
                chart.timeScale.m_barSpacing = 6;
              } else {
                chart.timeScale = { m_barSpacing: 6 };
              }
            });
          }
          layout.overrides = {
            ...memeOverrides,
            ...(layout.overrides || {}),
          };

          const chartData = {
            symbol: `${token.symbol}/MON`,
            name: `chart for ${token.symbol}/MON`,
            content: JSON.stringify(layout),
            id: undefined,
            resolution: selectedInterval,
            timestamp: Math.round(Date.now() / 1000),
          };

          localAdapterRef.current?.saveChart(chartData);
        });
      });
      setOverlayVisible(false);
    });

    return () => {
      setChartReady(false);
      if (widgetRef.current) {
        widgetRef.current.remove();
      }
    };
  }, [token.symbol]);

  useEffect(() => {
    try {
      tokenRef.current = token;
      if (chartReady && widgetRef.current) {
        setOverlayVisible(true);
        localStorage.setItem('meme_chart_timeframe', selectedInterval);

        widgetRef.current.setSymbol(
          tvSymbol(),
          selectedInterval === '1d'
            ? '1D'
            : selectedInterval === '4h'
              ? '240'
              : selectedInterval === '1h'
                ? '60'
                : selectedInterval.endsWith('s')
                  ? selectedInterval.slice(0, -1).toUpperCase() + 'S'
                  : selectedInterval.slice(0, -1),
          () => {
            setOverlayVisible(false);
          },
        );
      }
    } catch (e) {
      setOverlayVisible(false);
    }
  }, [token.symbol, selectedInterval, marksVersion, showUSD]);

  return (
    <div className="advanced-chart-container">
      <div ref={chartRef} />
    </div>
  );
};

export default MemeAdvancedChart;