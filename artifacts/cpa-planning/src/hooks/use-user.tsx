import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = 'employee' | 'officer' | 'manager' | 'admin';

export interface AppUser {
  id: number;
  name: string;
  role: UserRole;
}

export const USERS: AppUser[] = [
  { id: 1, name: 'سالم الحارثي', role: 'employee' },
  { id: 2, name: 'مريم البلوشية', role: 'officer' },
  { id: 3, name: 'خالد الريامي', role: 'manager' },
  { id: 4, name: 'مسؤول النظام', role: 'admin' },
];

interface UserContextType {
  user: AppUser;
  setUser: (user: AppUser) => void;
  canManage: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(USERS[0]);
  
  const canManage = user.role === 'officer' || user.role === 'manager' || user.role === 'admin';
  const isAdmin = user.role === 'admin';

  return (
    <UserContext.Provider value={{ user, setUser, canManage, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
