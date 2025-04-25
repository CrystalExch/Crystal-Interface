import React from 'react';

import SortableHeaderCell from '../../OrderCenter/SortableHeaderCell/SortableHeaderCell';

import './PortfolioHeader.css';

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface PortfolioHeaderProps {
  onSort: (config: SortConfig) => void;
  sortConfig: SortConfig;
}

const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
  onSort,
  sortConfig,
}) => {
  const effectiveSortConfig = sortConfig ?? {
    column: 'name',
    direction: 'asc',
  };

  const handleSort = (column: string) => {
    const direction =
      effectiveSortConfig.column === column &&
      effectiveSortConfig.direction === 'asc'
        ? 'desc'
        : 'asc';
    onSort({ column, direction });
  };

  return (
    <div className="portfolio-header">
      <SortableHeaderCell
        columnKey="assets"
        sortColumn={effectiveSortConfig.column}
        sortOrder={effectiveSortConfig.direction}
        onSort={handleSort}
      >
        {t('assets')}
      </SortableHeaderCell>
      <SortableHeaderCell
        columnKey="balance"
        sortColumn={effectiveSortConfig.column}
        sortOrder={effectiveSortConfig.direction}
        onSort={handleSort}
      >
        {t('bal')}
      </SortableHeaderCell>
      <SortableHeaderCell
        columnKey="price"
        sortColumn={effectiveSortConfig.column}
        sortOrder={effectiveSortConfig.direction}
        onSort={handleSort}
      >
        {t('price')}
      </SortableHeaderCell>
      <div className="oc-cell actions">{t('actions')}</div>
    </div>
  );
};

export default PortfolioHeader;
