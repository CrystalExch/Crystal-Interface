import React from 'react';

import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import OrderHistoryItem from '../OrderHistoryView/OrderHistoryItem';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';

import { getOrderHistoryValue, useSortableData } from '../utils';

import './OrderHistoryContent.css';

interface OrderHistoryContentProps {
  canceledorders: any[];
  onlyThisMarket: boolean;
  currentMarket: string;
  pageSize: number;
  currentPage: number;
}

const OrderHistoryContent: React.FC<OrderHistoryContentProps> = ({
  canceledorders,
  onlyThisMarket,
  currentMarket,
  pageSize,
  currentPage
}) => {
  const normalizedCurrentMarket = currentMarket.toUpperCase().replace('-', '/');
  const filteredCanceledOrders = canceledorders.filter((order) => {
    const orderMarket = (order[4] || '').toUpperCase();
    return !onlyThisMarket || orderMarket === normalizedCurrentMarket;
  });

  const { sortedItems, sortColumn, sortOrder, handleSort } = useSortableData(
    filteredCanceledOrders,
    (order: any, column: string) =>
      getOrderHistoryValue(order, column, markets),
  );

  // Calculate pagination
  const indexOfLastItem = currentPage * pageSize;
  const indexOfFirstItem = indexOfLastItem - pageSize;
  const currentItems = sortedItems.length > 0 ? 
    sortedItems.slice(indexOfFirstItem, indexOfLastItem) : 
    [];

  return (
    <div className="orderhistory-content-wrapper">
      <div className="order-history-oc-container">
        <div className="order-history-oc-header">
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
            columnKey="price"
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          >
            {t('price')}
          </SortableHeaderCell>
          <SortableHeaderCell
            columnKey="amountFilled"
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          >
            <TooltipLabel
              label={t('amountFilled')}
              tooltipText={
                <div>
                  <div className="tooltip-description">
                    {t('amountFilledSubtitle')}
                  </div>
                </div>
              }
              className="impact-label"
            />
          </SortableHeaderCell>
          <SortableHeaderCell
            columnKey="status"
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          >
            <TooltipLabel
              label={t('status')}
              tooltipText={
                <div>
                  <div className="tooltip-description">{t('statusSubtitle')}</div>
                </div>
              }
              className="impact-label"
            />
          </SortableHeaderCell>
          <SortableHeaderCell
            columnKey="time"
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          >
            {t('time')}
          </SortableHeaderCell>
          <span className="oc-cell view">{t('view')}</span>
        </div>
        
        <div className="order-history-items-container">
          {currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <OrderHistoryItem
                key={`${item[4]}-${item[0]}-${item[1]}-${index}`}
                order={item}
                market={markets[item[4]]}
              />
            ))
          ) : (
            <div className="no-orders-message">
              {t('noOrdersFound')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryContent;