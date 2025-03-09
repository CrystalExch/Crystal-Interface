import React from 'react';

import SortArrow from '../SortArrow/SortArrow';

interface SortableHeaderCellProps {
  columnKey: string;
  sortColumn: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  children: React.ReactNode;
}

const SortableHeaderCell: React.FC<SortableHeaderCellProps> = ({
  columnKey,
  sortColumn,
  sortOrder,
  onSort,
  children,
}) => {
  const isSorted = sortColumn === columnKey;

  return (
    <div className={`oc-cell ${columnKey}`} onClick={() => onSort(columnKey)}>
      {children}
      <SortArrow
        sortDirection={isSorted ? sortOrder : undefined}
        onClick={() => onSort(columnKey)}
      />
    </div>
  );
};

export default SortableHeaderCell;
