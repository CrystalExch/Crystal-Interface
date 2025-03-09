import { settings } from '../../../../config';

import './TradeItem.css';

interface TradeItemProps {
  trade: any;
}

const TradeItem = ({ trade }: TradeItemProps) => {
  return (
    <div className={`trade-item ${trade[0] ? 'buy' : 'sell'}`}>
      <div className={`trade-item-left ${trade[0] ? 'buy' : 'sell'}`}>
        <div className="price-arrow-container">
          <svg
            style={{ transform: 'translateY(1px)' }}
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 20 20"
            className="mr-1"
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {trade[0] ? (
              <path d="M5 15L12 8L19 15H5Z" />
            ) : (
              <path d="M5 9L12 16L19 9H5Z" />
            )}
          </svg>
          <span>{trade[1]}</span>
        </div>
      </div>
      <div className="trade-item-center">{trade[2].toFixed(2)}</div>
      <div className="trade-item-right">
        <span>{trade[3]}</span>
        <a
          href={`${settings.chainConfig[activechain].explorer}/tx/${trade[4]}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            className="txn-link"
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="currentColor"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#73758b')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#b7bad8')}
          >
            <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7z" />
            <path d="M14 3h7v7h-2V6.41l-9.41 9.41-1.41-1.41L17.59 5H14V3z" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default TradeItem;
