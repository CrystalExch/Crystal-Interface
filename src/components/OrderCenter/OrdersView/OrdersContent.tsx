import React, { memo, useState } from 'react';

import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';
import OrderItem from './OrderItem';

import multiBatchOrders from '../../../scripts/multiBatchOrders';

import { getOrderValue, useSortableData } from '../utils';
import { settings } from '../../../settings.ts';
import './OrdersContent.css';

interface OrdersContentProps {
  orders: any[];
  router: any;
  address: any;
  trades: any;
  refetch: any;
  sendUserOperationAsync: any;
  setChain: any;
  pageSize: number;
  currentPage: number;
  waitForTxReceipt: any;
}

const OrdersContent: React.FC<OrdersContentProps> = memo(
  ({ orders, router, address, trades, refetch, sendUserOperationAsync, setChain, pageSize, currentPage, waitForTxReceipt }) => {
    const { sortedItems, sortColumn, sortOrder, handleSort } = useSortableData(
      trades,
      orders,
      (order: any, column: string) => getOrderValue(order, column, markets, trades),
    );
    const [isSigning, setIsSigning] = useState(false);
    
    const currentItems = sortedItems.length > 0 ? 
    sortedItems.slice((currentPage-1) * pageSize, currentPage * pageSize) : 
    [];

    return (
      <div className="orders-content-wrapper">
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
            className={`cancel-all-oc-cell ${orders.length === 0 ? 'disabled' : ''}  ${isSigning ? 'signing' : ''}`}
          >
            {!isSigning ? (
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
                  await setChain()
                  let hash;
                  setIsSigning(true);
                  hash = await sendUserOperationAsync({uo: multiBatchOrders(
                    router,
                    BigInt(0),
                    m,
                    action,
                    price,
                    param1,
                    param2,
                  )})
                  await waitForTxReceipt(hash.hash);
                  refetch()
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
        
        <div className="order-items-container">
          {currentItems.length > 0 ? (
            currentItems.map((item, index) => (
              <OrderItem
                key={`${item[4]}-${item[0]}-${item[1]}-${index}`}
                order={item}
                trades={trades[item[4]]}
                router={router}
                refetch={refetch}
                sendUserOperationAsync={sendUserOperationAsync}
                setChain={setChain}
                quotePrice={markets[item[4]].quoteAsset == 'USDC' ? 1 : trades[(markets[item[4]].quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : markets[item[4]].quoteAsset) + 'USDC']?.[0]?.[3]
                / Number(markets[(markets[item[4]].quoteAsset == settings.chainConfig[activechain].wethticker ? settings.chainConfig[activechain].ethticker : markets[item[4]].quoteAsset) + 'USDC']?.priceFactor)}
                waitForTxReceipt={waitForTxReceipt}
              />
            ))
          ) : (null
          )}
        </div>
      </div>
    );
  },
);

export default OrdersContent;