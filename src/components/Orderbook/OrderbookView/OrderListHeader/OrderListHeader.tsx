import React from 'react';

import OrderbookTokenSelect from '../TokenViewSelect/TokenViewSelect';

import './OrderListHeader.css';

interface OrderListHeaderProps {
  amountsQuote: string;
  onAmountsQuoteChange: (value: string) => void;
  symbol: string;
}

const OrderListHeader: React.FC<OrderListHeaderProps> = ({
  amountsQuote,
  onAmountsQuoteChange,
  symbol,
}) => (
  <div className="ol-header">
    <span>{t('price')}</span>
    <span>
      {t('size')} [{amountsQuote === 'Quote' ? 'USDC' : symbol}]
    </span>
    <span className="total-column">
      <span className="total-name">{t('total')}</span>
      <OrderbookTokenSelect
        value={amountsQuote}
        onChange={onAmountsQuoteChange}
        symbol={symbol}
      />
    </span>
  </div>
);

export default OrderListHeader;
