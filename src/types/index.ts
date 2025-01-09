export interface DLCContent {
  'Release Date': string;
  dlc_name: string;
  base_game: string;
  size: number;
}

export interface TitleContent {
  'Release Date': string;
  'Title Name': string;
  size: number;
}

export interface UpdateContent {
  'Game Name': string;
  Version: string;
  'Release Date': string;
}

export interface OldUpdateVersion {
  Version: string;
  'Release Date': string;
}

export interface ContentData {
  'missing-titles': Record<string, TitleContent>;
  'missing-dlcs': Record<string, DLCContent>;
  'missing-updates': Record<string, UpdateContent>;
  'missing-old-updates': Record<string, OldUpdateVersion[]>;
  'home': never;
}

export type TableType = keyof ContentData;

export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  render?: (value: any) => React.ReactNode;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}