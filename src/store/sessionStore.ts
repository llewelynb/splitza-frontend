import { create } from 'zustand';
import type { SessionDetail, BillSummary, ParsedItem } from '../types';

interface SessionStore {
  // Active session being built
  activeSession: SessionDetail | null;
  // OCR results pending host review
  pendingOcrItems: ParsedItem[];
  // Final calculated summary
  billSummary: BillSummary | null;

  setActiveSession: (session: SessionDetail | null) => void;
  setPendingOcrItems: (items: ParsedItem[]) => void;
  setBillSummary: (summary: BillSummary | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  activeSession: null,
  pendingOcrItems: [],
  billSummary: null,

  setActiveSession: (session) => set({ activeSession: session }),
  setPendingOcrItems: (items) => set({ pendingOcrItems: items }),
  setBillSummary: (summary) => set({ billSummary: summary }),
  reset: () => set({ activeSession: null, pendingOcrItems: [], billSummary: null }),
}));
