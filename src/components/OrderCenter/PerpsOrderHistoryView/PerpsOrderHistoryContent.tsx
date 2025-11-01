import React from 'react';
import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';
import PerpsOrderHistoryItem from './PerpsOrderHistoryItem';
import { useSortableData } from '../utils';
import './PerpsOrderHistoryContent.css';

interface PerpsOrderHistoryContentProps {
  orderHistory: any[];
  pageSize: number;
  currentPage: number;
  onMarketSelect: any;
  isBlurred?: boolean;
}

const PerpsOrderHistoryContent: React.FC<PerpsOrderHistoryContentProps> = ({
  orderHistory,
  pageSize,
  currentPage,
  onMarketSelect,
  isBlurred
}) => {
  const { sortedItems, sortColumn, sortOrder, handleSort } = useSortableData(
    {},
    orderHistory,
    (order: any, column: string) => {
      switch (column) {
        case 'time': return order.time;
        case 'type': return order.type;
        case 'coin': return order.symbol;
        case 'direction': return order.direction;
        case 'size': return order.size;
        case 'filledSize': return order.filledSize;
        case 'orderValue': return order.orderValue;
        case 'price': return order.price;
        case 'reduceOnly': return order.reduceOnly;
        case 'trigger': return order.triggerCondition;
        case 'tpsl': return order.tpsl;
        case 'status': return order.status;
        default: return order[column];
      }
    },
  );

  const currentItems = sortedItems.length > 0 
    ? sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  return (
    <>
      <div className="perps-order-history-header">
        <SortableHeaderCell
          columnKey="time"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Time')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="type"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Type')}
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
          columnKey="size"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Size')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="filledSize"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('Filled Size')}
            tooltipText={
              <div>
                <div className="tooltip-description">
                  {t('amountOfOrderFilled')}
                </div>
              </div>
            }
            className="filled-size-label"
          />
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="orderValue"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Order Value')}
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
          columnKey="reduceOnly"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('Reduce Only')}
            tooltipText={
              <div>
                <div className="tooltip-description">
                  {t('reduceOnlyDescription')}
                </div>
              </div>
            }
            className="reduce-only-label"
          />
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="tpsl"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('TP/SL')}
            tooltipText={
              <div>
                <div className="tooltip-description">
                  {t('takeProfitStopLoss')}
                </div>
              </div>
            }
            className="tpsl-label"
          />
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="status"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Status')}
        </SortableHeaderCell>
      </div>

      {currentItems.length > 0 ? (
        currentItems.map((item, index) => (
          <PerpsOrderHistoryItem
            key={`order-history-${item.id || index}`}
            order={item}
            onMarketSelect={onMarketSelect}
            isBlurred={isBlurred}
          />
        ))
      ) : null}
    </>
  );
};

export default React.memo(PerpsOrderHistoryContent);