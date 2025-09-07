import React, { useState } from 'react';

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
  onMarketSelect: any;
  setpopup: (value: number) => void;
  onLimitPriceUpdate?: (price: number) => void;
  openEditOrderPopup: (order: any) => void;
  openEditOrderSizePopup: (order: any) => void;
}

const OrdersContent: React.FC<OrdersContentProps> = ({ 
  orders, 
  router, 
  address, 
  trades, 
  refetch, 
  sendUserOperationAsync, 
  setChain, 
  pageSize, 
  currentPage, 
  onMarketSelect,
  setpopup, 
  onLimitPriceUpdate, 
  openEditOrderPopup,
  openEditOrderSizePopup
}) => {
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
    <>
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
              const orderbatch: Record<string, any> = {}

              orders.forEach(order => {
                const k = markets[order[4]].address
                if (!orderbatch[k]) orderbatch[k] = []
                orderbatch[k].push({
                  isRequireSuccess: false,
                  action: 1n,
                  param1: order[0], // price
                  param2: order[1], // size/id
                  param3: BigInt(0),  // cloid or extra id
                })
              })

              const batches: any = Object.entries(orderbatch).map(([market, actions]) => ({
                market: market as `0x${string}`,
                actions,
                options: BigInt(0)
              }))
              try {
                await setChain()
                setIsSigning(true);
                await sendUserOperationAsync({
                  uo: multiBatchOrders(
                    router,
                    BigInt(0),
                    batches,
                    BigInt(Math.floor(Date.now() / 1000) + 900),
                    '0x0000000000000000000000000000000000000000',
                  )
                });
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
              onMarketSelect={onMarketSelect}
              setpopup={setpopup}
              onLimitPriceUpdate={onLimitPriceUpdate}
              openEditOrderPopup={openEditOrderPopup}
              openEditOrderSizePopup={openEditOrderSizePopup}
            />
          ))
        ) : (null
        )}
    </>
  );
};

export default React.memo(OrdersContent);