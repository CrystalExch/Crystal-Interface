import React, { useState } from 'react';
import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';
import PerpsOpenOrdersItem from './PerpsOpenOrdersItem';
import { useSortableData } from '../utils';
import './PerpsOpenOrdersContent.css';

interface PerpsOpenOrdersContentProps {
  orders: any[];
  pageSize: number;
  currentPage: number;
  onMarketSelect: any;
  isBlurred?: boolean;
  handleCancel: any;
}

const PerpsOpenOrdersContent: React.FC<PerpsOpenOrdersContentProps> = ({
  orders,
  pageSize,
  currentPage,
  onMarketSelect,
  isBlurred,
  handleCancel
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
  const [isSigning, setIsSigning] = useState(false);

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
          columnKey="originalSize"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('Original Size')}
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
          {t('Order Value')}
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
        <div
          className={`cancel-all-oc-cell ${orders.length === 0 ? 'disabled' : ''}  ${isSigning ? 'signing' : ''}`}
        >
          {!isSigning ? (
          <span
            className="cancel-all-label"
            onClick={async () => {
              if (orders.length === 0) return;
              try {
                setIsSigning(true);
                await Promise.all(
                  orders.map(o => handleCancel(o.id))
                );
              } catch (error) {
              } finally {
                setIsSigning(false);
              }
            }}
          >
            {t('cancelAll')}
          </span>
          ) : (<div className="cancel-all-loading-spinner"></div>)}
        </div>
      </div>

      {currentItems.length > 0 ? (
        currentItems.map((item, index) => (
          <PerpsOpenOrdersItem
            key={`order-${item.id || index}`}
            order={item}
            onMarketSelect={onMarketSelect}
            isBlurred={isBlurred}
            handleCancel={handleCancel}
          />
        ))
      ) : null}
    </>
  );
};

export default React.memo(PerpsOpenOrdersContent);