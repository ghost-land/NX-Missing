import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { TableColumn, SortConfig } from '../types';
import clsx from 'clsx';

interface TableHeaderProps {
  columns: TableColumn[];
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
}

export function TableHeader({ columns, sortConfig, onSort }: TableHeaderProps) {
  return (
    <thead className="bg-gray-50">
      <tr>
        {columns.map((column, index) => (
          <th
            key={index}
            onClick={() => column.sortable && onSort(column.key)}
            className={clsx(
              'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
              column.sortable && 'cursor-pointer hover:bg-gray-100'
            )}
          >
            <div className="flex items-center gap-1">
              {column.label}
              {column.sortable && (
                <ArrowUpDown className={clsx(
                  'h-4 w-4',
                  sortConfig?.key === column.key && 'text-blue-600'
                )} />
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}