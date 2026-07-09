import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = 'employee' | 'officer' | 'manager' | 'admin';

export interface AppUser {
  id: number;
  name: string;
  username?: string;
  role: UserRole;
  designation: string;
}

export const USERS: AppUser[] = [
  { id: 1, name: 'سالم الحارثي',   role: 'employee', designation: 'موظف إداري' },
  { id: 2, name: 'مريم البلوشية', role: 'officer',   designation: 'أخصائي تخطيط' },
  { id: 3, name: 'خالد الريامي',  role: 'manager',   designation: 'مدير دائرة التخطيط' },
  { id: 4, name: 'مسؤول النظام',  role: 'admin',     designation: 'مسؤول النظام' },
];

const STORAGE_KEY = "hema_session";

interface UserContextType {
  user: AppUser | null;
  setUser: (user: AppUser) => void;
  login: (user: AppUser) => void;
  logout: () => void;
  canManage: boolean;
  isAdmin: boolean;
  canCloseInquiry: boolean;
}

type AuthenticatedContext = Omit<UserContextType, "user"> & { user: AppUser };

export const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AppUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AppUser) : null;
    } catch {
      return null;
    }
  });

  function login(u: AppUser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUserState(u);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
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
