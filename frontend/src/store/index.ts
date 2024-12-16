import { createStore } from "vuex";
import files from "./modules/files";
import { RootState } from "@/types/files";

export default createStore<RootState>({
  modules: {
    files,
  },
});
