// Path: store/faqs.ts
import { create } from "zustand";
import {
  getFaqs,
  getFaqCategories,
  createFaq,
  updateFaq,
  deleteFaq,
} from "@/lib/api/voiceAssistantApi";
import type { FaqItem } from "@/lib/types";

type Store = {
  q: string;
  category: string;

  rows: FaqItem[];
  categories: string[];

  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  lastKey: string | null;

  modalOpen: boolean;
  editing: FaqItem | null;

  setQuery: (v: string) => void;
  setCategory: (v: string) => void;

  openCreate: () => void;
  openEdit: (faq: FaqItem) => void;
  closeModal: () => void;

  refresh: () => Promise<void>;
  save: (payload: { question: string; answer: string; category?: string }) => Promise<void>;
  deactivate: (id: string | number) => Promise<void>;
};

const CACHE_TTL_MS = 8000;

function makeKey(category: string): string {
  return `category=${category || ""}`;
}

export const useFaqsStore = create<Store>((set, get) => ({
  q: "",
  category: "",

  rows: [],
  categories: [],

  loading: false,
  error: null,
  lastFetchedAt: null,
  lastKey: null,

  modalOpen: false,
  editing: null,

  setQuery: (v) => set({ q: v }),
  setCategory: (v) => set({ category: v }),

  openCreate: () => set({ modalOpen: true, editing: null }),
  openEdit: (faq) => set({ modalOpen: true, editing: faq }),
  closeModal: () => set({ modalOpen: false }),

  refresh: async () => {
    const { category, lastFetchedAt, lastKey } = get();
    const key = makeKey(category);

    if (lastFetchedAt && lastKey === key && Date.now() - lastFetchedAt < CACHE_TTL_MS) {
      return;
    }

    // stale-while-refresh: keep rows while fetching
    set({ loading: true, error: null });
    try {
      const [listRes, catRes] = await Promise.all([
        getFaqs(category ? { category } : undefined),
        getFaqCategories(),
      ]);

      set({
        rows: listRes.data,
        categories: catRes.data,
        loading: false,
        error: null,
        lastFetchedAt: Date.now(),
        lastKey: key,
      });
    } catch (e: unknown) {
      // keep existing rows on error
      set({
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  },

  save: async (payload) => {
    const { editing } = get();
    set({ loading: true, error: null });

    try {
      if (editing) {
        await updateFaq(editing.id as string, {
          questionPattern: payload.question,
          answer: payload.answer,
          category: payload.category,
          isActive: true,
        });
      } else {
        await createFaq({
          questionPattern: payload.question,
          answer: payload.answer,
          answerShort: payload.answer.length > 140 ? `${payload.answer.slice(0, 137)}…` : payload.answer,
          category: payload.category,
          priority: 50,
          isActive: true,
        });
      }
      set({ modalOpen: false, editing: null });
      await get().refresh();
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
      return;
    } finally {
      set({ loading: false });
    }
  },

  deactivate: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteFaq(String(id));
      await get().refresh();
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
      return;
    } finally {
      set({ loading: false });
    }
  },
}));
