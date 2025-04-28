import React, { useEffect, useRef, useState } from 'react';
import { LocalStorageSaveLoadAdapter } from './LocalStorageSaveLoadAdapter';

import cancelOrder from '../../../scripts/cancelOrder';
import multiBatchOrders from '../../../scripts/multiBatchOrders';
import approve from '../../../scripts/approve';
import { TokenAbi } from '../../../abis/TokenAbi';
import {
  readContracts,
} from '@wagmi/core'
import { settings } from '../../../settings';
import { config } from '../../../wagmi';
import { maxUint256 } from 'viem';
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
  router: any;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  waitForTxReceipt: any;
  address: any;
  client: any;
  newTxPopup: any;
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
  router,
  refetch,
  sendUserOperationAsync,
  setChain,
  waitForTxReceipt,
  address,
  client,
  newTxPopup
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);
  const dataRef = useRef(data);
  const activeMarketRef = useRef(activeMarket);
  const tradeHistoryRef = useRef(tradehistory);
  const ordersRef = useRef(orders);
  const marksRef = useRef<any>();
  const realtimeCallbackRef = useRef<any>({});
  const isMarksVisibleRef = useRef<boolean>(isMarksVisible);
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
    try {
      const diff = tradehistory.slice((tradeHistoryRef.current || []).length);
      const becameVisible = !isMarksVisibleRef.current && isMarksVisible;
      isMarksVisibleRef.current = isMarksVisible;
      tradeHistoryRef.current = [...tradehistory];
      if (tradehistory.length > 0 && becameVisible) {
        if (chartReady && typeof marksRef.current === 'function' && widgetRef.current?.activeChart()?.symbol()) {
          const marketKey = widgetRef.current.activeChart().symbol().split('/')[0] + widgetRef.current.activeChart().symbol().split('/')[1]
          const marks = tradehistory.filter(
            (trade: any) => trade[4]?.toLowerCase() == marketKey.toLowerCase()
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
          const marketKey = widgetRef.current.activeChart().symbol().split('/')[0] + widgetRef.current.activeChart().symbol().split('/')[1]
          const marks = diff.filter(
            (trade: any) => trade[4]?.toLowerCase() == marketKey.toLowerCase()
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
    }
    catch(e) {
      console.log(e)
    }
  }, [tradehistory.length, isMarksVisible]);
  
  useEffect(() => {
    try {
      if (chartReady) {
        if (orders.length > 0 && isOrdersVisible) {
          if (widgetRef.current?.activeChart()?.symbol()) {
            const marketKey = widgetRef.current.activeChart().symbol().split('/')[0] + widgetRef.current.activeChart().symbol().split('/')[1]
            orders.forEach((order: any) => {
              if (order[4]?.toLowerCase() != marketKey.toLowerCase() || order?.[10]) return;
              const orderLine = widgetRef.current.activeChart().createOrderLine().setPrice(order[0] / Number(markets[order[4]].priceFactor))
              .setQuantity(formatDisplay(customRound((order[2]-order[7]) / 10 ** Number(markets[order[4]].baseDecimals), 3)))
              .setText(`Limit: ${(order[0] / Number(markets[order[4]].priceFactor)).toFixed(Math.floor(Math.log10(Number(markets[order[4]].priceFactor))))}`)
              .setLineColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
              .setQuantityBackgroundColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
              .setQuantityTextColor('#0f0f12')
              .setCancelButtonIconColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
              .setCancelButtonBackgroundColor('#0f0f12')
              .setBodyBackgroundColor('#0f0f12')
              .setBodyTextColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
              .setBodyBorderColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
              .setQuantityBorderColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
              .setCancelButtonBorderColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
              .setBodyFont("10px Funnel Display")
              .setQuantityFont("bold 10px Funnel Display")
              .setLineStyle(2)
              .onMove(async () => {
                orderLine.setCancellable(false)
                try {
                  let action: any = [[]];
                  let price: any = [[]];
                  let param1: any = [[]];
                  let param2: any = [[]];
                  if (order[3] == 1) {
                    action[0].push(0)
                    action[0].push(3)
                    action[0].push(1)
                    price[0].push(order[0])
                    price[0].push(BigInt(orderLine.getPrice() * Number(markets[order[4]].priceFactor)))
                    price[0].push(BigInt(orderLine.getPrice() * Number(markets[order[4]].priceFactor)))
                    param1[0].push(BigInt(order[1]))
                    param1[0].push(((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)))
                    param1[0].push(((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)))
                    param2[0].push(address)
                    param2[0].push(address)
                    param2[0].push(address)
                  }
                  else {
                    action[0].push(0)
                    action[0].push(4)
                    action[0].push(2)
                    price[0].push(order[0])
                    price[0].push(BigInt(orderLine.getPrice() * Number(markets[order[4]].priceFactor)))
                    price[0].push(BigInt(orderLine.getPrice() * Number(markets[order[4]].priceFactor)))
                    param1[0].push(BigInt(order[1]))
                    param1[0].push(order[2]-order[7])
                    param1[0].push(order[2]-order[7])
                    param2[0].push(address)
                    param2[0].push(address)
                    param2[0].push(address)
                  }
                  await setChain();
                  let hash;
                  const tokenIn = (order[3] == 1 ? markets[order[4]].quoteAddress : markets[order[4]].baseAddress)
                  const allowance = (await readContracts(config, {
                    contracts: [
                      {
                        abi: TokenAbi,
                        address: (tokenIn == settings.chainConfig[activechain].eth as `0x${string}` ? settings.chainConfig[activechain].weth as `0x${string}` : tokenIn as `0x${string}`),
                        functionName: 'allowance',
                        args: [
                          address as `0x${string}`,
                          markets[order[4]].address,
                        ],
                      },
                    ]
                  }))?.[0]?.result || BigInt(0)
                  if (allowance < (order[3] == 1 ? ((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)) : order[2]-order[7])) {
                    if (client) {
                      let uo = []
                      uo.push(approve(
                        (tokenIn == settings.chainConfig[activechain].eth as `0x${string}` ? settings.chainConfig[activechain].weth as `0x${string}` : tokenIn as `0x${string}`),
                        markets[order[4]].address,
                        maxUint256,
                      ))
                      uo.push(multiBatchOrders(
                        router,
                        BigInt(0),
                        [markets[order[4]].address],
                        action,
                        price,
                        param1,
                        param2,
                      ))
                      hash = await sendUserOperationAsync({ uo: uo })
                      newTxPopup(
                        hash.hash,
                        'approve',
                        (tokenIn == settings.chainConfig[activechain].eth as `0x${string}` ? settings.chainConfig[activechain].weth as `0x${string}` : tokenIn as `0x${string}`),
                        '',
                        customRound(
                          Number((order[3] == 1 ? ((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)) : order[2]-order[7])) /
                          10 ** Number(order[3] == 1 ? markets[order[4]].quoteDecimals : markets[order[4]].baseDecimals),
                          3,
                        ),
                        0,
                        '',
                        activeMarket.address,
                      );
                    }
                    else {
                      hash = await sendUserOperationAsync({
                        uo: approve(
                          (tokenIn == settings.chainConfig[activechain].eth as `0x${string}` ? settings.chainConfig[activechain].weth as `0x${string}` : tokenIn as `0x${string}`),
                          markets[order[4]].address,
                          maxUint256,
                        )
                      })
                      newTxPopup(
                        (client
                          ? hash.hash
                          : await waitForTxReceipt(hash.hash)
                        ),
                        'approve',
                        (tokenIn == settings.chainConfig[activechain].eth as `0x${string}` ? settings.chainConfig[activechain].weth as `0x${string}` : tokenIn as `0x${string}`),
                        '',
                        customRound(
                          Number((order[3] == 1 ? ((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)) : order[2]-order[7])) /
                          10 ** Number(order[3] == 1 ? markets[order[4]].quoteDecimals : markets[order[4]].baseDecimals),
                          3,
                        ),
                        0,
                        '',
                        activeMarket.address,
                      );
                    }
                  }
                  if (!client || !(allowance < (order[3] == 1 ? ((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)) : order[2]-order[7]))) {
                    hash = await sendUserOperationAsync({uo: multiBatchOrders(
                      router,
                      BigInt(0),
                      [markets[order[4]].address],
                      action,
                      price,
                      param1,
                      param2,
                    )})
                  }
                  await waitForTxReceipt(hash.hash);
                  refetch()
                } catch (error) {
                  orderLine.setCancellable(true)
                  orderLine.setPrice(order[0] / Number(markets[order[4]].priceFactor))
                }
              })
              .onCancel(async () => {
                orderLine.setCancellable(false)
                try {
                  await setChain();
                  let hash;
                  hash = await cancelOrder(
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
                  );
                  await waitForTxReceipt(hash.hash);
                  refetch()
                  orderLine.remove()
                } catch (error) {
                  orderLine.setCancellable(true)
                }
              })
              orderLine.getOrder = () => order;
              order.push(orderLine);
            })
          }
        }
        else {
          ordersRef.current.forEach((order: any) => {
            try {
              if (order?.[10] && typeof order[10].remove === 'function') {
                order[10].remove();
                order.splice(10, 1)
              }
            } catch (error) {
              console.error('Failed to remove order line', error);
            }
          });
        }
        ordersRef.current = [...orders];
      }
    }
    catch(e) {
      console.log(e)
    }
  }, [orders, isOrdersVisible, chartReady]);

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
              const check = () => {
                if (dataRef.current[key]) {
                  clearInterval(intervalCheck);
                  resolve();
                }
              };
            
              const intervalCheck = setInterval(check, 50);
              check();
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
    try {
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
            if (orders.length > 0 && isOrdersVisible) {
              if (widgetRef.current?.activeChart()?.symbol()) {
                const marketKey = widgetRef.current.activeChart().symbol().split('/')[0] + widgetRef.current.activeChart().symbol().split('/')[1]
                orders.forEach((order: any) => {
                  if (order[4]?.toLowerCase() != marketKey.toLowerCase() || order?.[10]) return;
                  const orderLine = widgetRef.current.activeChart().createOrderLine().setPrice(order[0] / Number(markets[order[4]].priceFactor))
                  .setQuantity(formatDisplay(customRound((order[2]-order[7]) / 10 ** Number(markets[order[4]].baseDecimals), 3)))
                  .setText(`Limit: ${(order[0] / Number(markets[order[4]].priceFactor)).toFixed(Math.floor(Math.log10(Number(markets[order[4]].priceFactor))))}`)
                  .setLineColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
                  .setQuantityBackgroundColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
                  .setQuantityTextColor('#0f0f12')
                  .setCancelButtonIconColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
                  .setCancelButtonBackgroundColor('#0f0f12')
                  .setBodyBackgroundColor('#0f0f12')
                  .setBodyTextColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
                  .setBodyBorderColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
                  .setQuantityBorderColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
                  .setCancelButtonBorderColor(order[3] == 1 ? '#50f08d' : 'rgb(239, 81, 81)')
                  .setBodyFont("10px Funnel Display")
                  .setQuantityFont("bold 10px Funnel Display")
                  .setLineStyle(2)
                  .onMove(async () => {
                    orderLine.setCancellable(false)
                    try {
                      let action: any = [[]];
                      let price: any = [[]];
                      let param1: any = [[]];
                      let param2: any = [[]];
                      if (order[3] == 1) {
                        action[0].push(0)
                        action[0].push(3)
                        action[0].push(1)
                        price[0].push(order[0])
                        price[0].push(BigInt(orderLine.getPrice() * Number(markets[order[4]].priceFactor)))
                        price[0].push(BigInt(orderLine.getPrice() * Number(markets[order[4]].priceFactor)))
                        param1[0].push(BigInt(order[1]))
                        param1[0].push(((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)))
                        param1[0].push(((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)))
                        param2[0].push(address)
                        param2[0].push(address)
                        param2[0].push(address)
                      }
                      else {
                        action[0].push(0)
                        action[0].push(4)
                        action[0].push(2)
                        price[0].push(order[0])
                        price[0].push(BigInt(orderLine.getPrice() * Number(markets[order[4]].priceFactor)))
                        price[0].push(BigInt(orderLine.getPrice() * Number(markets[order[4]].priceFactor)))
                        param1[0].push(BigInt(order[1]))
                        param1[0].push(order[2]-order[7])
                        param1[0].push(order[2]-order[7])
                        param2[0].push(address)
                        param2[0].push(address)
                        param2[0].push(address)
                      }
                      await setChain();
                      let hash;
                      const tokenIn = (order[3] == 1 ? markets[order[4]].quoteAddress : markets[order[4]].baseAddress)
                      const allowance = (await readContracts(config, {
                        contracts: [
                          {
                            abi: TokenAbi,
                            address: (tokenIn == settings.chainConfig[activechain].eth as `0x${string}` ? settings.chainConfig[activechain].weth as `0x${string}` : tokenIn as `0x${string}`),
                            functionName: 'allowance',
                            args: [
                              address as `0x${string}`,
                              markets[order[4]].address,
                            ],
                          },
                        ]
                      }))?.[0]?.result || BigInt(0)
                      if (allowance < (order[3] == 1 ? ((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)) : order[2]-order[7])) {
                        if (client) {
                          let uo = []
                          uo.push(approve(
                            (tokenIn == settings.chainConfig[activechain].eth as `0x${string}` ? settings.chainConfig[activechain].weth as `0x${string}` : tokenIn as `0x${string}`),
                            markets[order[4]].address,
                            maxUint256,
                          ))
                          uo.push(multiBatchOrders(
                            router,
                            BigInt(0),
                            [markets[order[4]].address],
                            action,
                            price,
                            param1,
                            param2,
                          ))
                          hash = await sendUserOperationAsync({ uo: uo })
                          newTxPopup(
                            hash.hash,
                            'approve',
                            (tokenIn == settings.chainConfig[activechain].eth as `0x${string}` ? settings.chainConfig[activechain].weth as `0x${string}` : tokenIn as `0x${string}`),
                            '',
                            customRound(
                              Number((order[3] == 1 ? ((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)) : order[2]-order[7])) /
                              10 ** Number(order[3] == 1 ? markets[order[4]].quoteDecimals : markets[order[4]].baseDecimals),
                              3,
                            ),
                            0,
                            '',
                            activeMarket.address,
                          );
                        }
                        else {
                          hash = await sendUserOperationAsync({
                            uo: approve(
                              (tokenIn == settings.chainConfig[activechain].eth as `0x${string}` ? settings.chainConfig[activechain].weth as `0x${string}` : tokenIn as `0x${string}`),
                              markets[order[4]].address,
                              maxUint256,
                            )
                          })
                          newTxPopup(
                            (client
                              ? hash.hash
                              : await waitForTxReceipt(hash.hash)
                            ),
                            'approve',
                            (tokenIn == settings.chainConfig[activechain].eth as `0x${string}` ? settings.chainConfig[activechain].weth as `0x${string}` : tokenIn as `0x${string}`),
                            '',
                            customRound(
                              Number((order[3] == 1 ? ((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)) : order[2]-order[7])) /
                              10 ** Number(order[3] == 1 ? markets[order[4]].quoteDecimals : markets[order[4]].baseDecimals),
                              3,
                            ),
                            0,
                            '',
                            activeMarket.address,
                          );
                        }
                      }
                      if (!client || !(allowance < (order[3] == 1 ? ((BigInt(order[8])/markets[order[4]].scaleFactor) - (BigInt(order[7])*BigInt(order[0])/markets[order[4]].scaleFactor)) : order[2]-order[7]))) {
                        hash = await sendUserOperationAsync({uo: multiBatchOrders(
                          router,
                          BigInt(0),
                          [markets[order[4]].address],
                          action,
                          price,
                          param1,
                          param2,
                        )})
                      }
                      await waitForTxReceipt(hash.hash);
                      refetch()
                    } catch (error) {
                      orderLine.setCancellable(true)
                      orderLine.setPrice(order[0] / Number(markets[order[4]].priceFactor))
                    }
                  })
                  .onCancel(async () => {
                    orderLine.setCancellable(false)
                    try {
                      await setChain();
                      let hash;
                      hash = await cancelOrder(
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
                      );
                      await waitForTxReceipt(hash.hash);
                      refetch()
                      orderLine.remove()
                    } catch (error) {
                      orderLine.setCancellable(true)
                    }
                  })
                  orderLine.getOrder = () => order;
                  order.push(orderLine);
                })
              }
            }
          },
        );
      }
    }
    catch(e) {
      console.log(e)
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
