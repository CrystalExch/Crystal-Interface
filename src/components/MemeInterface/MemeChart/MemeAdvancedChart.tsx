import React, { useEffect, useRef, useState } from 'react';
import { LocalStorageSaveLoadAdapter } from './LocalStorageSaveLoadAdapter';
import { memeOverrides } from './memeOverrides';

interface MemeAdvancedChartProps {
  data: any;
  token: any;
  selectedInterval: string;
  setSelectedInterval: (interval: string) => void;
  setOverlayVisible: (visible: boolean) => void;
  realtimeCallbackRef: any;
}

const MemeAdvancedChart: React.FC<MemeAdvancedChartProps> = ({
  data,
  token,
  selectedInterval,
  setSelectedInterval,
  setOverlayVisible,
  realtimeCallbackRef,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);
  const dataRef = useRef<any>({});
  const tokenRef = useRef(token);
  const widgetRef = useRef<any>();
  const localAdapterRef = useRef<LocalStorageSaveLoadAdapter>();

  useEffect(() => {
    if (data && data[0] && data[1]) {
      dataRef.current[data[1]] = data[0];
    }
  }, [data]);

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
              supports_marks: false,
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
              exchange: 'meme.exchange',
              minmov: 1,
              pricescale: 100000000, // 8 decimal places for meme tokens
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

        subscribeBars: (
          symbolInfo: any,
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

export default MemeAdvancedChart;