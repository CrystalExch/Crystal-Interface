import React from 'react';
import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';
import PerpsPositionItem from './PerpsPositionItem';
import { useSortableData } from '../utils';
import './PerpsPositionContent.css';

interface PerpsPositionsContentProps {
  positions: any[];
  pageSize: number;
  currentPage: number;
  onMarketSelect: any;
  isBlurred?: boolean;
}

const PerpsPositionsContent: React.FC<PerpsPositionsContentProps> = ({
  positions,
  pageSize,
  currentPage,
  onMarketSelect,
  isBlurred
}) => {
  const { sortedItems, sortColumn, sortOrder, handleSort } = useSortableData(
    {},
    positions,
    (position: any, column: string) => {
      switch (column) {
        case 'coin': return position.symbol;
        case 'size': return position.size;
        case 'positionValue': return position.positionValue;
        case 'entryPrice': return position.entryPrice;
        case 'markPrice': return position.markPrice;
        case 'pnl': return position.pnl;
        case 'liqPrice': return position.liqPrice;
        case 'margin': return position.margin;
        case 'funding': return position.funding;
        default: return position[column];
      }
    },
  );

  const currentItems = sortedItems.length > 0 
    ? sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : [];

  return (
    <>
      <div className="perps-positions-header">
        <SortableHeaderCell
          columnKey="coin"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Coin')}
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
          columnKey="positionValue"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('Position Value')}
            tooltipText={
              <div>
                <div className="tooltip-description">
                  {t('totalValueOfPosition')}
                </div>
              </div>
            }
            className="position-value-label"
          />
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="entryPrice"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Entry Price')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="markPrice"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Mark Price')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="pnl"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('PNL (ROE %)')}
            tooltipText={
              <div>
                <div className="tooltip-description">
                  {t('profitAndLoss')}
                </div>
              </div>
            }
            className="pnl-label"
          />
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="liqPrice"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Liq. Price')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="margin"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Margin')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="funding"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('Funding')}
            tooltipText={
              <div>
                <div className="tooltip-description">
                  {t('fundingRate')}
                </div>
              </div>
            }
            className="funding-label"
          />
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="close"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('Close')}
        </SortableHeaderCell>
      </div>

      {currentItems.length > 0 ? (
        currentItems.map((item, index) => (
          <PerpsPositionItem
            key={`position-${index}`}
            position={item}
            onMarketSelect={onMarketSelect}
            isBlurred={isBlurred}
          />
        ))
      ) : null}
    </>
  );
};

export default React.memo(PerpsPositionsContent);