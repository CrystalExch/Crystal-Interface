import React from 'react';
import TooltipLabel from '../../../components/TooltipLabel/TooltipLabel.tsx';
import SortableHeaderCell from '../SortableHeaderCell/SortableHeaderCell';
import PerpsPositionItem from './PerpsPositionsItem';
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
        <div className="ghost" />
        <SortableHeaderCell
          columnKey="coin"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('coin')}
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
          columnKey="positionValue"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('positionValue')}
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
          {t('entryPrice')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="markPrice"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('markPrice')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="pnl"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('pnl')}
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
          {t('liqPrice')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="margin"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          {t('margin')}
        </SortableHeaderCell>
        <SortableHeaderCell
          columnKey="funding"
          sortColumn={sortColumn}
          sortOrder={sortOrder}
          onSort={handleSort}
        >
          <TooltipLabel
            label={t('funding')}
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