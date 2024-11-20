import { ContentData } from '../types';

export const loadData = async (): Promise<ContentData> => {
  try {
    const [titlesResponse, dlcsResponse, updatesResponse, oldUpdatesResponse] = await Promise.all([
      fetch('/missing-titles.txt'),
      fetch('/missing-dlcs.txt'),
      fetch('/missing-updates.txt'),
      fetch('/missing-old-updates.json')
    ]);

    if (!titlesResponse.ok || !dlcsResponse.ok || !updatesResponse.ok || !oldUpdatesResponse.ok) {
      throw new Error('Failed to load one or more data files');
    }

    const [titlesText, dlcsText, updatesText] = await Promise.all([
      titlesResponse.text(),
      dlcsResponse.text(),
      updatesResponse.text()
    ]);

    const oldUpdates = await oldUpdatesResponse.json();

    return {
      'missing-titles': parseTxtFile(titlesText, 'titles'),
      'missing-dlcs': parseTxtFile(dlcsText, 'dlcs'),
      'missing-updates': parseTxtFile(updatesText, 'updates'),
      'missing-old-updates': oldUpdates
    };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
};

const parseTxtFile = (content: string, type: 'titles' | 'dlcs' | 'updates') => {
  const lines = content.trim().split('\n').filter(line => line.trim());
  const result: Record<string, any> = {};

  lines.forEach(line => {
    const parts = line.split('|').map(part => part.trim());
    
    switch (type) {
      case 'titles':
        if (parts.length === 4) {
          const [id, date, name, size] = parts;
          result[id] = {
            'Release Date': date,
            'Title Name': name.length > 50 ? name.substring(0, 47) + '...' : name,
            size: parseInt(size, 10) || 0
          };
        }
        break;

      case 'dlcs':
        if (parts.length === 5) {
          const [id, date, name, baseGame, size] = parts;
          result[id] = {
            'Release Date': date,
            dlc_name: name.length > 50 ? name.substring(0, 47) + '...' : name,
            base_game: baseGame.length > 50 ? baseGame.substring(0, 47) + '...' : baseGame,
            size: parseInt(size, 10) || 0
          };
        }
        break;

      case 'updates':
        if (parts.length === 4) {
          const [id, name, version, date] = parts;
          result[id] = {
            'Game Name': name.length > 50 ? name.substring(0, 47) + '...' : name,
            Version: version,
            'Release Date': date
          };
        }
        break;
    }
  });

  return result;
};