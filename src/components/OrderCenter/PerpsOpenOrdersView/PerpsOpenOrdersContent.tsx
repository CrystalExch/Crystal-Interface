import React from 'react';
import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';
import PerpsOpenOrderItem from './PerpsOpenOrdersItem';
import { useSortableData } from '../utils';
import './PerpsOpenOrdersContent.css';

interface PerpsOpenOrdersContentProps {
  orders: any[];
  pageSize: number;
  currentPage: number;
  onMarketSelect: any;
  onCancelOrder?: (order: any) => void;
  onEditOrder?: (order: any) => void;
  isBlurred?: boolean;
}

const PerpsOpenOrdersContent: React.FC<PerpsOpenOrdersContentProps> = ({
  orders,
  pageSize,
  currentPage,
  onMarketSelect,
  onCancelOrder,
  onEditOrder,
  isBlurred
}) => {
  const { sortedItems, sortColumn, sortOrder, handleSort } = useSortableData(
    {},
    orders,
    (order: any, column: string) => {
      switch (column) {
        case 'time': return order.time;
        case 'type': return order.type;
        case 'coin': return order.symbol;
        case 'direction': return order.direction;
        case 'size': return order.size;
        case 'originalSize': return order.originalSize;
        case 'orderValue': return order.orderValue;
        case 'price': return order.price;
        case 'reduceOnly': return order.reduceOnly;
        case 'trigger': return order.triggerCondition;
        case 'tpsl': return order.tpsl;
        default: return order[column];
      }
    },
  );

  const currentItems = sortedItems.length > 0 
    ? sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  return (
    <>
      <div className="perps-open-orders-header">
        <SortableHeaderCell
          columnKey="time"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('time')}
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
          columnKey="size"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('size')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="originalSize"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('originalSize')}
            tooltipText={
              <div>
                <div className="tooltip-description">
                  {t('originalOrderSize')}
                </div>
              </div>
            }
            className="original-size-label"
          />
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="orderValue"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('orderValue')}
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
            label={t('reduceOnly')}
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
          columnKey="trigger"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('trigger')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="tpsl"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('tpSl')}
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
        <div className="oc-cell actions">{t('actions')}</div>
      </div>

      {currentItems.length > 0 ? (
        currentItems.map((item, index) => (
          <PerpsOpenOrderItem
            key={`order-${item.id || index}`}
            order={item}
            onMarketSelect={onMarketSelect}
            onCancelOrder={onCancelOrder}
            onEditOrder={onEditOrder}
            isBlurred={isBlurred}
          />
        ))
      ) : null}
    </>
  );
};

export default React.memo(PerpsOpenOrdersContent);