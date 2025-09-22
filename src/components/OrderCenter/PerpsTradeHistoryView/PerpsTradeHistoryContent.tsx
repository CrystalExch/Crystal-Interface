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
          {t('Time')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="coin"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Coin')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="direction"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Direction')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="price"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Price')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="size"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Size')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="tradeValue"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('Trade Value')}
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
          {t('Fee')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="closedPnl"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('Closed PNL')}
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