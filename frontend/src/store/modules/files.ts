import { Module, ActionContext } from "vuex";
import axios from "axios";
import { FilesState, RootState, File } from "@/types/files";

type FilesActionContext = ActionContext<FilesState, RootState>;

const files: Module<FilesState, RootState> = {
  namespaced: true,

  state: {
    items: [],
    currentFile: null,
    nextPageToken: null,
    loading: false,
    error: null,
    pageSize: 10,
    hasMore: true,
  },

  mutations: {
    SET_FILES(state, { files, nextPageToken }) {
      state.items = files;
      state.nextPageToken = nextPageToken;
      state.hasMore = !!nextPageToken;
    },
    APPEND_FILES(state, { files, nextPageToken }) {
      state.items = [...state.items, ...files];
      state.nextPageToken = nextPageToken;
      state.hasMore = !!nextPageToken;
    },
    SET_CURRENT_FILE(state, file: File) {
      state.currentFile = file;
    },
    SET_LOADING(state, status: boolean) {
      state.loading = status;
    },
    SET_ERROR(state, error: string | null) {
      state.error = error;
    },
  },

  actions: {
    async fetchFiles(
      { commit, state }: FilesActionContext,
      payload: {
        page: number;
        filters?: { modifiedAfter?: string; query?: string };
        nextPageToken: string;
        pageSize: number;
        loadMore: boolean;
      }
    ) {
      commit("SET_LOADING", true);
      try {
        const { loadMore } = payload;
        const response = await axios.post<{
          files: File[];
          nextPageToken: string;
        }>("/files", {
          pageToken: payload.page > 1 ? state.nextPageToken : undefined,
          pageSize: payload.pageSize,
          filters: payload.filters,
          nextPageToken: payload.nextPageToken,
        });
        console.log("loadMore", loadMore);
        if (loadMore) {
          commit("APPEND_FILES", response.data);
        } else {
          commit("SET_FILES", response.data);
        }
      } catch (error) {
        commit(
          "SET_ERROR",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchFileById({ commit }: FilesActionContext, fileId: string) {
      commit("SET_LOADING", true);
      try {
        const response = await axios.get<File>(`/files/${fileId}`);
        commit("SET_CURRENT_FILE", response.data);
      } catch (error) {
        commit(
          "SET_ERROR",
          error instanceof Error ? error.message : "Unknown error"
        );
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async deleteFile({ dispatch }: FilesActionContext, fileId: string) {
      await axios.delete(`/files/${fileId}`);
      return dispatch("fetchFiles", { page: 1 });
    },

    async updateFile(
      { dispatch }: FilesActionContext,
      payload: { fileId: string; data: Partial<File> }
    ) {
      await axios.patch(`/files/${payload.fileId}`, payload.data);
      return dispatch("fetchFiles", { page: 1 });
    },
  },
};

export default files;
