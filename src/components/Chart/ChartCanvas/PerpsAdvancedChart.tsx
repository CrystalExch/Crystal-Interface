import React, { useEffect, useRef, useState } from 'react';
import { LocalStorageSaveLoadAdapter } from './LocalStorageSaveLoadAdapter';

import cancelOrder from '../../../scripts/cancelOrder';
import replaceOrder from '../../../scripts/replaceOrder';
import { settings } from '../../../settings';
import { formatSig } from '../../OrderCenter/utils';
import customRound from '../../../utils/customRound';
import normalizeTicker from '../../../utils/normalizeTicker';
import { formatDisplay } from '../../OrderCenter/utils';
import { overrides } from './overrides';

import './AdvancedTradingChart.css';
import { formatSubscript } from '../../../utils/numberDisplayFormat';

interface ChartCanvasProps {
  data: any;
  activeMarket: any;
  selectedInterval: any;
  setSelectedInterval: any;
  setOverlayVisible: any;
  tradehistory: any;
  isMarksVisible: boolean;
  setIsMarksVisible: any;
  orders: any;
  isOrdersVisible: boolean;
  showChartOutliers: boolean;
  setShowChartOutliers: any;
  router: any;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  usedRefAddress: any;
  realtimeCallbackRef: any;
  limitPrice?: bigint;
  updateLimitAmount?: any;
  tokenIn?: string;
  amountIn?: bigint;
  isLimitOrderMode?: boolean;
  perps: boolean;
}

