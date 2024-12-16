import axios from "axios";
import { ActionContext } from "vuex";
import { DocFile, FilesState, RootState } from "@/types";

const state: FilesState = {
  items: [],
  nextPageToken: null,
  loading: false,
};

const mutations = {
  SET_FILES(
    state: FilesState,
    payload: { files: DocFile[]; nextPageToken: string | null }
  ) {
    state.items = payload.files;
    state.nextPageToken = payload.nextPageToken;
  },
  SET_LOADING(state: FilesState, loading: boolean) {
    state.loading = loading;
  },
};

const actions = {
  async fetchFiles(
    { commit, state }: ActionContext<FilesState, RootState>,
    {
      page,
      textQuery,
      modifiedAfter,
    }: { page: number; textQuery?: string; modifiedAfter?: string }
  ) {
    commit("SET_LOADING", true);
    try {
      const response = await axios.get("/files", {
        params: {
          pageToken: page > 1 ? state.nextPageToken : undefined,
          pageSize: 10,
          query: textQuery,
          modifiedAfter,
        },
      });
      commit("SET_FILES", {
        files: response.data.files,
        nextPageToken: response.data.nextPageToken,
      });
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async deleteFile(
    { dispatch }: ActionContext<FilesState, RootState>,
    fileId: string
  ) {
    await axios.delete(`/files/${fileId}`);
    dispatch("fetchFiles", { page: 1 });
  },

  async editFile(
    { dispatch }: ActionContext<FilesState, RootState>,
    { fileId, data }: { fileId: string; data: Partial<DocFile> }
  ) {
    await axios.patch(`/files/${fileId}`, data);
    dispatch("fetchFiles", { page: 1 });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
