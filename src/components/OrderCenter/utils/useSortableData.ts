import { useState } from 'react';

export function useSortableData(
  trades: any,
  items: any[],
  getValue: (item: any, column: string, trades: any) => any,
) {
  const [sortColumn, setSortColumn] = useState<string>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const sortedItems = (() => {
    const sorted = [...items].sort((a, b) => {
      let comparison = 0;

      const aValue = getValue(a, sortColumn, trades);
      const bValue = getValue(b, sortColumn, trades);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue - bValue;
      }

      if (comparison !== 0) {
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      const aTime = getValue(a, 'time', trades);
      const bTime = getValue(b, 'time', trades);
      const timeComparison = aTime - bTime;
    
      return sortOrder === 'asc' ? timeComparison : -timeComparison;
    });

    return sorted;
  })();

  return {
    sortedItems,
    sortColumn,
    sortOrder,
    handleSort,
  };
}
