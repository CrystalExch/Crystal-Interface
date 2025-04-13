import React from 'react';
import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';
import TradeHistoryItem from './TradeHistoryItem';

import { getTradeValue, useSortableData } from '../utils';
import { settings } from '../../../settings.ts';

import './TradeHistoryContent.css';

interface TradeHistoryContentProps {
  tradehistory: any[];
  trades: any;
  pageSize: number;
  currentPage: number;
}

const TradeHistoryContent: React.FC<TradeHistoryContentProps> = ({
  tradehistory,
  trades,
  pageSize,
  currentPage
}) => {
  const { sortedItems, sortColumn, sortOrder, handleSort } = useSortableData(
    trades,
    tradehistory,
    (trade: any, column: string) => getTradeValue(trade, column, markets, trades),
  );

  const currentItems = sortedItems.length > 0 ? 
    sortedItems.slice((currentPage-1) * pageSize, currentPage * pageSize) : 
    [];

    return (
    <div className="trades-content-wrapper">
      <div className="trade-history-oc-header">
        <div className="ghost" />
        <SortableHeaderCell
          columnKey="markets"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('markets')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="tradeValue"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('tradeValue')}
            tooltipText={
              <div>
                <div className="tooltip-description">
                  {t('tradeValueSubtitle')}
                </div>
              </div>
            }
            className="impact-label"
          />
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="oc-price"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('price')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="type"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('type')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="time"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('time')}
        </SortableHeaderCell>
        <div className="oc-cell view">{t('view')}</div>
      </div>
      
      <div className="trade-history-items-container">
        {currentItems.length > 0 ? (
          currentItems.map((item, index) => (
            <TradeHistoryItem
              key={`${item[4]}-${item[0]}-${item[1]}-${index}`}
              trade={item}
              market={markets[item[4]]}
              quotePrice={markets[item[4]].quoteAsset == 'USDC' ? 1 : trades[(markets[item[4]].quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : markets[item[4]].quoteAsset) + 'USDC']?.[0]?.[3]
              / Number(markets[(markets[item[4]].quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : markets[item[4]].quoteAsset) + 'USDC']?.priceFactor)}
            />
          ))
        ) : (null
        )}
      </div>
    </div>
  );
};

export default TradeHistoryContent;