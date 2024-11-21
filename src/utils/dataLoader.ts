import { ContentData } from '../types';

const getDataUrl = (filename: string) => {
  return `/data/${filename}`;
};

export const loadData = async (): Promise<ContentData> => {
  try {
    const [titlesResponse, dlcsResponse, updatesResponse, oldUpdatesResponse] = await Promise.all([
      fetch(getDataUrl('missing-titles.txt')),
      fetch(getDataUrl('missing-dlcs.txt')),
      fetch(getDataUrl('missing-updates.txt')),
      fetch(getDataUrl('missing-old-updates.json'))
    ]);

    const checkResponse = async (response: Response, filename: string) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}: ${response.status} ${response.statusText}`);
      }
      return response;
    };

    await Promise.all([
      checkResponse(titlesResponse, 'missing-titles.txt'),
      checkResponse(dlcsResponse, 'missing-dlcs.txt'),
      checkResponse(updatesResponse, 'missing-updates.txt'),
      checkResponse(oldUpdatesResponse, 'missing-old-updates.json')
    ]);

    const [titlesText, dlcsText, updatesText, oldUpdatesJson] = await Promise.all([
      titlesResponse.text(),
      dlcsResponse.text(),
      updatesResponse.text(),
      oldUpdatesResponse.text()
    ]);

    let oldUpdates;
    try {
      oldUpdates = JSON.parse(oldUpdatesJson);
    } catch (e) {
      throw new Error('Failed to parse missing-old-updates.json: Invalid JSON format');
    }

    if (!titlesText?.trim() || !dlcsText?.trim() || !updatesText?.trim() || !oldUpdates) {
      throw new Error('One or more data files are empty or invalid');
    }

    return {
      'missing-titles': parseTxtFile(titlesText, 'titles'),
      'missing-dlcs': parseTxtFile(dlcsText, 'dlcs'),
      'missing-updates': parseTxtFile(updatesText, 'updates'),
      'missing-old-updates': oldUpdates
    };
  } catch (error) {
    console.error('Error loading data:', error);
    throw error instanceof Error ? error : new Error('Failed to load data');
  }
};

const parseTxtFile = (content: string, type: 'titles' | 'dlcs' | 'updates') => {
  if (!content?.trim()) {
    return {};
  }

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
            'Title Name': name,
            size: parseInt(size, 10) || 0
          };
        }
        break;

      case 'dlcs':
        if (parts.length === 5) {
          const [id, date, name, baseGame, size] = parts;
          result[id] = {
            'Release Date': date,
            dlc_name: name,
            base_game: baseGame,
            size: parseInt(size, 10) || 0
          };
        }
        break;

      case 'updates':
        if (parts.length === 4) {
          const [id, name, version, date] = parts;
          result[id] = {
            'Game Name': name,
            Version: version,
            'Release Date': date
          };
        }
        break;
    }
  });

  return result;
};