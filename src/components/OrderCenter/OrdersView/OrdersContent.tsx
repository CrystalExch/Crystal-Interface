import React, { forwardRef, memo } from 'react';
import { VariableSizeList as List } from 'react-window';

import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';
import OrderItem from './OrderItem';

import multiBatchOrders from '../../../scripts/multiBatchOrders';

import { getOrderValue, useSortableData } from '../utils';

import './OrdersContent.css';

interface OrdersContentProps {
  orders: any[];
  router: any;
  address: any;
  trades: any;
  refetch: any;
}

const OrdersContent: React.FC<OrdersContentProps> = memo(
  ({ orders, router, address, trades, refetch }) => {
    const { sortedItems, sortColumn, sortOrder, handleSort } = useSortableData(
      orders,
      (order: any, column: string) => getOrderValue(order, column, markets),
    );

    const InnerElement = forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement>
    >((props, ref) => (
      <div ref={ref} {...props}>
        <div className="orders-oc-header">
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
            columnKey="limitPrice"
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          >
            <TooltipLabel
              label={t('limitPrice')}
              tooltipText={
                <div>
                  <div className="tooltip-description">
                    {t('limitPriceSubtitle')}
                  </div>
                </div>
              }
              className="impact-label"
            />
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
            columnKey="time"
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          >
            {t('time')}
          </SortableHeaderCell>
          <div
            className={`cancel-all-oc-cell ${orders.length === 0 ? 'disabled' : ''}`}
          >
            <span
              className="cancel-all-label"
              onClick={async () => {
                if (orders.length === 0) return;
                const orderbatch: Record<
                  string,
                  { 0: any[]; 1: any[]; 2: any[]; 3: any[] }
                > = {};
                orders.forEach((order) => {
                  const k = markets[order[4]].address;
                  if (!orderbatch[k]) {
                    orderbatch[k] = { 0: [], 1: [], 2: [], 3: [] };
                  }
                  orderbatch[k][0].push(0);
                  orderbatch[k][1].push(order[0]);
                  orderbatch[k][2].push(order[1]);
                  orderbatch[k][3].push(
                    markets[order[4]].baseAddress ===
                      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' &&
                      order[3] === 0
                      ? router
                      : address,
                  );
                });
                const m = Object.keys(orderbatch) as `0x${string}`[];
                const action = m.map((market) => orderbatch[market][0]);
                const price = m.map((market) => orderbatch[market][1]);
                const param1 = m.map((market) => orderbatch[market][2]);
                const param2 = m.map((market) => orderbatch[market][3]);
                try {
                  await multiBatchOrders(
                    router,
                    BigInt(0),
                    m,
                    action,
                    price,
                    param1,
                    param2,
                  );
                  setTimeout(()=>refetch(), 500)
                } catch (error) {
                  console.error(error);
                }
              }}
            >
              {t('cancelAll')}
            </span>
          </div>
        </div>
        {props.children}
      </div>
    ));

    return (
      <div className="orders-content-wrapper">
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
          itemSize={(index: number) => (index === 0 ? 35 : 41.2)}
          innerElementType={InnerElement}
          width="100%"
        >
          {({ index, style }) => {
            if (index === 0) return <div style={style} />;
            const item = sortedItems[index - 1];
            return (
              <div style={style}>
                <OrderItem
                  key={`${item[4]}-${item[0]}-${item[1]}-${index - 1}`}
                  order={item}
                  trades={trades}
                  router={router}
                  refetch={refetch}
                />
              </div>
            );
          }}
        </List>
      </div>
    );
  },
);

export default OrdersContent;
