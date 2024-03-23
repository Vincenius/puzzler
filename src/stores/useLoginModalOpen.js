import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// the store itself does not need any change
export const useLoginModalOpen = create(
  persist(
    (set, get) => ({
      isOpen: false,
      setIsOpen: (open) => set(() => ({ isOpen: open })),
    }),
    {
      name: 'login-modal',
    },
  ),
)
