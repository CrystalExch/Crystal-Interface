import { useState, useMemo } from 'react'

import switchicon from '../../../assets/switch.svg'
import monadlogo from '../../../assets/monadlogo.svg'
import TraderPortfolioPopup from './TraderPortfolioPopup/TraderPortfolioPopup'

import './MemeTradesComponent.css'

export interface RawTrade {
  id: string
  timestamp: number
  isBuy: boolean
  price: number
  tokenAmount: number
  nativeAmount: number
}

interface ViewTrade {
  id: string
  amount: number
  mc: number
  price: number
  trader: string
  fullAddress: string
  age: number
  tags: string[]
}

type AmountMode = 'USDC' | 'MON'
type MCMode = 'MC' | 'Price'

interface Props {
  trades: RawTrade[]
  tokenList?: any[]
  onMarketSelect?: (m: any) => void
  setSendTokenIn?: (t: any) => void
  setpopup?: (v: number) => void
}

export default function MemeTradesComponent({
  trades,
  tokenList = [],
  onMarketSelect,
  setSendTokenIn,
  setpopup
}: Props) {
  const [amountMode, setAmountMode] = useState<AmountMode>('USDC')
  const [mcMode, setMcMode] = useState<MCMode>('MC')
  const [hover, setHover] = useState(false)
  const [popupAddr, setPopupAddr] = useState<string | null>(null)

  const viewTrades: ViewTrade[] = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    return trades.slice(0, 40).map(r => {
      const short = `${r.id.slice(0, 6)}`
      return {
        id: r.id,
        amount: r.isBuy ? r.nativeAmount : -r.nativeAmount,
        mc: 0,
        price: r.price,
        trader: short,
        fullAddress: r.id,
        age: now - r.timestamp,
        tags: []
      }
    })
  }, [trades])

  const fmtAmount = (v: number) =>
    amountMode === 'USDC'
      ? `$${Math.abs(v).toFixed(2)}`
      : `${(Math.abs(v)).toFixed(1)}`

  const fmtMC = (mc: number, price: number) =>
    mcMode === 'MC' ? `$${mc.toFixed(1)}K` : `$${price.toFixed(6)}`

  const getTagIcon = (tag: string) => null

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
            <svg fill="currentColor" className="meme-trades-dollar-sign" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="50" height="50"><path d="M24 4C12.97 4 4 12.97 4 24s8.97 20 20 20 20-8.97 20-20S35.03 4 24 4Zm0 3c9.41 0 17 7.59 17 17s-7.59 17-17 17S7 33.41 7 24 14.59 7 24 7Zm-.52 3.98A1.5 1.5 0 0 0 22 12.5v1.15C19.21 13.04 17 15.36 17 18.25c0 3.16 2.59 5.75 5.75 5.75h2c1.81 0 3.25 1.44 3.25 3.25S24.56 30 22.75 30h-2.25c-1.18 0-2.14-.8-2.42-1.87a1.5 1.5 0 1 0-2.9.76c.58 2.21 2.52 3.77 4.82 4v1.08a1.5 1.5 0 1 0 3 0V32.4c3.31-.14 6-2.86 6-6.15 0-3.43-2.79-6.22-6.25-6.22h-2c-1.54 0-2.75-1.21-2.75-2.75S20.46 14.5 22 14.5h.76a1.5 1.5 0 0 0 .48 0h.76c1.17 0 2.14.8 2.42 1.87a1.5 1.5 0 1 0 2.9-.76c-.58-2.22-2.53-3.78-4.83-3.96V12.5a1.5 1.5 0 0 0-1.5-1.5Z" /></svg>
          </div>
          <div
            className="meme-trades-header-item meme-trades-header-mc"
            onClick={() => setMcMode(p => (p === 'MC' ? 'Price' : 'MC'))}
          >
            {mcMode}
            <img src={switchicon} className="meme-header-switch-icon" alt="" />
          </div>
          <div className="meme-trades-header-item meme-trades-header-trader">Trader</div>
          <div className="meme-trades-header-item meme-trades-header-age">Age</div>
        </div>

        <div className="meme-trades-list">
          {viewTrades.map(t => (
            <div key={t.id} className="meme-trade-row">
              <div className={`meme-trade-amount ${t.amount >= 0 ? 'positive' : 'negative'}`}>
                {amountMode === 'MON' && <img src={monadlogo} alt="" className="meme-trade-mon-logo" />}
                {fmtAmount(t.amount)}
              </div>
              <div className="meme-trade-mc">{fmtMC(t.mc, t.price)}</div>
              <div
                className="meme-trade-trader clickable"
                onClick={() => setPopupAddr(t.fullAddress)}
              >
                {t.trader}
              </div>
              <div className="meme-trade-age-container">
                <div className="meme-trade-tags">{t.tags.map(getTagIcon)}</div>
                <span className="meme-trade-age">{t.age}s</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`pause-indicator ${hover ? 'visible' : ''}`}>
          <div className="pause-content"><span className="pause-text">Paused</span></div>
        </div>
      </div>

      { }
    </>
  )
}