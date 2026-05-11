import { create } from "zustand";

type SortDir = "asc" | "desc";

type UIState = {
  dateFrom?: string;
  dateTo?: string;
  status?: string;

  sortField?: string;
  sortDir: SortDir;

  setFilters: (p: Partial<Pick<UIState, "dateFrom" | "dateTo" | "status">>) => void;
  setSort: (field: string) => void;
};

export const useUIStore = create<UIState>((set, get) => ({
  sortDir: "desc",
  setFilters: (p) => set(p),
  setSort: (field) => {
    const { sortField, sortDir } = get();
    if (sortField === field) set({ sortDir: sortDir === "asc" ? "desc" : "asc" });
    else set({ sortField: field, sortDir: "asc" });
  },
}));
