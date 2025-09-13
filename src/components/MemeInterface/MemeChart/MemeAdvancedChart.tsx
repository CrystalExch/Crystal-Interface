import React, { useEffect, useRef, useState } from 'react';
import { LocalStorageSaveLoadAdapter } from './LocalStorageSaveLoadAdapter';
import { memeOverrides } from './memeOverrides';

interface MemeAdvancedChartProps {
  data: any;
  token: any;
  selectedInterval: string;
  setSelectedInterval: (interval: string) => void;
  setOverlayVisible: (visible: boolean) => void;
  tradehistory?: any[];
  isMarksVisible?: boolean;
  realtimeCallbackRef: any;
  monUsdPrice?: number;
}
const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const toSub = (n: number) => String(n).split('').map(d => SUB[+d]).join('');

function formatMemePrice(price: number): string {
  if (!isFinite(price)) return '';
  if (Math.abs(price) < 1e-18) return '0';

  const neg = price < 0 ? '-' : '';
  const abs = Math.abs(price);

  // Compact K/M/B
  if (abs >= 1_000_000_000) return neg + (abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  if (abs >= 1_000_000)     return neg + (abs / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1_000)         return neg + (abs / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';

  if (abs >= 1e-3) return neg + abs.toFixed(2).replace(/\.00$/, '');

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
  const tail2 = s.slice(0, 2);                          

  return `${neg}0.0${toSub(zeros)}${tail2}`;
}

const MemeAdvancedChart: React.FC<MemeAdvancedChartProps> = ({
  data,
  token,
  selectedInterval,
  setSelectedInterval,
  setOverlayVisible,
  tradehistory = [],
  isMarksVisible = true,
  realtimeCallbackRef,
  monUsdPrice = 0,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);
  const dataRef = useRef<any>({});
  const tokenRef = useRef(token);
  const tradeHistoryRef = useRef(tradehistory);
  const marksRef = useRef<any>();
  const isMarksVisibleRef = useRef<boolean>(isMarksVisible);
  const widgetRef = useRef<any>();
  const localAdapterRef = useRef<LocalStorageSaveLoadAdapter>();
  const subsRef = useRef<Record<string, string>>({});
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
  const toResKey = (sym: string, res: string) => sym + 'MON' + (res === '1D' ? '1D' : res);

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

  useEffect(() => {
    if (data && data[0] && data[1]) {
      dataRef.current[data[1]] = enforceOpenEqualsPrevClose(data[0]);
    }
  }, [data]);
  useEffect(() => {
    try {
      localStorage.setItem('meme_chart_showMarketCap', JSON.stringify(showMarketCap));
    } catch { }
  }, [showMarketCap]);
  useEffect(() => {
    try {
      localStorage.setItem('meme_chart_showUSD', JSON.stringify(showUSD));
    } catch { }
  }, [showUSD]);
  useEffect(() => {
    try {
      const diff = tradehistory.slice((tradeHistoryRef.current || []).length);
      const becameVisible = !isMarksVisibleRef.current && isMarksVisible;
      isMarksVisibleRef.current = isMarksVisible;
      tradeHistoryRef.current = [...tradehistory];

      if (tradehistory.length > 0 && becameVisible) {
        if (chartReady && typeof marksRef.current === 'function' && widgetRef.current?.activeChart()?.symbol()) {
          const marks = tradehistory.map((trade: any) => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            time: trade.timestamp || trade[6],
            hoveredBorderWidth: 0,
            borderWidth: 0,
            color: (trade.isBuy || trade[2] == 1)
              ? { background: 'rgb(131, 251, 155)', border: '' }
              : { background: 'rgb(210, 82, 82)', border: '' },
            text: `${(trade.isBuy || trade[2] == 1) ? 'Bought' : 'Sold'} ${formatDisplay(trade.amount || trade[0])} ${token.symbol} on ` +
              new Date((trade.timestamp || trade[6]) * 1000).toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hourCycle: 'h23',
              }).replace(/, \d{2}$/, ''),
            label: (trade.isBuy || trade[2] == 1) ? 'B' : 'S',
            labelFontColor: 'black',
            minSize: 17,
          }));
          marksRef.current(marks);
        }
      } else if (tradehistory.length > 0 && isMarksVisible) {
        if (chartReady && typeof marksRef.current === 'function' && widgetRef.current?.activeChart()?.symbol()) {
          const marks = diff.map((trade: any) => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            time: trade.timestamp || trade[6],
            hoveredBorderWidth: 0,
            borderWidth: 0,
            color: (trade.isBuy || trade[2] == 1)
              ? { background: 'rgb(131, 251, 155)', border: '' }
              : { background: 'rgb(210, 82, 82)', border: '' },
            text: `${(trade.isBuy || trade[2] == 1) ? 'Bought' : 'Sold'} ${formatDisplay(trade.amount || trade[0])} ${token.symbol} on ` +
              new Date((trade.timestamp || trade[6]) * 1000).toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hourCycle: 'h23',
              }).replace(/, \d{2}$/, ''),
            label: (trade.isBuy || trade[2] == 1) ? 'B' : 'S',
            labelFontColor: 'black',
            minSize: 17,
          }));
          marksRef.current(marks);
        }
      } else {
        if (chartReady) {
          widgetRef.current?.activeChart()?.clearMarks();
        }
      }
    } catch (e) {
      console.error('Error updating trade marks:', e);
    }
  }, [tradehistory.length, isMarksVisible, token.symbol]);

  useEffect(() => {
    localAdapterRef.current = new LocalStorageSaveLoadAdapter();
    if (data && data[0] && data[1]) {
      dataRef.current[data[1]] = enforceOpenEqualsPrevClose(data[0]);
    }
    widgetRef.current = new (window as any).TradingView.widget({
      container: chartRef.current,
      library_path: '/charting_library/',
      autosize: true,
      symbol: `${token.symbol}/${showUSD ? 'USD' : 'MON'}`,
      interval: localStorage.getItem('meme_chart_timeframe') || '5',
      timezone: 'Etc/UTC',
      locale: 'en',
      debug: false,
      theme: 'dark',
      supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
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
        foregroundColor: '#aaaecf',
      },
      favorites: {
        intervals: ['5', '60', '1D'],
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
              supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
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
          setTimeout(() => {
            onResolve({
              name: symbolName,
              full_name: symbolName,
              description: symbolName,
              type: 'crypto',
              session: '24x7',
              timezone: 'Etc/UTC',
              exchange: 'crystal.exchange',
              minmov: 1,
              pricescale: 10 ** Math.max(0, 5 - Math.floor(Math.log10(0.000001)) - 1),
              has_intraday: true,
              has_volume: true,
              supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
              data_status: 'streaming',
            });
          }, 0);
        },

        getBars: async (
          symbolInfo: any,
          resolution: string,
          periodParams: any,
          onHistoryCallback: Function,
          onErrorCallback: Function,
        ) => {
          const { from, to } = periodParams;

          try {
            setSelectedInterval(
              resolution === '1D'
                ? '1d'
                : resolution === '240'
                  ? '4h'
                  : resolution === '60'
                    ? '1h'
                    : resolution + 'm',
            );

            const key = token.symbol + 'MON' + resolution;

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
            bars = bars.filter(
              (bar: any) => bar.time >= from * 1000 && bar.time <= to * 1000,
            );

            setTimeout(() => {
              if (bars && bars.length) {
                onHistoryCallback(bars, { noData: false });
              } else {
                onHistoryCallback([], { noData: false });
              }
            }, 0);
          } catch (error) {
            console.error('Error fetching meme chart bars:', error);
            onErrorCallback(error);
          }
        },

        getMarks: async (
          symbolInfo: any,
          from: number,
          to: number,
          onDataCallback: (marks: any[]) => void,
        ) => {
          const marks = isMarksVisibleRef.current === false ? [] : tradeHistoryRef.current
            .filter((trade: any) => {
              const tradeTime = trade.timestamp || trade[6];
              return tradeTime >= from && tradeTime <= to;
            })
            .map((trade: any) => ({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              time: trade.timestamp || trade[6],
              hoveredBorderWidth: 0,
              borderWidth: 0,
              color: (trade.isBuy || trade[2] == 1)
                ? { background: 'rgb(131, 251, 155)', border: '' }
                : { background: 'rgb(210, 82, 82)', border: '' },
              text: `${(trade.isBuy || trade[2] == 1) ? 'Bought' : 'Sold'} ${formatDisplay(trade.amount || trade[0])} ${token.symbol} on ` +
                new Date((trade.timestamp || trade[6]) * 1000).toLocaleString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hourCycle: 'h23',
                }).replace(/, \d{2}$/, ''),
              label: (trade.isBuy || trade[2] == 1) ? 'B' : 'S',
              labelFontColor: 'black',
              minSize: 17,
            }));

          marksRef.current = onDataCallback;
          setTimeout(() => {
            onDataCallback(marks);
          }, 0);
        },

        subscribeBars: (
          symbolInfo: any,
          resolution: string,
          onRealtimeCallback: (bar: any) => void,
          subscriberUID: string,
          onResetCacheNeeded?: () => void,
        ) => {
          const key = toResKey(token.symbol, resolution);
          realtimeCallbackRef.current[key] = onRealtimeCallback;
          subsRef.current[subscriberUID] = key;
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
      const chartId = `meme_layout_${token.symbol}`;

      localAdapterRef.current
        ?.getChartContent(chartId)
        .then((content) => {
          if (content) {
            let layout = typeof content === 'string' ? JSON.parse(content) : content;
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
  }, [token.symbol, showMarketCap, showUSD]);

  useEffect(() => {
    try {
      tokenRef.current = token;
      if (chartReady && widgetRef.current) {
        setOverlayVisible(true);
        localStorage.setItem('meme_chart_timeframe', selectedInterval === '1d'
          ? '1D'
          : selectedInterval === '4h'
            ? '240'
            : selectedInterval === '1h'
              ? '60'
              : selectedInterval.slice(0, -1));

           widgetRef.current.setSymbol(
          `${token.symbol}/${showUSD ? 'USD' : 'MON'}`,
          selectedInterval === '1d'
            ? '1D'
            : selectedInterval === '4h'
              ? '240'
              : selectedInterval === '1h'
                ? '60'
                : selectedInterval.slice(0, -1),
          () => {
            setOverlayVisible(false);
          },
        );
      }
    }
    catch (e) {
    }
  }, [token.symbol, selectedInterval]);
  return (
    <div className="advanced-chart-container">
      <div ref={chartRef} />
      <div className="usd-mon-toggle" onClick={() => setShowUSD(v => !v)}>
        <span className={!showUSD ? 'active' : ''}>MON</span>
        <span className="separator">/</span>
        <span className={showUSD ? 'active' : ''}>USD</span>
      </div>
      <div className="price-marketcap-toggle" onClick={() => setShowMarketCap(v => !v)}>
        <span className={!showMarketCap ? 'active' : ''}>Price</span>
        <span className="separator">/</span>
        <span className={showMarketCap ? 'active' : ''}>MarketCap</span>
      </div>
    </div>
  );
};

function formatDisplay(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  } else if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  }
  return value.toFixed(3);
}

export default MemeAdvancedChart;