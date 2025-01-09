import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ContentData } from '../types';
import { formatDate, getBannerUrl, getIconUrl } from '../utils/formatters';
import { ReleaseTimer } from './ReleaseTimer';

interface HomePageProps {
  data: ContentData;
}

interface ContentSection {
  title: string;
  items: any[];
  type: 'banner' | 'icon';
}

export function HomePage({ data }: HomePageProps) {
  const { t } = useTranslation();
  const now = new Date();
  const [screenSize, setScreenSize] = useState(getInitialScreenSize());

  function getInitialScreenSize() {
    if (typeof window === 'undefined') return 'lg';
    const width = window.innerWidth;
    if (width < 640) return 'sm';
    if (width < 1024) return 'md';
    return 'lg';
  }

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 640 && screenSize !== 'sm') setScreenSize('sm');
      else if (width >= 640 && width < 1024 && screenSize !== 'md') setScreenSize('md');
      else if (width >= 1024 && screenSize !== 'lg') setScreenSize('lg');
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [screenSize]);

  const getItemCount = (type: 'banner' | 'icon') => {
    if (type === 'banner') {
      return screenSize === 'sm' ? 3 : screenSize === 'md' ? 4 : 6;
    }
    return screenSize === 'sm' ? 4 : screenSize === 'md' ? 6 : 8;
  };

  const getCounts = () => ({
    missingTitles: Object.keys(data['missing-titles']).length,
    missingDlcs: Object.keys(data['missing-dlcs']).length,
    missingUpdates: Object.keys(data['missing-updates']).length,
    missingOldUpdates: Object.values(data['missing-old-updates']).flat().length,
  });

  const counts = getCounts();
  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);

  const processItems = (items: any[], key = 'Release Date') => {
    return Object.entries(items)
      .map(([id, item]: [string, any]) => ({ id, ...item }))
      .sort((a, b) => new Date(a[key]).getTime() - new Date(b[key]).getTime());
  };

  const sections: ContentSection[] = [
    {
      title: 'Games',
      items: processItems(data['missing-titles']),
      type: 'banner'
    },
    {
      title: 'Updates',
      items: processItems(data['missing-updates']),
      type: 'icon'
    },
    {
      title: 'DLCs',
      items: processItems(data['missing-dlcs']),
      type: 'icon'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-4 sm:p-6">
          <h2 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 transition-colors" onClick={() => window.location.search = '?tab=missing-titles'}>
            {t('home.title')}
          </h2>
          <p className="text-blue-600 dark:text-blue-300 mb-6">
            {t('home.description')} <a href="https://nx-content.ghostland.at" target="_blank" rel="noopener noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline">nx-content.ghostland.at</a>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('home.stats.totalItems')}</h3>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalItems}</p>
            </div>
            {Object.entries(counts).map(([key, count]) => (
              <div 
                key={key} 
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => window.location.search = `?tab=missing-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`}
              >
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t(`home.stats.${key}`)}
                </h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.location.search = '?tab=missing-titles'}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {t('home.viewAll')}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          {t('home.about.title')}
        </h2>
        <p className="text-blue-600 dark:text-blue-300">
          {t('home.about.description')}
        </p>
      </div>

      {sections.map(section => {
        const recentItems = section.items
          .filter(item => new Date(item['Release Date']) <= now)
          .slice(-getItemCount(section.type))
          .reverse();

        const upcomingItems = section.items
          .filter(item => new Date(item['Release Date']) > now)
          .slice(0, getItemCount(section.type));

        if (recentItems.length === 0 && upcomingItems.length === 0) {
          return null;
        }

        return (
          <div key={section.title} className="space-y-6">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
              <h2 
                className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => window.location.search = `?tab=missing-${section.title.toLowerCase()}`}
              >
                {section.title}
              </h2>
            </div>

            {/* Recent Items */}
            {recentItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {t('home.sections.latestReleases')}
                </h3>
                <div className={`grid gap-4 ${
                  section.type === 'banner' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                }`}>
                  {recentItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {section.type === 'banner' ? (
                      <img
                        src={getBannerUrl(item.id)}
                        alt={item['Title Name']}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="p-4 flex justify-center">
                        <img
                          src={getIconUrl(item.id)}
                          alt={item['Title Name'] || item.dlc_name || item['Game Name']}
                          className="w-16 h-16 sm:w-20 sm:h-20 lg:w-32 lg:h-32 rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {item['Title Name'] || item.dlc_name || item['Game Name']}
                      </h4>
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-1">
                        {item.id}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(item['Release Date'])}
                        </p>
                        <ReleaseTimer releaseDate={item['Release Date']} />
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* Upcoming Items */}
            {upcomingItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {t('home.sections.comingSoon')}
                </h3>
                <div className={`grid gap-4 ${
                  section.type === 'banner' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                }`}>
                  {upcomingItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {section.type === 'banner' ? (
                      <img
                        src={getBannerUrl(item.id)}
                        alt={item['Title Name']}
                        className="w-full h-40 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="p-4 flex justify-center">
                        <img
                          src={getIconUrl(item.id)}
                          alt={item['Title Name'] || item.dlc_name || item['Game Name']}
                          className="w-16 h-16 sm:w-20 sm:h-20 lg:w-32 lg:h-32 rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {item['Title Name'] || item.dlc_name || item['Game Name']}
                      </h4>
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-1">
                        {item.id}
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(item['Release Date'])}
                        </p>
                        <ReleaseTimer releaseDate={item['Release Date']} />
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}