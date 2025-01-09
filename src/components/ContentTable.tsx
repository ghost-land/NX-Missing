import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowUpDown, Home, X } from 'lucide-react';
import { TableType } from '../types';
import { DateFilter } from './DateFilter';
import { ReleaseTimer } from './ReleaseTimer';
import { formatDate, formatSize, getIconUrl } from '../utils/formatters';

interface ContentTableProps {
  type: TableType;
  data: any;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ContentTable({ type, data, searchQuery, onSearchChange }: ContentTableProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'icon', label: t('table.columns.icon'), sortable: false },
      { key: 'id', label: t('table.columns.id'), sortable: true }
    ];

    const typeSpecificColumns = {
      'missing-titles': [
        { key: 'Title Name', label: t('table.columns.name'), sortable: true },
        { key: 'Release Date', label: t('table.columns.releaseDate'), sortable: true },
        { key: 'size', label: t('table.columns.size'), sortable: true }
      ],
      'missing-dlcs': [
        { key: 'dlc_name', label: t('table.columns.name'), sortable: true },
        { key: 'base_game', label: t('table.columns.baseGame'), sortable: true },
        { key: 'Release Date', label: t('table.columns.releaseDate'), sortable: true },
        { key: 'size', label: t('table.columns.size'), sortable: true }
      ],
      'missing-updates': [
        { key: 'Game Name', label: t('table.columns.game'), sortable: true },
        { key: 'Version', label: t('table.columns.version'), sortable: true },
        { key: 'Release Date', label: t('table.columns.releaseDate'), sortable: true }
      ],
      'missing-old-updates': [
        { key: 'Version', label: t('table.columns.version'), sortable: true },
        { key: 'Release Date', label: t('table.columns.releaseDate'), sortable: true }
      ]
    };

    return [...baseColumns, ...typeSpecificColumns[type]];
  }, [type, t]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    const items = type === 'missing-old-updates'
      ? Object.values(data).flat()
      : Object.values(data);

    items.forEach((item: any) => {
      const year = new Date(item['Release Date']).getFullYear().toString();
      years.add(year);
    });

    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [data, type]);

  const filteredAndSortedData = useMemo(() => {
    let items = type === 'missing-old-updates'
      ? Object.entries(data).flatMap(([id, versions]) => 
          (versions as any[]).map(version => ({ id, ...version }))
        )
      : Object.entries(data).map(([id, item]) => ({ id, ...item }));

    // Apply date filters
    if (selectedYear || selectedMonth) {
      items = items.filter(item => {
        const date = new Date(item['Release Date']);
        const itemYear = date.getFullYear().toString();
        const itemMonth = (date.getMonth() + 1).toString().padStart(2, '0');

        if (selectedYear && itemYear !== selectedYear) {
          return false;
        }
        if (selectedMonth && itemMonth !== selectedMonth) {
          return false;
        }
        return true;
      });
    }

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
  }, [data, searchQuery, sortConfig, type, selectedYear, selectedMonth]);

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
        <button
          onClick={() => window.location.search = '?tab=home'}
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={t('table.home.backToHome')}
        >
          <Home className="h-5 w-5 mr-2" />
          <span>{t('table.home.title')}</span>
        </button>
        
        <div className="relative flex-grow mx-4">
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            title="Effacer la recherche"
            style={{ display: searchQuery ? 'block' : 'none' }}
          >
            <X className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('table.search')}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
        </div>

        <DateFilter
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
          availableYears={availableYears}
        />
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
                        ? (
                          <div className="space-y-1">
                            <div>{formatDate(item[column.key])}</div>
                            <ReleaseTimer releaseDate={item[column.key]} />
                          </div>
                        )
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
        <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value={10}>{t('table.pagination.perPage', { count: 10 })}</option>
            <option value={20}>{t('table.pagination.perPage', { count: 20 })}</option>
            <option value={50}>{t('table.pagination.perPage', { count: 50 })}</option>
            <option value={-1}>{t('table.pagination.perPage', { count: 'All' })}</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-0 sm:mr-2">
            {t('table.pagination.page', { current: currentPage, total: totalPages })}
          </span>
          <div className="flex items-center justify-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-l-md disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {t('table.pagination.first')}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border-y border-l border-gray-300 dark:border-gray-600 disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {t('table.pagination.previous')}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border-y border-l border-gray-300 dark:border-gray-600 disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {t('table.pagination.next')}
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-r-md disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {t('table.pagination.last')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}