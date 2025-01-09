import { format } from 'date-fns';
import { enUS, fr, es, de, ja, pt, ko, ru } from 'date-fns/locale';
import i18next from 'i18next';

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

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  // Validate date string
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }

  const currentLocale = locales[i18next.language] || enUS;
  return format(date, 'PP', {
    locale: currentLocale,
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatSize = (bytes: number): string => {
  if (!bytes) return 'N/A';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const getBaseTitleId = (titleId: string): string => {
  // For base titles (ending in 000), return as is
  if (titleId.endsWith('000')) {
    return titleId;
  }

  // For updates (ending in 800), use the base title ID
  if (titleId.endsWith('800')) {
    return titleId.slice(0, -3) + '000';
  }

  // For DLCs, change the fourth-to-last digit and set last 3 digits to 000
  const fourthFromEnd = titleId.charAt(titleId.length - 4);
  const prevChar = (char: string): string => {
    if (char >= '1' && char <= '9') return String(parseInt(char) - 1);
    if (char >= 'b' && char <= 'z') return String.fromCharCode(char.charCodeAt(0) - 1);
    if (char >= 'B' && char <= 'Z') return String.fromCharCode(char.charCodeAt(0) - 1);
    return char;
  };
  return titleId.slice(0, -4) + prevChar(fourthFromEnd) + '000';
};

export const getIconUrl = (titleId: string): string => {
  return `https://api.nlib.cc/nx/${getBaseTitleId(titleId)}/icon/128/128`;
};

export const getBannerUrl = (titleId: string): string => {
  return `https://api.nlib.cc/nx/${getBaseTitleId(titleId)}/banner/1280/720`;
};