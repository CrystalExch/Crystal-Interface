import { useState, useMemo } from 'react'

import switchicon from '../../../assets/switch.svg'
import monadlogo from '../../../assets/monadlogo.svg'
import TraderPortfolioPopup from './TraderPortfolioPopup/TraderPortfolioPopup'

import { formatSubscript, FormattedNumber } from '../../../utils/memeFormatSubscript'

import './MemeTradesComponent.css'

export interface RawTrade {
  id: string
  timestamp: number
  isBuy: boolean
  price: number
  tokenAmount: number
  nativeAmount: number
  tokenAddress?: string 
}

interface ViewTrade {
  id: string
  timestamp: number
  amount: number
  mc: number
  price: number
  trader: string
  fullAddress: string
  tags: string[]
}

type AmountMode = 'USDC' | 'MON'
type MCMode = 'MC' | 'Price'

interface Props {
  trades: RawTrade[]
  tokenList?: any[]
  market?: any 
  tradesByMarket?: any 
  markets?: any 
  tokendict?: any 
  usdc?: string 
  wethticker?: string
  ethticker?: string
  onMarketSelect?: (m: any) => void
  setSendTokenIn?: (t: any) => void
  setpopup?: (v: number) => void
}

export default function MemeTradesComponent({
  trades,
  tokenList = [],
  market,
  tradesByMarket,
  markets,
  tokendict,
  usdc,
  wethticker,
  ethticker,
  onMarketSelect,
  setSendTokenIn,
  setpopup
}: Props) {

  const [amountMode, setAmountMode] = useState<AmountMode>('USDC')
  const [mcMode, setMcMode] = useState<MCMode>('MC')
  const [hover, setHover] = useState(false)
  const [popupAddr, setPopupAddr] = useState<string | null>(null)

  // Add the fetchLatestPrice function (you'll need to import or define this)
  const fetchLatestPrice = (trades: any[], market: any): number | null => {
    // Your fetchLatestPrice implementation here
    if (!trades || trades.length === 0) return null;
    const sortedTrades = [...trades].sort((a, b) => b.timestamp - a.timestamp);
    const latestTrade = sortedTrades[0];
    return latestTrade ? latestTrade.price : null;
  }

  // Add the calculateUSDValue function
  const calculateUSDValue = (
    amount: bigint,
    trades: any[],
    tokenAddress: string,
    market: any,
  ) => {
    if (!market || !tradesByMarket || !markets || !tokendict || !usdc || !wethticker || !ethticker) {
      return 0; // Return 0 if required data is missing
    }

    if (amount === BigInt(0)) return 0;
    
    if (tokenAddress == market.quoteAddress && tokenAddress == usdc) {
      return Number(amount) / 10 ** 6;
    }
    else if (tokenAddress == market.quoteAddress) {
      return Number(amount) * tradesByMarket[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.[0]?.[3]
        / Number(markets[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.priceFactor) / 10 ** 18;
    }
    
    const latestPrice = fetchLatestPrice(trades, market);
    if (!latestPrice) return 0;
    
    const quotePrice = market.quoteAsset == 'USDC' ? 1 : tradesByMarket[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.[0]?.[3]
      / Number(markets[(market.quoteAsset == wethticker ? ethticker : market.quoteAsset) + 'USDC']?.priceFactor)
    
    const usdValue = (Number(amount) * latestPrice * quotePrice / 10 ** Number(tokendict[tokenAddress].decimals));
    return Number(usdValue);
  };

  const viewTrades: ViewTrade[] = useMemo(() => {
    return trades.slice(0, 40).map(r => {
      const short = r.id.slice(0, 6)
      
      // Calculate proper USD amount using calculateUSDValue
      let usdAmount = 0;
      if (market && r.tokenAddress) {
        const tokenAmount = BigInt(Math.floor(r.tokenAmount * 10 ** 18)); // Convert to proper bigint format
        usdAmount = calculateUSDValue(tokenAmount, trades, r.tokenAddress, market);
        // Make negative for sells
        if (!r.isBuy) {
          usdAmount = -usdAmount;
        }
      } else {
        // Fallback to original logic if data is missing
        usdAmount = r.isBuy ? r.nativeAmount : -r.nativeAmount;
      }

      return {
        id: r.id,
        timestamp: r.timestamp,
        amount: usdAmount, // Now using calculated USD value
        mc: r.price * 1000000000,
        price: r.price,
        trader: short,
        fullAddress: r.id,
        tags: []                         
      }
    })
  }, [trades, market, tradesByMarket, markets, tokendict, usdc, wethticker, ethticker])

const FormattedNumberDisplay = ({ formatted }: { formatted: FormattedNumber }) => {
  if (formatted.type === 'simple') {
    return <span>{formatted.text}</span>;
  }
  
  return (
    <span>
      {formatted.beforeSubscript}
      <span className="subscript">{formatted.subscriptValue}</span>
      {formatted.afterSubscript}
    </span>
  );
};

  const fmtAmount = (v: number) =>
    amountMode === 'USDC'
      ? `$${Math.abs(v).toFixed(2)}`
      : `${Math.abs(v).toFixed(1)}`

  const fmtMC = (mc: number, price: number) =>
    mcMode === 'MC' ? `$${mc.toFixed(1)}K` : `$${formatSubscript(price.toFixed(8))}`

  const fmtTime = (ts: number) =>
    new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const getTagIcon = () => null   

  return (
    <>
      <div
        className="meme-trades-container"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="meme-trades-header">
          <div
            className="meme-trades-header-item meme-trades-header-amount"
            onClick={() => setAmountMode(p => (p === 'USDC' ? 'MON' : 'USDC'))}
          >
            Amount
          </div>
          <div
            className="meme-trades-header-item meme-trades-header-mc"
            onClick={() => setMcMode(p => (p === 'MC' ? 'Price' : 'MC'))}
          >
            {mcMode}
            <img src={switchicon} className="meme-header-switch-icon" alt="" />
          </div>
          <div className="meme-trades-header-item meme-trades-header-trader">Trader</div>
          <div className="meme-trades-header-item meme-trades-header-age">Time</div>
        </div>

        <div className="meme-trades-list">
          {viewTrades.map(t => (
            <div key={t.id} className="meme-trade-row">
              <div className={`meme-trade-amount ${t.amount >= 0 ? 'positive' : 'negative'}`}>
                {amountMode === 'MON' && <img src={monadlogo} alt="" className="meme-trade-mon-logo" />}
                {fmtAmount(t.amount)}
              </div>
              <div className="meme-trade-mc">
                {mcMode === 'MC' ? (
                  <span>${(t.mc / 1000).toFixed(1)}K</span>
                ) : (
                  <span>$<FormattedNumberDisplay formatted={formatSubscript(t.price.toFixed(8))} /></span>
                )}
              </div>              
              <div
                className="meme-trade-trader clickable"
                onClick={() => setPopupAddr(t.fullAddress)}
              >
                {t.trader}
              </div>
              <div className="meme-trade-age-container">
                <div className="meme-trade-tags">{t.tags.map(getTagIcon)}</div>
                <span className="meme-trade-age">{fmtTime(t.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`pause-indicator ${hover ? 'visible' : ''}`}>
          <div className="pause-content"><span className="pause-text">Paused</span></div>
        </div>
      </div>

      {popupAddr && (
        <TraderPortfolioPopup
          traderAddress={popupAddr}
          onClose={() => setPopupAddr(null)}
          tokenList={tokenList}
          marketsData={[]} 
          onMarketSelect={onMarketSelect}
          setSendTokenIn={setSendTokenIn}
          setpopup={setpopup}
        />
      )}
    </>
  )
}