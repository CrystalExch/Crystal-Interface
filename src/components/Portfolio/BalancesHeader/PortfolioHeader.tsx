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
      <div className="portfolio-column">
        <SortableHeaderCell
          columnKey="assets"
          sortColumn={effectiveSortConfig.column}
          sortOrder={effectiveSortConfig.direction}
          onSort={handleSort}
        >
          {t('assets')}
        </SortableHeaderCell>
      </div>
      <div className="portfolio-column">
        <SortableHeaderCell
          columnKey="balance"
          sortColumn={effectiveSortConfig.column}
          sortOrder={effectiveSortConfig.direction}
          onSort={handleSort}
        >
          {t('bal')}
        </SortableHeaderCell>
      </div>
      <div className="portfolio-column">
        <SortableHeaderCell
          columnKey="price"
          sortColumn={effectiveSortConfig.column}
          sortOrder={effectiveSortConfig.direction}
          onSort={handleSort}
        >
          {t('price')}
        </SortableHeaderCell>
      </div>
      <div className="portfolio-column">{t('actions')}</div>
    </div>
  );
};

export default PortfolioHeader;
