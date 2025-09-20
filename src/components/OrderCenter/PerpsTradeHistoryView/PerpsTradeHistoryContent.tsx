import React from 'react';
import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';
import PerpsTradeHistoryItem from './PerpsTradeHistoryItem';
import { useSortableData } from '../utils';
import './PerpsTradeHistoryContent.css';

interface PerpsTradeHistoryContentProps {
  tradehistory: any[];
  pageSize: number;
  currentPage: number;
  onMarketSelect: any;
  isBlurred?: boolean;
}

const PerpsTradeHistoryContent: React.FC<PerpsTradeHistoryContentProps> = ({
  tradehistory,
  pageSize,
  currentPage,
  onMarketSelect,
  isBlurred
}) => {
  const { sortedItems, sortColumn, sortOrder, handleSort } = useSortableData(
    {},
    tradehistory,
    (trade: any, column: string) => {
      switch (column) {
        case 'time': return trade.time;
        case 'coin': return trade.symbol;
        case 'direction': return trade.direction;
        case 'price': return trade.price;
        case 'size': return trade.size;
        case 'tradeValue': return trade.tradeValue;
        case 'fee': return trade.fee;
        case 'closedPnl': return trade.closedPnl;
        default: return trade[column];
      }
    },
  );

  const currentItems = sortedItems.length > 0 
    ? sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  return (
    <>
      <div className="perps-trade-history-header">
        <SortableHeaderCell
          columnKey="time"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('time')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="coin"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('coin')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="direction"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('direction')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="price"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('price')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="size"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('size')}
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
                  {t('totalValueOfTrade')}
                </div>
              </div>
            }
            className="trade-value-label"
          />
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="fee"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('fee')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="closedPnl"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('closedPnl')}
            tooltipText={
              <div>
                <div className="tooltip-description">
                  {t('realizedProfitLoss')}
                </div>
              </div>
            }
            className="closed-pnl-label"
          />
        </SortableHeaderCell>
      </div>

      {currentItems.length > 0 ? (
        currentItems.map((item, index) => (
          <PerpsTradeHistoryItem
            key={`trade-${item.id || index}`}
            trade={item}
            onMarketSelect={onMarketSelect}
            isBlurred={isBlurred}
          />
        ))
      ) : null}
    </>
  );
};

export default React.memo(PerpsTradeHistoryContent);