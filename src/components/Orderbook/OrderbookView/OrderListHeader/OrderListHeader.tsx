import React from 'react';

import OrderbookTokenSelect from '../TokenViewSelect/TokenViewSelect';

import './OrderListHeader.css';

interface OrderListHeaderProps {
  amountsQuote: string;
  onAmountsQuoteChange: (value: string) => void;
  symbolQuote: string;
  symbolBase: string;
}

const OrderListHeader: React.FC<OrderListHeaderProps> = ({
  amountsQuote,
  onAmountsQuoteChange,
  symbolQuote,
  symbolBase,
}) => (
  <div className="ol-header">
    <span>{t('price')}</span>
    <span>
      {t('size')} [{amountsQuote === 'Quote' ? symbolQuote : symbolBase}]
    </span>
    <span className="total-column">
      <span className="total-name">{t('total')}</span>
      <OrderbookTokenSelect
        value={amountsQuote}
        onChange={onAmountsQuoteChange}
        symbolQuote={symbolQuote}
        symbolBase={symbolBase}
      />
    </span>
  </div>
);

export default OrderListHeader;
