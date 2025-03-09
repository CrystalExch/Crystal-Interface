import React, { forwardRef } from 'react';
import { VariableSizeList as List } from 'react-window';

import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';
import TradeHistoryItem from './TradeHistoryItem';

import { getTradeValue, useSortableData } from '../utils';

import './TradeHistoryContent.css';

interface TradeHistoryContentProps {
  tradehistory: any[];
}

const TradeHistoryContent: React.FC<TradeHistoryContentProps> = ({
  tradehistory,
}) => {
  const { sortedItems, sortColumn, sortOrder, handleSort } = useSortableData(
    tradehistory,
    (trade: any, column: string) => getTradeValue(trade, column, markets),
  );

  const InnerElement = forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
  >((props, ref) => (
    <div ref={ref} {...props}>
      <div className="trade-history-oc-header">
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
          columnKey="oc-price"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('price')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="time"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('time')}
        </SortableHeaderCell>
        <div className="oc-cell view">{t('view')}</div>
      </div>
      {props.children}
    </div>
  ));

  return (
    <div className="trades-content-wrapper">
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
              <TradeHistoryItem
                key={`${item[4]}-${item[0]}-${item[1]}-${index - 1}`}
                trade={item}
                market={markets[item[4]]}
              />
            </div>
          );
        }}
      </List>
    </div>
  );
};

export default TradeHistoryContent;
