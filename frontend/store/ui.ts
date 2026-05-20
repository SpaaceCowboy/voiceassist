// Path: store/ui.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";
export type SidebarMode = "expanded" | "collapsed";

type UiState = {
  theme: ThemeMode;
  sidebar: SidebarMode;

  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;

  setSidebar: (v: SidebarMode) => void;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      sidebar: "expanded",

      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),

      setSidebar: (v) => set({ sidebar: v }),
      toggleSidebar: () =>
        set({ sidebar: get().sidebar === "expanded" ? "collapsed" : "expanded" }),
    }),
    { name: "ui-store" },
  ),
);