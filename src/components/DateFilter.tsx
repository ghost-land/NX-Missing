import React from 'react';
import { useTranslation } from 'react-i18next';

interface DateFilterProps {
  selectedYear: string;
  selectedMonth: string;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  availableYears: string[];
}

export function DateFilter({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  availableYears,
}: DateFilterProps) {
  const { t } = useTranslation();
  const months = [
    { value: '', label: t('table.filters.allMonths') },
    { value: '01', label: t('table.filters.months.1') },
    { value: '02', label: t('table.filters.months.2') },
    { value: '03', label: t('table.filters.months.3') },
    { value: '04', label: t('table.filters.months.4') },
    { value: '05', label: t('table.filters.months.5') },
    { value: '06', label: t('table.filters.months.6') },
    { value: '07', label: t('table.filters.months.7') },
    { value: '08', label: t('table.filters.months.8') },
    { value: '09', label: t('table.filters.months.9') },
    { value: '10', label: t('table.filters.months.10') },
    { value: '11', label: t('table.filters.months.11') },
    { value: '12', label: t('table.filters.months.12') }
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
      >
        <option value="">{t('table.filters.allYears')}</option>
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <select
        value={selectedMonth}
        onChange={(e) => onMonthChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
      >
        {months.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}