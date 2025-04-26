import React, { useEffect, useRef, useState } from 'react';
import { LocalStorageSaveLoadAdapter } from './LocalStorageSaveLoadAdapter';

import { overrides } from './overrides';
import customRound from '../../../utils/customRound';
import { formatDisplay } from '../../OrderCenter/utils';
import './AdvancedTradingChart.css';

interface ChartCanvasProps {
  data: any;
  activeMarket: any;
  selectedInterval: any;
  setSelectedInterval: any;
  setOverlayVisible: any;
  tradehistory: any;
  isMarksVisible: boolean;
  orders: any;
  isOrdersVisible: boolean;
}

const AdvancedTradingChart: React.FC<ChartCanvasProps> = ({
  data,
  activeMarket,
  selectedInterval,
  setSelectedInterval,
  setOverlayVisible,
  tradehistory,
  isMarksVisible,
  orders,
  isOrdersVisible,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);
  const dataRef = useRef(data);
  const activeMarketRef = useRef(activeMarket);
  const tradeHistoryRef = useRef(tradehistory);
  const ordersRef = useRef(orders);
  const orderLinesRef = useRef<any>([]);
  const marksRef = useRef<any>();
  const prevTokenRef = useRef(activeMarket.baseAddress);
  const realtimeCallbackRef = useRef<any>({});
  const isMarksVisibleRef = useRef<boolean>(isMarksVisible);
  const isOrdersVisibleRef = useRef<boolean>(isOrdersVisible);
  const widgetRef = useRef<any>();
  const localAdapterRef = useRef<LocalStorageSaveLoadAdapter>();

  useEffect(() => {
    dataRef.current[data[1]] = data[0];
    if (realtimeCallbackRef.current[data[1]] && data[0].length > 0) {
      const latest = data[0].at(-1) as any;
      const latestBar = {
        time: new Date(latest.time as any).getTime(),
        open: latest.open,
        high: latest.high,
        low: latest.low,
        close: latest.close,
        volume: latest.volume,
      };
      realtimeCallbackRef.current[data[1]](latestBar);
    }
  }, [data]);

  useEffect(() => {
    const diff = tradehistory.slice((tradeHistoryRef.current || []).length);
    const becameVisible = !isMarksVisibleRef.current && isMarksVisible;
    isMarksVisibleRef.current = isMarksVisible;
    tradeHistoryRef.current = [...tradehistory];
    if (tradehistory.length > 0 && becameVisible) {
      if (chartReady && typeof marksRef.current === 'function' && widgetRef.current?.activeChart()?.symbol()) {
        const marks = tradehistory.filter(
          (trade: any) => trade[4] == widgetRef.current.activeChart().symbol().split('/')[0] + widgetRef.current.activeChart().symbol().split('/')[1]
        ).map((trade: any) => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          time: trade[6],
          hoveredBorderWidth: 0,
          borderWidth: 0,
          color: trade[2] == 0 ? {background: 'rgb(210, 82, 82)', border: ''} : {background: 'rgb(131, 251, 155)', border: ''},
          text: (trade[2] == 0 ? `${t('sold')} ${formatDisplay(customRound(trade[0] / (10**Number(markets[trade[4]].baseDecimals)), 3))} ` : `${t('bought')} ${formatDisplay(customRound(trade[1] / (10**Number(markets[trade[4]].baseDecimals)), 3))} `) + `${markets[trade[4]].baseAsset} on ` + new Date(trade[6]*1000).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
          .replace(/, \d{2}$/, ''),
          label: trade[2] == 0 ? 'S' : 'B',
          labelFontColor: 'black',
          minSize: 17,
        }));
        marksRef.current(marks);
      }
    }
    else if (tradehistory.length > 0 && isMarksVisible) {
      if (chartReady && typeof marksRef.current === 'function' && widgetRef.current?.activeChart()?.symbol()) {
        const marks = diff.filter(
          (trade: any) => trade[4] == widgetRef.current.activeChart().symbol().split('/')[0] + widgetRef.current.activeChart().symbol().split('/')[1]
        ).map((trade: any) => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          time: trade[6],
          hoveredBorderWidth: 0,
          borderWidth: 0,
          color: trade[2] == 0 ? {background: 'rgb(210, 82, 82)', border: ''} : {background: 'rgb(131, 251, 155)', border: ''},
          text: (trade[2] == 0 ? `${t('sold')} ${formatDisplay(customRound(trade[0] / (10**Number(markets[trade[4]].baseDecimals)), 3))} ` : `${t('bought')} ${formatDisplay(customRound(trade[1] / (10**Number(markets[trade[4]].baseDecimals)), 3))} `) + `${markets[trade[4]].baseAsset} on ` + new Date(trade[6]*1000).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
          .replace(/, \d{2}$/, ''),
          label: trade[2] == 0 ? 'S' : 'B',
          labelFontColor: 'black',
          minSize: 17,
        }));
        marksRef.current(marks);
      }
    }
    else {
      if (chartReady) {
        widgetRef.current?.activeChart()?.clearMarks();
      }
    }
  }, [tradehistory.length, isMarksVisible]);

  useEffect(() => {
    const diff = orders.slice((ordersRef.current || []).length);
    const becameVisible = !isOrdersVisibleRef.current && isOrdersVisible;
    const marketChanged = prevTokenRef.current != activeMarket.baseAddress
    prevTokenRef.current = activeMarket.baseAddress
    isOrdersVisibleRef.current = isOrdersVisible;
    ordersRef.current = [...orders];
    if (orders.length > 0 && (becameVisible || marketChanged)) {
      if (chartReady && widgetRef.current?.activeChart()?.symbol()) {
        const marketKey = widgetRef.current.activeChart().symbol().split('/')[0] + widgetRef.current.activeChart().symbol().split('/')[1]
        orders.forEach((order: any) => {
          if (order[4] != marketKey) return;
          orderLinesRef.current.push(widgetRef.current.activeChart().createOrderLine().setPrice(order[0] / Number(markets[order[4]].priceFactor))
          .setQuantity(order[8])
          .setText(order[3] == 1 ? 'Buy Order' : 'Sell Order')
          .setLineColor(order[3] == 1 ? '#00C176' : '#F23645')
          .setBodyBackgroundColor(order[3] == 1 ? 'rgb(131, 251, 155)' : 'rgb(210, 82, 82)')
          .onMove(() => {
            console.log('Order line moved');
          })
          .onModify(() => {
            console.log('Order line modified');
          })
          .onCancel(() => {
            console.log('Order line cancelled');
          }));
        })
      }
    }
    else if (orders.length > 0 && isOrdersVisible) {
      if (chartReady && widgetRef.current?.activeChart()?.symbol()) {
        const marketKey = widgetRef.current.activeChart().symbol().split('/')[0] + widgetRef.current.activeChart().symbol().split('/')[1]
        diff.forEach((order: any) => {
          if (order[4] != marketKey) return;
          orderLinesRef.current.push(widgetRef.current.activeChart().createOrderLine().setPrice(order[0] / Number(markets[order[4]].priceFactor))
          .setQuantity(order[8])
          .setText(order[3] == 1 ? 'Buy Order' : 'Sell Order')
          .setLineColor(order[3] == 1 ? '#00C176' : '#F23645')
          .setBodyBackgroundColor(order[3] == 1 ? 'rgb(131, 251, 155)' : 'rgb(210, 82, 82)')
          .onMove(() => {
            console.log('Order line moved');
          })
          .onModify(() => {
            console.log('Order line modified');
          })
          .onCancel(() => {
            console.log('Order line cancelled');
          }));
        })
      }
    }
    else {
      if (chartReady) {
        orderLinesRef.current.forEach((orderLine: any) => {
          try {
            orderLine.remove();
          } catch (error) {
            console.error('Failed to remove order line', error);
          }
        });
        orderLinesRef.current = [];
      }
    }
  }, [orders.length, isOrdersVisible, activeMarket.baseAddress]);

  useEffect(() => {
    localAdapterRef.current = new LocalStorageSaveLoadAdapter();

    widgetRef.current = new (window as any).TradingView.widget({
      container: chartRef.current,
      library_path: '/charting_library/',
      autosize: true,
      symbol: `${activeMarket.baseAsset}/${activeMarket.quoteAsset}`,
      interval: '5',
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
        backgroundColor: '#0f0f12',
        foregroundColor: '#aaaecf',
      },
      favorites: {
        intervals: ['5', '60', '1D'],
      },

      overrides: overrides,
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
              pricescale: Number(activeMarketRef.current.priceFactor),
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

            const base = symbolInfo.name.split('/')[0];
            const key = base + resolution;

            await new Promise<void>((resolve) => {
              const intervalCheck = setInterval(() => {
                if (dataRef.current[key]) {
                  clearInterval(intervalCheck);
                  resolve();
                }
              }, 50);
            });

            let bars = dataRef.current[key].map((point: any) => ({
              time: new Date(point.time).getTime(),
              open: point.open,
              high: point.high,
              low: point.low,
              close: point.close,
              volume: point.volume,
            }));

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
            console.error('Error fetching bars:', error);
            onErrorCallback(error);
          }
        },

        getMarks: async (
          symbolInfo: any,
          from: number,
          to: number,
          onDataCallback: (marks: any[]) => void,
        ) => {
          const marks = isMarksVisibleRef.current == false ? [] : tradeHistoryRef.current.filter(
            (trade: any) => trade[6] >= from && trade[6] <= to && (trade[4] == symbolInfo.name.split('/')[0] + symbolInfo.name.split('/')[1])
          ).map((trade: any) => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            time: trade[6],
            hoveredBorderWidth: 0,
            borderWidth: 0,
            color: trade[2] == 0 ? {background: 'rgb(210, 82, 82)', border: ''} : {background: 'rgb(131, 251, 155)', border: ''},
            text: (trade[2] == 0 ? `${t('sold')} ${formatDisplay(customRound(trade[0] / (10**Number(markets[trade[4]].baseDecimals)), 3))} ` : `${t('bought')} ${formatDisplay(customRound(trade[1] / (10**Number(markets[trade[4]].baseDecimals)), 3))} `) + `${markets[trade[4]].baseAsset} on ` + new Date(trade[6]*1000).toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })
            .replace(/, \d{2}$/, ''),
            label: trade[2] == 0 ? 'S' : 'B',
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
          resolution: any,
          onRealtimeCallback: any,
        ) => {
          realtimeCallbackRef.current[
            symbolInfo.name.split('/')[0] + resolution
          ] = onRealtimeCallback;
        },

        unsubscribeBars: () => {},
      },
    });

    widgetRef.current.onChartReady(() => {
      setChartReady(true)
      const marketId = `${activeMarketRef.current.baseAsset}_${activeMarketRef.current.quoteAsset}`;
      const chartId = `layout_${marketId}`;
      localAdapterRef.current
        ?.getChartContent(chartId)
        .then((content) => async () => {
          if (content) {
            let layout =
              typeof content === 'string' ? JSON.parse(content) : content;
            if (layout) {
              await widgetRef.current.load(layout);
            }
          }
        })
        .catch((err: string) => {
          console.error(err);
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
            ...overrides,
            ...(layout.overrides || {}),
          };

          const chartData = {
            symbol: `${activeMarketRef.current.baseAsset}/${activeMarketRef.current.quoteAsset}`,
            name: `chart for ${activeMarketRef.current.baseAsset}/${activeMarketRef.current.quoteAsset}`,
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
      widgetRef.current.remove();
    };
  }, []);

  useEffect(() => {
    activeMarketRef.current = activeMarket;
    if (chartReady) {
      setOverlayVisible(true);
      widgetRef.current.setSymbol(
        `${activeMarketRef.current.baseAsset}/${activeMarketRef.current.quoteAsset}`,
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
  }, [
    activeMarket.quoteAsset,
    activeMarket.baseAsset,
    activeMarket.priceFactor,
    selectedInterval,
  ]);

  return (
    <div className="advanced-chart-container">
      <div ref={chartRef} />
    </div>
  );
};

export default AdvancedTradingChart;
