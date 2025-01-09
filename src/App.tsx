import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Database, Github, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ContentTable } from './components/ContentTable';
import { HomePage } from './components/HomePage';
import { TabButton } from './components/TabButton';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { TableType } from './types';
import { useDataLoader } from './hooks/useDataLoader';
import { useSearchParams } from './hooks/useSearchParams';
import pkg from '../package.json';

function App() {
  const { t } = useTranslation();
  const { searchParams, updateSearchParams } = useSearchParams();
  const activeTab = searchParams.tab || 'home';
  const searchQuery = searchParams.search || '';
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const { data, isLoading, error } = useDataLoader();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleTabChange = useCallback((tab: TableType) => {
    updateSearchParams({ tab });
  }, [updateSearchParams]);

  const handleSearchChange = useCallback((search: string) => {
    updateSearchParams({ search });
  }, [updateSearchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 dark:bg-red-900 rounded-lg p-6 mb-4">
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Error Loading Data</h1>
            <p className="text-red-600 dark:text-red-300">{error?.message || 'Failed to load data'}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getCounts = () => ({
    'missing-titles': Object.keys(data['missing-titles']).length,
    'missing-dlcs': Object.keys(data['missing-dlcs']).length,
    'missing-updates': Object.keys(data['missing-updates']).length,
    'missing-old-updates': Object.values(data['missing-old-updates']).flat().length,
  });

  const counts = getCounts();
  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 xl:px-0 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('app.title')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('app.version')} {pkg.version}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <a
                href="https://github.com/ghost-land/nx-missing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Github className="h-6 w-6" />
                <span className="hidden sm:inline">{t('app.viewOnGithub')}</span>
              </a>
            </div>
          </div>

          {activeTab === 'home' ? (
            <HomePage data={data} />
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-6 items-center">
                {Object.entries(counts).map(([type, count]) => (
                  <TabButton
                    key={type}
                    type={type as TableType}
                    active={activeTab === type}
                    count={count}
                    onClick={() => handleTabChange(type as TableType)}
                    label={type.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  />
                ))}
              </div>
              <ContentTable
                type={activeTab as Exclude<TableType, 'home'>}
                data={data[activeTab as Exclude<TableType, 'home'>]}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;