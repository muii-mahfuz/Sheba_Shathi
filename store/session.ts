"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResult, Role, User } from "@/lib/types";

/**
 * Client-side session. In this frontend-first phase the token is a mock string
 * and the user id travels to the API in a header; when real auth lands, this
 * store keeps its shape and only the token's provenance changes.
 */
interface SessionState {
  token: string | null;
  user: User | null;
  /**
   * False until the persisted session has been read back. Route guards wait on
   * this — redirecting before rehydration bounces the reader to sign-in on
   * every refresh of an authenticated page.
   */
  hydrated: boolean;
  signIn: (result: AuthResult) => void;
  signOut: () => void;
  setUser: (user: User) => void;
  markHydrated: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hydrated: false,
      signIn: ({ token, user }) => set({ token, user }),
      signOut: () => set({ token: null, user: null }),
      setUser: (user) => set({ user }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "sheba-session",
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);

/** Read the signed-in user id outside React (used by the api-client). */
export const getAuthUserId = (): string | null => useSessionStore.getState().user?.id ?? null;

export const useCurrentUser = () => useSessionStore((s) => s.user);
export const useIsHydrated = () => useSessionStore((s) => s.hydrated);

export function useRole(): Role | null {
  return useSessionStore((s) => s.user?.role ?? null);
}
