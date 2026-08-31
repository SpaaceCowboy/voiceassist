export const BOOKMARKS_KEY = "termAcademy.bookmarks";
export const HISTORY_KEY = "termAcademy.history";

export type LocalSavedArticle = { slug: string; title: string; progress: number; visitedAt: string };

export function readLocalLibrary(key: string): LocalSavedArticle[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function syncLocalLibrary() {
  await import("./api").then(({ api }) => api.syncReaderLibrary(readLocalLibrary(BOOKMARKS_KEY), readLocalLibrary(HISTORY_KEY)));
}
