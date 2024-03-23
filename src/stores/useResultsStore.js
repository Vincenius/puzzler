import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// the store itself does not need any change
export const useResultsStore = create(
  persist(
    (set, get) => ({
      results: [],
      setResults: (val) => set(() => ({ results: val })),
    }),
    {
      name: 'results',
    },
  ),
)
