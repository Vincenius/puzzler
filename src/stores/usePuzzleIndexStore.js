import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// the store itself does not need any change
export const usePuzzleIndexStore = create(
  persist(
    (set, get) => ({
      puzzleIndex: 0,
      setPuzzleIndex: (i) => set(() => ({ puzzleIndex: i })),
    }),
    {
      name: 'puzzle-index',
    },
  ),
)
