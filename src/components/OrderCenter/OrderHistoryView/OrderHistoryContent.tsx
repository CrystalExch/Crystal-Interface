import React, { forwardRef } from 'react';
import { VariableSizeList as List } from 'react-window';

import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import OrderHistoryItem from '../OrderHistoryView/OrderHistoryItem';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';

import { getOrderHistoryValue, useSortableData } from '../utils';

import './OrderHistoryContent.css';

interface OrderHistoryContentProps {
  canceledorders: any[];
  onlyThisMarket: boolean;
  currentMarket: string;
}

const OrderHistoryContent: React.FC<OrderHistoryContentProps> = ({
  canceledorders,
  onlyThisMarket,
  currentMarket,
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

  const InnerElement = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >((props, ref) => (
    <div ref={ref} {...props}>
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
      {props.children}
    </div>
  ));

  return (
    <div className="orderhistory-content-wrapper">
      <List
        height={
          window.innerHeight > 1080
            ? 326.4
            : window.innerHeight > 960
              ? 285.2
              : window.innerHeight > 840
                ? 244
                : window.innerHeight > 720
                  ? 202.8
                  : 161.6
        }
        itemCount={sortedItems.length + 1}
        itemSize={(index) => (index === 0 ? 35 : 41.2)}
        innerElementType={InnerElement}
        width="100%"
      >
        {({ index, style }) => {
          if (index === 0) return <div style={style} />;
          const item = sortedItems[index - 1];
          return (
            <div style={style}>
              <OrderHistoryItem
                key={`${item[4]}-${item[0]}-${item[1]}-${index - 1}`}
                order={item}
                market={markets[item[4]]}
              />
            </div>
          );
        }}
      </List>
    </div>
  );
};

export default OrderHistoryContent;
