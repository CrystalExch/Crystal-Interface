import React, { useEffect, useRef, useState } from 'react';
import { LocalStorageSaveLoadAdapter } from './LocalStorageSaveLoadAdapter';
import { memeOverrides } from './memeOverrides';

interface MemeAdvancedChartProps {
  data: any;
  token: any;
  selectedInterval: string;
  setSelectedInterval: (interval: string) => void;
  setOverlayVisible: (visible: boolean) => void;
  tradehistory?: any[]; // Array of user trades
  isMarksVisible?: boolean; // Toggle for showing/hiding marks
  realtimeCallbackRef: any;
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

  useEffect(() => {
    if (data && data[0] && data[1]) {
      dataRef.current[data[1]] = data[0];
    }
  }, [data]);

  // Handle trade history changes and marks visibility
  useEffect(() => {
    try {
      const diff = tradehistory.slice((tradeHistoryRef.current || []).length);
      const becameVisible = !isMarksVisibleRef.current && isMarksVisible;
      isMarksVisibleRef.current = isMarksVisible;
      tradeHistoryRef.current = [...tradehistory];

      if (tradehistory.length > 0 && becameVisible) {
        // Show all marks when toggled on
        if (chartReady && typeof marksRef.current === 'function' && widgetRef.current?.activeChart()?.symbol()) {
          const marks = tradehistory.map((trade: any) => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            time: trade.timestamp || trade[6], // Support both formats
            hoveredBorderWidth: 0,
            borderWidth: 0,
            color: (trade.isBuy || trade[2] == 1) 
              ? {background: 'rgb(131, 251, 155)', border: ''} 
              : {background: 'rgb(210, 82, 82)', border: ''},
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
        // Add new marks for new trades
        if (chartReady && typeof marksRef.current === 'function' && widgetRef.current?.activeChart()?.symbol()) {
          const marks = diff.map((trade: any) => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            time: trade.timestamp || trade[6],
            hoveredBorderWidth: 0,
            borderWidth: 0,
            color: (trade.isBuy || trade[2] == 1) 
              ? {background: 'rgb(131, 251, 155)', border: ''} 
              : {background: 'rgb(210, 82, 82)', border: ''},
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
        // Clear marks when hidden
        if (chartReady) {
          widgetRef.current?.activeChart()?.clearMarks();
        }
      }
    } catch(e) {
      console.error('Error updating trade marks:', e);
    }
  }, [tradehistory.length, isMarksVisible, token.symbol]);

  useEffect(() => {
    localAdapterRef.current = new LocalStorageSaveLoadAdapter();

    widgetRef.current = new (window as any).TradingView.widget({
      container: chartRef.current,
      library_path: '/charting_library/',
      autosize: true,
      symbol: `${token.symbol}/MON`,
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
              supports_marks: true, // Enable marks support
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
              pricescale: 100000000, 
              has_intraday: true,
              has_volume: true,
              supported_resolutions: ['1', '5', '15', '60', '240', '1D'],
              data_status: 'streaming',
            });
          }, 0);
        },

        getBars: async (
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

            let bars = dataRef.current[key] || [];

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
                ? {background: 'rgb(131, 251, 155)', border: ''} 
                : {background: 'rgb(210, 82, 82)', border: ''},
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
          resolution: any,
          onRealtimeCallback: any,
        ) => {
          const key = token.symbol + 'MON' + resolution;
          realtimeCallbackRef.current[key] = onRealtimeCallback;
        },

        unsubscribeBars: () => { },
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
      dataRef.current = {};
      if (widgetRef.current) {
        widgetRef.current.remove();
      }
    };
  }, [token.symbol]);

  useEffect(() => {
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
        `${token.symbol}/MON`,
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
  }, [token.symbol, selectedInterval]);

  return (
    <div className="advanced-chart-container">
      <div ref={chartRef} />
    </div>
  );
};

// Helper function for formatting display values
function formatDisplay(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M';
  } else if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(2) + 'K';
  }
  return value.toFixed(3);
}

export default MemeAdvancedChart;