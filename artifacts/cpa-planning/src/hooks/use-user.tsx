import { useContext, useEffect, useState, ReactNode } from "react";
import { UserContext, AppUser, UserRole, AuthenticatedContext } from "./user-context";

export type { AppUser, UserRole, AuthenticatedContext };

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch(`${BASE}/api/auth/me`, { credentials: "include" });
        if (!response.ok) return;

        const data = await response.json() as {
          id: number;
          nameAr: string;
          username: string | null;
          designation: string | null;
          role: UserRole;
        };
        if (!cancelled) {
          setUserState({
            id: data.id,
            name: data.nameAr,
            username: data.username ?? undefined,
            role: data.role,
            designation: data.designation ?? "",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadSession();
    return () => { cancelled = true; };
  }, []);

  function login(u: AppUser) {
    setUserState(u);
  }

  function logout() {
    void fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUserState(null);
  }

  function setUser(u: AppUser) {
    login(u);
  }

  const canManage       = user?.role === 'officer' || user?.role === 'manager' || user?.role === 'admin';
  const isAdmin         = user?.role === 'admin';
  const canCloseInquiry = user?.role === 'manager' || user?.role === 'admin';

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      login,
      logout,
      canManage: !!canManage,
      isAdmin: !!isAdmin,
      canCloseInquiry: !!canCloseInquiry,
      isLoading,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): AuthenticatedContext {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context as AuthenticatedContext;
}

export function useIsAuthenticated(): boolean {
  const context = useContext(UserContext);
  return !!context?.user;
}
