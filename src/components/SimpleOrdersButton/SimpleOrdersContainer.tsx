import React, { useState } from 'react';
import customRound from '../../utils/customRound';
import { useLanguage } from '../../contexts/LanguageContext';
import cancelOrder from '../../scripts/cancelOrder'; 
import multiBatchOrders from '../../scripts/multiBatchOrders';
import './SimpleOrdersContainer.css';

interface SimpleOrdersContainerProps {
  orders: any[];
  router: `0x${string}`;
  address: string | undefined;
  refetch: () => void;
  sendUserOperationAsync: any;
  setChain: () => Promise<void>;
  waitForTxReceipt: any;
}

const SimpleOrdersContainer: React.FC<SimpleOrdersContainerProps> = ({
  orders,
  router,
  address,
  refetch,
  sendUserOperationAsync,
  setChain,
  waitForTxReceipt,
}) => {
  const { t } = useLanguage();
  const [loadingOrders, setLoadingOrders] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [cancelAllLoading, setCancelAllLoading] = useState(false);

  const handleCancelOrder = async (order: any) => {
    if (!order || !address) {
      return;
    }
    const orderId = order[0].toString();
    try {   
      if (!markets[order[4]]) {
        return;
      }
      
      await setChain();
      let hash;
      setLoadingOrders((prev) => ({ ...prev, [orderId]: true }));
      hash = await cancelOrder(
        sendUserOperationAsync,
      router as `0x${string}`,
      order[3] == 1
        ? markets[order[4]].quoteAddress
        : markets[order[4]].baseAddress,
      order[3] == 1
        ? markets[order[4]].baseAddress
        : markets[order[4]].quoteAddress,
      BigInt(order[0]),
      BigInt(order[1]),
      );
      await waitForTxReceipt(hash.hash);
      refetch()
    } catch (error) {
    } finally {
      setLoadingOrders((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const cancelAllOrders = async () => {
    if (!orders || orders.length === 0 || !address || cancelAllLoading) {
      return;
    }      

    const orderbatch: Record<string, { 0: any[]; 1: any[]; 2: any[]; 3: any[] }> = {};
    
    orders.forEach((order) => {
      if (!order || !order[4] || !markets[order[4]]) {
        return;
      }
      
      const k = markets[order[4]].address;
      if (!orderbatch[k]) {
        orderbatch[k] = { 0: [], 1: [], 2: [], 3: [] };
      }
      
      orderbatch[k][0].push(0);
      orderbatch[k][1].push(order[0]);
      orderbatch[k][2].push(order[1]);
      orderbatch[k][3].push(
        markets[order[4]].baseAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' && 
        order[3] === 0
          ? router
          : address
      );
    });
    
    const m = Object.keys(orderbatch) as `0x${string}`[];
    const action = m.map((market) => orderbatch[market][0]);
    const price = m.map((market) => orderbatch[market][1]);
    const param1 = m.map((market) => orderbatch[market][2]);
    const param2 = m.map((market) => orderbatch[market][3]);

    try {
      await setChain();
      let hash;
      setCancelAllLoading(true);
      hash = await sendUserOperationAsync({uo: multiBatchOrders(
        router as `0x${string}`,
        BigInt(0),
        m,
        action,
        price,
        param1,
        param2,
        '0x0000000000000000000000000000000000000000'
      )})
      await waitForTxReceipt(hash.hash);
      refetch()
    } catch (error) {
    } finally {
      setCancelAllLoading(false);
    }
  };

  return (
    <>
      <div className="orders-header">
        <div className="orders-header-title">{t('openOrders')}</div>
        {orders && orders.length > 0 && (
          <button
            className="orders-cancel-all"
            onClick={cancelAllOrders}
            type="button"
            disabled={cancelAllLoading}
          >
            {cancelAllLoading ? <div className="orders-cancel-all-spinner"></div> : t('cancelAll')}
          </button>
        )}
      </div>

      {orders && orders.length > 0 ? (
        <div className="orders-table-body">
          {orders.map((order, index) => {
            if (!order || !order[4] || !markets[order[4]]) return null;
            
            const market = markets[order[4]];
            const filledPercent =
              order[7] && order[2] ? (order[7] / order[2]) * 100 : 0;
            const isBuy = order[3] === 1;
            const value = order[2] / 10 ** Number(market.baseDecimals)
            
            const orderKey = order[0].toString();

            return (
              <div key={`order-${index}`} className="order-row">
                <div className="order-market">
                  <span
                    className={`direction-indicator ${isBuy ? 'buy' : 'sell'}`}
                  >
                    {isBuy ? t('buy') : t('sell')}
                  </span>
                </div>
                <div className="order-market">
                  {market.baseAsset}
                  {market.quoteAsset}
                </div>
                <div className="simple-order-value">
                  {(order[0]/Number(market.priceFactor)).toFixed(Math.floor(Math.log10(Number(market.priceFactor))))}
                </div>
                <div className="simple-order-value">
                  {customRound(value, 3) + ' ' + market.baseAsset}
                </div>
                <div className="order-filled">
                  <div className="simple-progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${filledPercent}%`,
                        backgroundColor: isBuy ? '#50f08dde' : '#ff6c6c',
                      }}
                    ></div>
                  </div>
                </div>
                <div
                  className={`simple-cancel-button ${loadingOrders[orderKey] ? 'signing' : ''}`}
                  onClick={loadingOrders[orderKey] ? () => {} : () => handleCancelOrder(order)}
                >
                  {loadingOrders[orderKey] ? (
                    <div className="spinner"></div>
                  ) : (
                    '✕'
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-orders-message">{t('noOpenOrders')}</div>
      )}
    </>
  );
};

export default SimpleOrdersContainer;