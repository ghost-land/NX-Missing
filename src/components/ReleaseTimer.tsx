import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, isPast, isToday, isValid, formatDistance } from 'date-fns';
import { enUS, fr, es, de, ja, pt, ko, ru } from 'date-fns/locale';
import { Clock, CheckCircle2, Timer } from 'lucide-react';

interface ReleaseTimerProps {
  releaseDate: string;
}

const locales: { [key: string]: Locale } = {
  en: enUS,
  fr: fr,
  es: es,
  de: de,
  ja: ja,
  pt: pt,
  ko: ko,
  ru: ru
};
export function ReleaseTimer({ releaseDate }: ReleaseTimerProps) {
  const { t, i18n } = useTranslation();
  const currentLocale = locales[i18n.language] || enUS;

  // Ensure releaseDate is a valid date string
  if (!releaseDate) {
    return <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('releaseTimer.noDate')}</span>;
  }

  let date: Date;
  try {
    date = new Date(releaseDate);
    if (!isValid(date)) {
      return <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('releaseTimer.invalidDate')}</span>;
    }
  } catch (error) {
    return <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('releaseTimer.invalidDate')}</span>;
  }

  const isReleased = isPast(date);
  const isReleasedToday = isToday(date);

  let color = '';
  let Icon = Timer;
  let timeText = '';

  if (isReleasedToday) {
    color = 'text-gray-600 dark:text-gray-400';
    Icon = CheckCircle2;
    timeText = '0d';
  } else if (isReleased) {
    color = 'text-red-600 dark:text-red-400';
    Icon = Clock;
    timeText = formatDistanceToNow(date, { addSuffix: false, locale: currentLocale });
  } else {
    color = 'text-green-600 dark:text-green-400';
    Icon = Timer;
    timeText = formatDistanceToNow(date, { addSuffix: false, locale: currentLocale });
  }

  return (
    <span className={`text-sm font-medium ${color} inline-flex items-center gap-1`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs">{timeText}</span>
    </span>
  );
}