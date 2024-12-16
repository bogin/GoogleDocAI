export interface DocFile {
  id: string;
  name: string;
  modifiedTime: string;
  owners: Array<{ displayName: string }>;
  size: number;
}

export interface FilesState {
  items: DocFile[];
  nextPageToken: string | null;
  loading: boolean;
}

export interface RootState {
  files?: FilesState;
}
