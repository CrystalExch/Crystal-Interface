// memeOverrides.ts - TradingView styling overrides for meme charts

export const memeOverrides = {
  // Background colors
  'paneProperties.background': 'rgb(6,6,6)',
  'paneProperties.backgroundType': 'solid',
  
  // Grid lines
  'paneProperties.vertGridProperties.color': 'rgba(255, 255, 255, 0.05)',
  'paneProperties.horzGridProperties.color': 'rgba(255, 255, 255, 0.05)',
  'paneProperties.vertGridProperties.style': 2,
  'paneProperties.horzGridProperties.style': 2,
  
  // Price scale
  'scalesProperties.backgroundColor': 'rgb(6,6,6)',
  'scalesProperties.lineColor': 'rgba(255, 255, 255, 0.1)',
  'scalesProperties.textColor': '#aaaecf',
  'scalesProperties.fontSize': 11,
  'scalesProperties.fontFamily': 'Funnel Display',
  
  // Time scale
  'timeScale.backgroundColor': 'rgb(6,6,6)',
  'timeScale.borderColor': 'rgba(255, 255, 255, 0.1)',
  'timeScale.textColor': '#aaaecf',
  'timeScale.fontSize': 11,
  'timeScale.fontFamily': 'Funnel Display',
  
  // Candles
  'mainSeriesProperties.candlestick.upColor': '#50f08d',
  'mainSeriesProperties.candlestick.downColor': '#ef5151',
  'mainSeriesProperties.candlestick.drawWick': true,
  'mainSeriesProperties.candlestick.drawBorder': true,
  'mainSeriesProperties.candlestick.borderColor': '#50f08d',
  'mainSeriesProperties.candlestick.borderUpColor': '#50f08d',
  'mainSeriesProperties.candlestick.borderDownColor': '#ef5151',
  'mainSeriesProperties.candlestick.wickUpColor': '#50f08d',
  'mainSeriesProperties.candlestick.wickDownColor': '#ef5151',
  
  // Volume
  'volumePaneSize': 'medium',
  'volume.volume.color.0': 'rgba(239, 81, 81, 0.4)',
  'volume.volume.color.1': 'rgba(80, 240, 141, 0.4)',
  'volume.volume.transparency': 60,
  
  // Crosshair
  'crosshairProperties.color': '#aaaecf',
  'crosshairProperties.width': 1,
  'crosshairProperties.style': 2,
  
  // Legend
  'legendProperties.showLegend': true,
  'legendProperties.showStudyArguments': true,
  'legendProperties.showStudyTitles': true,
  'legendProperties.showStudyValues': true,
  'legendProperties.showSeriesTitle': true,
  'legendProperties.showSeriesOHLC': true,
  
  // Toolbar
  'toolbar.backgroundColor': 'rgb(6,6,6)',
  'toolbar.borderColor': 'rgba(255, 255, 255, 0.1)',
  
  // Meme-specific styling
  'symbolWatermarkProperties.transparency': 90,
  'symbolWatermarkProperties.color': '#aaaecf',
  'symbolWatermarkProperties.fontFamily': 'Funnel Display',
  
  // Price line
  'priceLineProperties.color': '#aaaecf',
  'priceLineProperties.linewidth': 1,
  'priceLineProperties.linestyle': 2,
  
  // Session breaks
  'sessionProperties.backgroundColor': 'rgba(255, 255, 255, 0.02)',
  'sessionProperties.backgroundTransparency': 95,
  
  // Border
  'paneProperties.topMargin': 10,
  'paneProperties.bottomMargin': 8,
  'paneProperties.leftAxisProperties.autoScale': true,
  'paneProperties.rightAxisProperties.autoScale': true,
  
  // Font overrides for all text
  'font.fontFamily': 'Funnel Display',
  'font.fontSize': 11,
};