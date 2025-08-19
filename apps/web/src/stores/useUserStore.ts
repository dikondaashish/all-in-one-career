import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  profileImage?: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  updateAvatar: (avatarUrl: string) => void;
  updateProfileImage: (profileImage: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateAvatar: (avatarUrl) =>
    set((state) => ({
      user: state.user ? { ...state.user, avatarUrl } : null,
    })),
  updateProfileImage: (profileImage) =>
    set((state) => ({
      user: state.user ? { ...state.user, profileImage } : null,
    })),
  clearUser: () => set({ user: null }),
}));
