import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  drawerOpen: boolean;
  darkMode: boolean;
  sidebarCollapsed: boolean;
  setDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      drawerOpen: false,
      darkMode: false,
      sidebarCollapsed: false,
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
      setDarkMode: (enabled) => {
        document.documentElement.classList.toggle("dark", enabled);
        set({ darkMode: enabled });
      },
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          document.documentElement.classList.toggle("dark", next);
          return { darkMode: next };
        }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: "namrent-ui",
      partialize: (s) => ({ darkMode: s.darkMode, sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
);
