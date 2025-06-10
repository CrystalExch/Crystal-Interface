import {
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  Time,
} from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

import './ChartCanvas.css';

interface ChartCanvasProps {
  data: any;
  activeMarket: any;
  selectedInterval: any;
  setOverlayVisible: any;
}

const ChartCanvas: React.FC<ChartCanvasProps> = ({ data, activeMarket, selectedInterval, setOverlayVisible }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const colors: any = {
    backgroundColor: 'rgb(24, 24, 32, 0)',
    textColor: '#cfc4c49c',
    gridColor: {
      vertLinesColor: 'rgba(255, 255, 255, 0.05)',
      horzLinesColor: 'rgba(255, 255, 255, 0.05)',
    },
  };

  useEffect(() => {
    if (chartContainerRef.current) {
      const chart: IChartApi = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: colors.backgroundColor },
          textColor: colors.textColor,
        },
        crosshair: { mode: 0 },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        grid: {
          vertLines: { color: colors.gridColor.vertLinesColor },
          horzLines: { color: colors.gridColor.horzLinesColor },
        },
        rightPriceScale: {
          borderColor: '#5552529c',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: '#5552529c',
          timeVisible: true,
          secondsVisible: true,
        },
      });

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#45fa8b',
        downColor: '#ef4444',
        borderUpColor: '#45fa8b',
        borderDownColor: '#ef4444',
        wickUpColor: '#45fa8b',
        wickDownColor: '#ef4444',
      });

      chartRef.current = chart;
      seriesRef.current = candlestickSeries;

      const resizeObserver = new ResizeObserver((entries) => {
        if (
          entries.length === 0 ||
          entries[0].target !== chartContainerRef.current
        ) {
          return;
        }
        const { width, height } = entries[0].contentRect;
        chartRef.current?.applyOptions({ width, height });
      });

      resizeObserver.observe(chartContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        chart.remove();
      };
    }
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    if (series && data?.[0] && (selectedInterval === '1d'
    ? '1D'
    : selectedInterval === '4h'
    ? '240'
    : selectedInterval === '1h'
    ? '60'
    : selectedInterval.slice(0, -1)) == data?.[1]?.match(/\d.*/)?.[0]) {
      const formattedData = data[0].map((item: any) => ({
        ...item,
        time: (item.time / 1000) as Time,
      }));
      chartRef.current?.applyOptions({
        rightPriceScale: {
          autoScale: true,
        },
      });
      series.applyOptions({
        priceFormat: {
          precision: Math.floor(Math.log10(Number(activeMarket.priceFactor))),
          minMove: Math.pow(10, -Math.floor(Math.log10(Number(activeMarket.priceFactor)))),
        },
      });
      series.setData(formattedData);
      setTimeout(() => {
        chartRef.current?.applyOptions({
          rightPriceScale: {
            autoScale: false,
          },
        });
      }, 1);
      setOverlayVisible(false)
    }
  }, [data]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: colors.backgroundColor },
          textColor: colors.textColor,
        },
        grid: {
          vertLines: { color: colors.gridColor.vertLinesColor },
          horzLines: { color: colors.gridColor.horzLinesColor },
        },
      });
    }
  });

  return (
    <div className="chart">
      <div ref={chartContainerRef} />
    </div>
  );
};

export default ChartCanvas;
