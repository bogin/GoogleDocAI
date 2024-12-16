export interface Owner {
  displayName: string;
}

export interface File {
  id: string;
  name: string;
  size: number;
  modifiedTime: string;
  owners: Owner[];
}

export interface FilesState {
  items: File[];
  currentFile: File | null;
  nextPageToken: string | null;
  loading: boolean;
  error: string | null;
  pageSize: number;
  hasMore: boolean;
}

export interface RootState {
  files: FilesState;
}
