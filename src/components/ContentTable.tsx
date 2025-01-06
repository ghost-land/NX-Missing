import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowUpDown, ExternalLink } from 'lucide-react';
import { TableType } from '../types';
import { formatDate, formatSize, getIconUrl } from '../utils/formatters';

interface ContentTableProps {
  type: TableType;
  data: any;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ContentTable({ type, data, searchQuery, onSearchChange }: ContentTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'icon', label: 'Icon', sortable: false },
      { key: 'id', label: 'ID', sortable: true }
    ];

    const typeSpecificColumns = {
      'missing-titles': [
        { key: 'Title Name', label: 'Name', sortable: true },
        { key: 'Release Date', label: 'Release Date', sortable: true },
        { key: 'size', label: 'Size', sortable: true }
      ],
      'missing-dlcs': [
        { key: 'dlc_name', label: 'Name', sortable: true },
        { key: 'base_game', label: 'Base Game', sortable: true },
        { key: 'Release Date', label: 'Release Date', sortable: true },
        { key: 'size', label: 'Size', sortable: true }
      ],
      'missing-updates': [
        { key: 'Game Name', label: 'Game', sortable: true },
        { key: 'Version', label: 'Version', sortable: true },
        { key: 'Release Date', label: 'Release Date', sortable: true }
      ],
      'missing-old-updates': [
        { key: 'Version', label: 'Version', sortable: true },
        { key: 'Release Date', label: 'Release Date', sortable: true }
      ]
    };

    return [...baseColumns, ...typeSpecificColumns[type]];
  }, [type]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedData = useMemo(() => {
    let items = type === 'missing-old-updates'
      ? Object.entries(data).flatMap(([id, versions]) => 
          (versions as any[]).map(version => ({ id, ...version }))
        )
      : Object.entries(data).map(([id, item]) => ({ id, ...item }));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        Object.values(item).some(val => 
          val ? String(val).toLowerCase().includes(query) : false
        )
      );
    }

    if (sortConfig) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'size') {
          aVal = parseInt(aVal || '0', 10);
          bVal = parseInt(bVal || '0', 10);
        } else if (sortConfig.key === 'Release Date') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [data, searchQuery, sortConfig, type]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = itemsPerPage === -1 
    ? filteredAndSortedData 
    : filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
    
  // Reset current page when type changes or when total pages changes
  useEffect(() => {
    setCurrentPage(1);
  }, [type, totalPages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
        </div>
        <a
          href="https://nx-working.ghostland.at"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Working Content
        </a>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  onClick={() => column.sortable && handleSort(column.key)}
                  className={`px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && (
                      <ArrowUpDown className={`h-4 w-4 ${
                        sortConfig?.key === column.key ? 'text-blue-500 dark:text-blue-400' : ''
                      }`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((item: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <img 
                    src={getIconUrl(item.id)}
                    alt="Game Icon"
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    loading="lazy"
                  />
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-mono text-gray-900 dark:text-gray-100">
                  {item.id}
                </td>
                {columns.slice(2).map((column) => (
                  <td 
                    key={column.key} 
                    className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100"
                  >
                    <div className="max-w-[150px] sm:max-w-[200px] md:max-w-[300px] truncate" title={item[column.key]}>
                      {column.key === 'Release Date'
                        ? formatDate(item[column.key])
                        : column.key === 'size'
                          ? formatSize(item[column.key])
                          : item[column.key]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center w-full sm:w-auto">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={-1}>All</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}