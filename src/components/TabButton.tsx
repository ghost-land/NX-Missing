import React from 'react';
import { useTranslation } from 'react-i18next';
import { TableType } from '../types';
import clsx from 'clsx';

interface TabButtonProps {
  type: TableType;
  active: boolean;
  count: number;
  onClick: () => void;
  label: string;
}

export function TabButton({ type, active, count, onClick }: TabButtonProps) {
  const { t } = useTranslation();
  
  const getLabel = (type: TableType) => {
    switch (type) {
      case 'missing-titles':
        return t('home.stats.missingTitles');
      case 'missing-dlcs':
        return t('home.stats.missingDlcs');
      case 'missing-updates':
        return t('home.stats.missingUpdates');
      case 'missing-old-updates':
        return t('home.stats.missingOldUpdates');
      default:
        return type;
    }
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ease-in-out',
        active
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      )}
    >
      {getLabel(type)}
      <span className={clsx(
        'ml-2 px-2 py-0.5 rounded-full bg-opacity-20 text-xs font-semibold inline-block',
        active ? 'bg-white text-white' : 'bg-blue-100 text-blue-600'
      )}>
        {count}
      </span>
    </button>
  );
}