const PerpsAdvancedChart: React.FC<ChartCanvasProps> = ({
  data,
  activeMarket,
  selectedInterval,
  setSelectedInterval,
  setOverlayVisible,
  tradehistory,
  isMarksVisible,
  setIsMarksVisible,
  orders,
  isOrdersVisible,
  showChartOutliers,
  setShowChartOutliers,
  router,
  refetch,
  sendUserOperationAsync,
  setChain,
  usedRefAddress,
  realtimeCallbackRef,
  limitPrice = BigInt(0),
  updateLimitAmount,
  tokenIn,
  amountIn = BigInt(0),
  isLimitOrderMode = false,
  perps,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);
  const dataRef = useRef<any>({});
  const activeMarketRef = useRef(activeMarket);
  const tradeHistoryRef = useRef(tradehistory);
  const ordersRef = useRef(orders);
  const marksRef = useRef<any>();
  const isMarksVisibleRef = useRef<boolean>(isMarksVisible);
  const widgetRef = useRef<any>();
  const localAdapterRef = useRef<LocalStorageSaveLoadAdapter>();

  const previewOrderLineRef = useRef<any>(null);

  const updatePreviewOrderLine = () => {
    if (!chartReady || !widgetRef.current?.activeChart()) {
      return;
    }

    if (previewOrderLineRef.current) {
      try {
        previewOrderLineRef.current.remove();
      } catch (e) {}
      previewOrderLineRef.current = null;
    }

    if (!isLimitOrderMode || limitPrice <= BigInt(0) || amountIn <= BigInt(0)) {
      return;
    }

    try {
      const priceInDisplayUnits =
        Number(limitPrice) / Number(activeMarket.priceFactor);
      const isBuyOrder = tokenIn === activeMarket.quoteAddress;

      let quantityDisplay;

      if (tokenIn === activeMarket.baseAddress) {
        quantityDisplay = customRound(
          Number(amountIn) / 10 ** Number(activeMarket.baseDecimals),
          3,
        ).toString();
      } else {
        const baseAmount =
          (amountIn * (activeMarket.scaleFactor || BigInt(1))) / limitPrice;
        quantityDisplay = customRound(
          Number(baseAmount) / 10 ** Number(activeMarket.baseDecimals),
          3,
        ).toString();
      }

      const formattedPrice = formatSubscript(formatSig(priceInDisplayUnits.toFixed(Math.floor(Math.log10(Number(1 / Number(activeMarketRef.current?.tickSize))))), false));

      const orderTypeText = isBuyOrder ? 'Place limit buy' : 'Place limit sell';

      const divider = ' \u2502 ';
      
      const previewLine = widgetRef.current
        .activeChart()
        .createOrderLine()
        .setPrice(priceInDisplayUnits)
        .setText(`${orderTypeText}${divider}${formattedPrice}`)
        .setQuantity(formatSubscript(formatDisplay(
          quantityDisplay,
        )))
        .setQuantityBackgroundColor('#D8DCFF')
        .setQuantityBorderColor('#D8DCFF')
        .setQuantityTextColor('rgb(6,6,6)')
        .setLineColor('rgb(209, 209, 250)')
        .setBodyBackgroundColor('rgba(6,6,6,0.9)')
        .setBodyTextColor('#D8DCFF')
        .setBodyBorderColor('#D8DCFF')
        .setBodyFont('10px Funnel Display')
        .setQuantityFont('bold 10px Funnel Display')
        .setLineStyle(1)
        .setCancellable(false)
        .onMove(() => {
          const newPrice = previewLine.getPrice();
          updateLimitAmount(
            newPrice,
            Number(activeMarket.priceFactor),
            activeMarket?.marketType != 0
              ? 10 ** Math.max(0, 5 - Math.floor(Math.log10(newPrice ?? 1)) - 1)
              : Number(activeMarket.priceFactor),
          );
          const formatted = formatSubscript(formatSig(newPrice.toFixed(Math.floor(Math.log10(Number(1 / Number(activeMarketRef.current?.tickSize))))), false));
          const side =
            tokenIn === activeMarket.quoteAddress
              ? 'Place limit buy'
              : 'Place limit sell';
          previewLine.setText(`${side}${divider}${formatted}`);
        });
      previewOrderLineRef.current = previewLine;
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    try {
      if (chartReady) {
        updatePreviewOrderLine();
      }
    } catch (e) {}
  }, [
    chartReady,
    limitPrice,
    amountIn,
    tokenIn,
    isLimitOrderMode,
    activeMarket,
  ]);

  useEffect(() => {
    if (data[2] != showChartOutliers) {
      return;
    }
    dataRef.current[data[1]] = data[0];
  }, [data, showChartOutliers]);

  useEffect(() => {
    try {
      const diff = tradehistory.slice((tradeHistoryRef.current || []).length);
      const becameVisible = !isMarksVisibleRef.current && isMarksVisible;
      isMarksVisibleRef.current = isMarksVisible;
      tradeHistoryRef.current = [...tradehistory];
      if (tradehistory.length > 0 && becameVisible) {
        if (
          chartReady &&
          typeof marksRef.current === 'function' &&
          widgetRef.current?.activeChart()?.symbol()
        ) {
          const marketKey =
            widgetRef.current.activeChart().symbol().split('/')[0] +
            widgetRef.current.activeChart().symbol().split('/')[1];
          const marks = tradehistory
            .filter(
              (trade: any) =>
                trade[4]?.toLowerCase() == marketKey.toLowerCase(),
            )
            .map((trade: any) => ({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              time: trade[6],
              hoveredBorderWidth: 0,
              borderWidth: 0,
              color:
                trade[2] == 0
                  ? { background: 'rgb(210, 82, 82)', border: '' }
                  : { background: 'rgb(131, 251, 155)', border: '' },
              text:
                (trade[2] == 0
                  ? `${t('sold')} ${formatDisplay(customRound(trade[0] / 10 ** Number(markets[trade[4]].baseDecimals), 3))} `
                  : `${t('bought')} ${formatDisplay(customRound(trade[1] / 10 ** Number(markets[trade[4]].baseDecimals), 3))} `) +
                `${markets[trade[4]].baseAsset} on ` +
                new Date(trade[6] * 1000)
                  .toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hourCycle: 'h23',
                  })
                  .replace(/, \d{2}$/, ''),
              label: trade[2] == 0 ? 'S' : 'B',
              labelFontColor: 'black',
              minSize: 17,
            }));
          marksRef.current(marks);
        }
      } else if (tradehistory.length > 0 && isMarksVisible) {
        if (
          chartReady &&
          typeof marksRef.current === 'function' &&
          widgetRef.current?.activeChart()?.symbol()
        ) {
          const marketKey =
            widgetRef.current.activeChart().symbol().split('/')[0] +
            widgetRef.current.activeChart().symbol().split('/')[1];
          const marks = diff
            .filter(
              (trade: any) =>
                trade[4]?.toLowerCase() == marketKey.toLowerCase(),
            )
            .map((trade: any) => ({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              time: trade[6],
              hoveredBorderWidth: 0,
              borderWidth: 0,
              color:
                trade[2] == 0
                  ? { background: 'rgb(210, 82, 82)', border: '' }
                  : { background: 'rgb(131, 251, 155)', border: '' },
              text:
                (trade[2] == 0
                  ? `${t('sold')} ${formatDisplay(customRound(trade[0] / 10 ** Number(markets[trade[4]].baseDecimals), 3))} `
                  : `${t('bought')} ${formatDisplay(customRound(trade[1] / 10 ** Number(markets[trade[4]].baseDecimals), 3))} `) +
                `${markets[trade[4]].baseAsset} on ` +
                new Date(trade[6] * 1000)
                  .toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hourCycle: 'h23',
                  })
                  .replace(/, \d{2}$/, ''),
              label: trade[2] == 0 ? 'S' : 'B',
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
    } catch (e) {}
  }, [tradehistory.length, isMarksVisible]);

  useEffect(() => {
    try {
      if (chartReady) {
        if (orders.length > 0 && isOrdersVisible) {
          if (widgetRef.current?.activeChart()?.symbol()) {
            const marketKey =
              widgetRef.current.activeChart().symbol().split('/')[0] +
              widgetRef.current.activeChart().symbol().split('/')[1];
            orders.forEach((order: any) => {
              if (
                order[4]?.toLowerCase() != marketKey.toLowerCase() ||
                order?.[10]
              )
                return;
              const orderLine = widgetRef.current
                .activeChart()
                .createOrderLine()
                .setPrice(order[0] / Number(markets[order[4]].priceFactor))
                .setQuantity(
                  formatSubscript(formatDisplay(
                    customRound(
                      (order[2] - order[7]) /
                        10 ** Number(markets[order[4]].baseDecimals),
                      3,
                    ),
                  )),
                )
                .setText(
                  `Limit: ${formatSubscript(formatSig((order[0] / Number(markets[order[4]].priceFactor)).toFixed(Math.floor(Math.log10(Number(markets[order[4]].priceFactor)))), markets[order[4]].marketType != 0))}`,
                )
                .setLineColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
                .setQuantityBackgroundColor(
                  order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                )
                .setQuantityTextColor('rgb(6,6,6)')
                .setCancelButtonIconColor(
                  order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                )
                .setCancelButtonBackgroundColor('rgb(6,6,6)')
                .setBodyBackgroundColor('rgb(6,6,6)')
                .setBodyTextColor(
                  order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                )
                .setBodyBorderColor(
                  order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                )
                .setQuantityBorderColor(
                  order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                )
                .setCancelButtonBorderColor(
                  order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                )
                .setBodyFont('10px Funnel Display')
                .setQuantityFont('bold 10px Funnel Display')
                .setLineStyle(2)
                .onMove(async () => {
                  orderLine.setCancellable(false);
                  orderLine.setText(
                    `Limit: ${formatSubscript(formatSig(orderLine.getPrice().toFixed(Math.floor(Math.log10(Number(markets[order[4]].priceFactor)))), markets[order[4]].marketType != 0))}`,
                  );
                  if (order[3] == 1) {
                    orderLine.setQuantity(
                      formatSubscript(formatDisplay(
                        customRound(
                          ((order[2] - order[7]) * order[0]) /
                            orderLine.getPrice() /
                            Number(markets[order[4]].priceFactor) /
                            10 ** Number(markets[order[4]].baseDecimals),
                          3,
                        ),
                      )),
                    );
                  }
                  try {
                    await setChain();
                    await sendUserOperationAsync({
                      uo: replaceOrder(
                        router,
                        BigInt(0),
                        (order[3] == 1
                          ? markets[order[4]].quoteAsset
                          : markets[order[4]].baseAsset) ==
                          settings.chainConfig[activechain].ethticker
                          ? settings.chainConfig[activechain].weth
                          : order[3] == 1
                            ? markets[order[4]].quoteAddress
                            : markets[order[4]].baseAddress,
                        (order[3] == 1
                          ? markets[order[4]].baseAsset
                          : markets[order[4]].quoteAsset) ==
                          settings.chainConfig[activechain].ethticker
                          ? settings.chainConfig[activechain].weth
                          : order[3] == 1
                            ? markets[order[4]].baseAddress
                            : markets[order[4]].quoteAddress,
                        false,
                        false,
                        BigInt(order[0]),
                        BigInt(order[1]),
                        BigInt(
                          orderLine.getPrice().toPrecision(5) *
                            Number(markets[order[4]].priceFactor),
                        ),
                        BigInt(0),
                        BigInt(Math.floor(Date.now() / 1000) + 900),
                        usedRefAddress,
                      ),
                    });
                    refetch();
                  } catch (error) {
                    orderLine.setCancellable(true);
                    orderLine.setPrice(
                      order[0] / Number(markets[order[4]].priceFactor),
                    );
                    orderLine.setText(
                      `Limit: ${formatSubscript(formatSig((order[0] / Number(markets[order[4]].priceFactor)).toFixed(Math.floor(Math.log10(Number(markets[order[4]].priceFactor)))), markets[order[4]].marketType != 0))}`,
                    );
                    if (order[3] == 1) {
                      orderLine.setQuantity(
                        formatSubscript(formatDisplay(
                          customRound(
                            (order[2] - order[7]) /
                              10 ** Number(markets[order[4]].baseDecimals),
                            3,
                          ),
                        ),
                      ));
                    }
                  }
                })
                .onCancel(async () => {
                  orderLine.setCancellable(false);
                  try {
                    await setChain();
                    await cancelOrder(
                      sendUserOperationAsync,
                      router,
                      order[3] == 1
                        ? markets[order[4]].quoteAddress
                        : markets[order[4]].baseAddress,
                      order[3] == 1
                        ? markets[order[4]].baseAddress
                        : markets[order[4]].quoteAddress,
                      BigInt(order[0]),
                      BigInt(order[1]),
                      BigInt(Math.floor(Date.now() / 1000) + 900),
                    );
                    refetch();
                    try {
                      orderLine.remove();
                    } catch {}
                  } catch (error) {
                    orderLine.setCancellable(true);
                  }
                });
              orderLine.getOrder = () => order;
              order.push(orderLine);
            });
          }
        } else {
          ordersRef.current.forEach((order: any) => {
            try {
              if (order?.[10] && typeof order[10].remove === 'function') {
                try {
                  order[10].remove();
                } catch {}
                order.splice(10, 1);
              }
            } catch (error) {}
          });
        }
        ordersRef.current = [...orders];
      }
    } catch (e) {}
  }, [orders, isOrdersVisible, chartReady]);

  useEffect(() => {
    localAdapterRef.current = new LocalStorageSaveLoadAdapter();
    if (Object.keys(activeMarket).length == 0) return;
    activeMarketRef.current = activeMarket;
    widgetRef.current = new (window as any).TradingView.widget({
      container: chartRef.current,
      library_path: '/charting_library/',
      autosize: true,
      symbol: `${normalizeTicker(activeMarket.baseAsset, activechain)}/${normalizeTicker(activeMarket.quoteAsset, activechain)}`,
      interval: localStorage.getItem('crystal_chart_timeframe') || '5',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: 'en',
      debug: true,
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
        'create_volume_indicator_by_default'
      ],
      custom_css_url: '/AdvancedTradingChart.css',
      custom_font_family: 'Funnel Display',
      loading_screen: {
        backgroundColor: 'rgb(6,6,6)',
        foregroundColor: 'rgb(209, 209, 250)',
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
      custom_formatters: {
        priceFormatterFactory: () => {
          return {
            format: (price: number) => {
              return formatSubscript(formatSig(price.toFixed(Math.floor(Math.log10(Number(1 / Number(activeMarketRef.current?.tickSize))))), false));
            },
          };
        },
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
              pricescale: (t => (t + '').includes('.') ? 10 ** ((t + '').split('.')[1].length) : 1 / t)(activeMarketRef.current?.tickSize || 1),
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

            const key =
              symbolInfo.name.split('/')[0] +
              symbolInfo.name.split('/')[1] +
              resolution;

            await (async () => {
              let offset: string | undefined
              const all: any[] = []

              while (true) {
                const params = new URLSearchParams({
                  contractId: activeMarketRef.current?.contractId,
                  klineType: resolution === '1D'
                    ? 'DAY_1'
                    : resolution === '240'
                      ? 'HOUR_4'
                      : resolution === '60'
                        ? 'HOUR_1'
                        : 'MINUTE_' + resolution,
                  priceType: 'LAST_PRICE',
                  filterBeginKlineTimeInclusive: ((from * 1000) - (resolution === '1D'
                  ? 86400
                  : resolution === '240'
                    ? 14400
                    : resolution === '60'
                      ? 3600
                      : Number(resolution) * 60) * 100000).toString(),
                  filterEndKlineTimeExclusive: (to * 1000).toString(),
                  ...(offset ? { offsetData: offset } : {})
                })

                const r = await fetch(`${settings.perpsEndpoint}/api/v1/public/quote/getKline?${params}`, { headers: { 'Content-Type': 'application/json' } }).then(r => r.json())
                if (!r?.data?.dataList?.length) break

                all.push(...r.data.dataList)
                offset = r.data.nextPageOffsetData
                if (!offset) break
              }

              const mapKlines = (klines: any[]) =>
                klines.map(candle => ({
                  time: Number(candle.klineTime),
                  open: Number(candle.open),
                  high: Number(candle.high),
                  low: Number(candle.low),
                  close: Number(candle.close),
                  volume: Number(candle.value),
                }))

                dataRef.current[key] = mapKlines(all.reverse())
            })()

            let bars = dataRef.current[key];
            const nextTime =
            bars
              .map((bar: any) => bar.time / 1000)
              .filter((t: any) => t < from)
              .pop() || null;

            setTimeout(() => {
              if ((bars && bars.length)) {
                onHistoryCallback(bars, { noData: false });
              } else {
                onHistoryCallback([], { nextTime, noData: true });
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
          const marks =
            isMarksVisibleRef.current == false
              ? []
              : tradeHistoryRef.current
                  .filter(
                    (trade: any) =>
                      trade[6] >= from &&
                      trade[6] <= to &&
                      trade[4] ==
                        symbolInfo.name.split('/')[0] +
                          symbolInfo.name.split('/')[1],
                  )
                  .map((trade: any) => ({
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    time: trade[6],
                    hoveredBorderWidth: 0,
                    borderWidth: 0,
                    color:
                      trade[2] == 0
                        ? { background: 'rgb(210, 82, 82)', border: '' }
                        : { background: 'rgb(131, 251, 155)', border: '' },
                    text:
                      (trade[2] == 0
                        ? `${t('sold')} ${formatDisplay(customRound(trade[0] / 10 ** Number(markets[trade[4]].baseDecimals), 3))} `
                        : `${t('bought')} ${formatDisplay(customRound(trade[1] / 10 ** Number(markets[trade[4]].baseDecimals), 3))} `) +
                      `${markets[trade[4]].baseAsset} on ` +
                      new Date(trade[6] * 1000)
                        .toLocaleString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hourCycle: 'h23',
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
            symbolInfo.name.split('/')[0] +
              symbolInfo.name.split('/')[1] +
              resolution
          ] = onRealtimeCallback;
        },

        unsubscribeBars: () => {},
      },
    });

    widgetRef.current.onChartReady(async () => {
      await widgetRef.current.activeChart().createStudy('Volume', false, false)
      const panes = widgetRef.current.activeChart().getPanes?.();
      if (panes && panes.length >= 2) {
        const h = panes[0]?.getHeight?.()
        if (typeof h === 'number') {
          panes[1]?.setHeight?.(h / 7)
        }
      }
      
      widgetRef.current.headerReady().then(() => {
        if (!widgetRef.current.activeChart() || perps) {
          return;
        }

        const marksBtn = widgetRef.current.createButton();
        marksBtn.setAttribute('title', 'Toggle Marks');
        const updateButtonDisplay = (firstOption: boolean) => {
          marksBtn.innerHTML = firstOption
            ? `<span>Hide Marks</span>`
            : `<span>Show Marks</span>`;
        };

        updateButtonDisplay(isMarksVisibleRef.current);

        marksBtn.addEventListener('click', () => {
          if (isMarksVisibleRef.current) {
            setIsMarksVisible(false);
            localStorage.setItem('crystal_marks_visible', JSON.stringify(false));
            updateButtonDisplay(false);
          } else {
            setIsMarksVisible(true);
            localStorage.setItem('crystal_marks_visible', JSON.stringify(true));
            updateButtonDisplay(true);
          }
        });

        const outlierBtn = widgetRef.current.createButton();
        outlierBtn.setAttribute('title', 'Toggle Outliers');
        const updateButtonDisplay2 = (firstOption: boolean) => {
          outlierBtn.innerHTML = firstOption
            ? `<span>Hide Outliers</span>`
            : `<span>Show Outliers</span>`;
        };

        updateButtonDisplay2(showChartOutliers);

        outlierBtn.addEventListener('click', () => {
          if (showChartOutliers) {
            localStorage.setItem('crystal_show_chart_outliers', JSON.stringify(false));
            updateButtonDisplay2(false);
            setShowChartOutliers(false);
          } else {
            localStorage.setItem('crystal_show_chart_outliers', JSON.stringify(true));
            updateButtonDisplay2(true);
            setShowChartOutliers(true);
          }
        });
      });

      await widgetRef.current.activeChart().dataReady();
      setOverlayVisible(false);
      setChartReady(true);

      const marketId = `${normalizeTicker(activeMarketRef.current.baseAsset, activechain)}_${normalizeTicker(activeMarketRef.current.quoteAsset, activechain)}`;
      const chartId = `layout_${marketId}`;

      localAdapterRef.current?.getChartContent(chartId).then(async (content) => {
        if (content) {
          let layout =
            typeof content === 'string' ? JSON.parse(content) : content;

          if (layout) {
            layout?.charts?.forEach((chart: any) => {
              chart?.panes?.forEach((pane: any) => {
                pane?.sources?.forEach((src: any) => {
                  if (src?.state?.interval) delete src.state.interval;
                });
              });
            });
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
            symbol: `${normalizeTicker(activeMarketRef.current.baseAsset, activechain)}/${normalizeTicker(activeMarketRef.current.quoteAsset, activechain)}`,
            name: `chart for ${normalizeTicker(activeMarketRef.current.baseAsset, activechain)}/${normalizeTicker(activeMarketRef.current.quoteAsset, activechain)}`,
            content: JSON.stringify(layout),
            id: undefined,
            interval: undefined,
            resolution: selectedInterval,
            timestamp: Math.round(Date.now() / 1000),
          };

          localAdapterRef.current?.saveChart(chartData);
        });
      });

      widgetRef.current.activeChart().onIntervalChanged().subscribe(null, (interval: string) => {
        setOverlayVisible(true);
        localStorage.setItem(
          'crystal_chart_timeframe',
          interval,
        );
        const mapped =
          interval.endsWith('S')
            ? `${interval.slice(0, -1)}s`
            : interval === '1D'
              ? '1d'
              : interval === '240'
                ? '4h'
                : interval === '60'
                  ? '1h'
                  : interval + 'm';
        setSelectedInterval(mapped);
      });

      widgetRef.current.activeChart().onDataLoaded().subscribe(null, () => {
        setChartReady(true);
        setOverlayVisible(false);
      });
    });

    return () => {
      try {
        if (previewOrderLineRef.current) {
          try {
            previewOrderLineRef.current.remove();
          } catch (e) {}
          previewOrderLineRef.current = null;
        }

        ordersRef.current.forEach((order: any) => {
          try {
            if (order?.[10] && typeof order[10].remove === 'function') {
              try {
                order[10].remove();
              } catch {}
              order.splice(10, 1);
            }
          } catch (error) {
            console.error('Failed to remove order line', error);
          }
        });
      } catch (e) {}
      setChartReady(false);
      dataRef.current = {};
      widgetRef.current.remove();
    };
  }, [Object.keys(activeMarket).length > 0, showChartOutliers]);

  useEffect(() => {
    try {
      activeMarketRef.current = activeMarket;
      if (chartReady) {
        setOverlayVisible(true);
        widgetRef.current.setSymbol(
          `${normalizeTicker(activeMarket.baseAsset, activechain)}/${normalizeTicker(activeMarket.quoteAsset, activechain)}`,
          selectedInterval === '1d'
            ? '1D'
            : selectedInterval === '4h'
              ? '240'
              : selectedInterval === '1h'
                ? '60'
                : selectedInterval.slice(0, -1),
          () => {
            setOverlayVisible(false);
            updatePreviewOrderLine();

            if (orders.length > 0 && isOrdersVisible) {
              if (widgetRef.current?.activeChart()?.symbol()) {
                const marketKey =
                  widgetRef.current.activeChart().symbol().split('/')[0] +
                  widgetRef.current.activeChart().symbol().split('/')[1];
                orders.forEach((order: any) => {
                  if (
                    order[4]?.toLowerCase() != marketKey.toLowerCase() ||
                    order?.[10]
                  )
                    return;
                  const orderLine = widgetRef.current
                    .activeChart()
                    .createOrderLine()
                    .setPrice(order[0] / Number(markets[order[4]].priceFactor))
                    .setQuantity(
                      formatSubscript(formatDisplay(
                        customRound(
                          (order[2] - order[7]) /
                            10 ** Number(markets[order[4]].baseDecimals),
                          3,
                        ),
                      )),
                    )
                    .setText(
                      `Limit: ${formatSubscript(formatSig((order[0] / Number(markets[order[4]].priceFactor)).toFixed(Math.floor(Math.log10(Number(markets[order[4]].priceFactor)))), markets[order[4]].marketType != 0))}`,
                    )
                    .setLineColor(
                      order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                    )
                    .setQuantityBackgroundColor(
                      order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                    )
                    .setQuantityTextColor('rgb(6,6,6)')
                    .setCancelButtonIconColor(
                      order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                    )
                    .setCancelButtonBackgroundColor('rgb(6,6,6)')
                    .setBodyBackgroundColor('rgb(6,6,6)')
                    .setBodyTextColor(
                      order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                    )
                    .setBodyBorderColor(
                      order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                    )
                    .setQuantityBorderColor(
                      order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                    )
                    .setCancelButtonBorderColor(
                      order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)',
                    )
                    .setBodyFont('10px Funnel Display')
                    .setQuantityFont('bold 10px Funnel Display')
                    .setLineStyle(2)
                    .onMove(async () => {
                      orderLine.setCancellable(false);
                      orderLine.setText(
                        `Limit: ${formatSubscript(formatSig(orderLine.getPrice().toFixed(Math.floor(Math.log10(Number(markets[order[4]].priceFactor)))), markets[order[4]].marketType != 0))}`,
                      );
                      if (order[3] == 1) {
                        orderLine.setQuantity(
                          formatSubscript(formatDisplay(
                            customRound(
                              ((order[2] - order[7]) * order[0]) /
                                orderLine.getPrice() /
                                Number(markets[order[4]].priceFactor) /
                                10 ** Number(markets[order[4]].baseDecimals),
                              3,
                            ),
                          )),
                        );
                      }
                      try {
                        await setChain();
                        await sendUserOperationAsync({
                          uo: replaceOrder(
                            router,
                            BigInt(0),
                            (order[3] == 1
                              ? markets[order[4]].quoteAsset
                              : markets[order[4]].baseAsset) ==
                              settings.chainConfig[activechain].ethticker
                              ? settings.chainConfig[activechain].weth
                              : order[3] == 1
                                ? markets[order[4]].quoteAddress
                                : markets[order[4]].baseAddress,
                            (order[3] == 1
                              ? markets[order[4]].baseAsset
                              : markets[order[4]].quoteAsset) ==
                              settings.chainConfig[activechain].ethticker
                              ? settings.chainConfig[activechain].weth
                              : order[3] == 1
                                ? markets[order[4]].baseAddress
                                : markets[order[4]].quoteAddress,
                            false,
                            false,
                            BigInt(order[0]),
                            BigInt(order[1]),
                            BigInt(
                              orderLine.getPrice().toPrecision(5) *
                                Number(markets[order[4]].priceFactor),
                            ),
                            BigInt(0),
                            BigInt(Math.floor(Date.now() / 1000) + 900),
                            usedRefAddress,
                          ),
                        });
                        refetch();
                      } catch (error) {
                        orderLine.setCancellable(true);
                        orderLine.setPrice(
                          order[0] / Number(markets[order[4]].priceFactor),
                        );
                        orderLine.setText(
                          `Limit: ${formatSubscript(formatSig((order[0] / Number(markets[order[4]].priceFactor)).toFixed(Math.floor(Math.log10(Number(markets[order[4]].priceFactor)))), markets[order[4]].marketType != 0))}`,
                        );
                        if (order[3] == 1) {
                          orderLine.setQuantity(formatSubscript(
                            formatDisplay(
                              customRound(
                                (order[2] - order[7]) /
                                  10 ** Number(markets[order[4]].baseDecimals),
                                3,
                              ),
                            ),
                          ));
                        }
                      }
                    })
                    .onCancel(async () => {
                      orderLine.setCancellable(false);
                      try {
                        await setChain();
                        await cancelOrder(
                          sendUserOperationAsync,
                          router,
                          order[3] == 1
                            ? markets[order[4]].quoteAddress
                            : markets[order[4]].baseAddress,
                          order[3] == 1
                            ? markets[order[4]].baseAddress
                            : markets[order[4]].quoteAddress,
                          BigInt(order[0]),
                          BigInt(order[1]),
                          BigInt(Math.floor(Date.now() / 1000) + 900),
                        );
                        refetch();
                        try {
                          orderLine.remove();
                        } catch {}
                      } catch (error) {
                        orderLine.setCancellable(true);
                      }
                    });
                  orderLine.getOrder = () => order;
                  order.push(orderLine);
                });
              }
            }
          })
      }
    } catch (e) {
      setOverlayVisible(false);
    }
  }, [
    activeMarket.quoteAsset,
    activeMarket.baseAsset,
    activeMarket.priceFactor,
  ]);

  return (
    <div className="advanced-chart-container">
      <div ref={chartRef} />
    </div>
  );
};

export default PerpsAdvancedChart;
