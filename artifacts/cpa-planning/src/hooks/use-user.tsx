import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = 'employee' | 'officer' | 'manager' | 'admin';

export interface AppUser {
  id: number;
  name: string;
  role: UserRole;
  designation: string;
}

export const USERS: AppUser[] = [
  { id: 1, name: 'سالم الحارثي',   role: 'employee', designation: 'موظف إداري' },
  { id: 2, name: 'مريم البلوشية', role: 'officer',   designation: 'أخصائي تخطيط' },
  { id: 3, name: 'خالد الريامي',  role: 'manager',   designation: 'مدير دائرة التخطيط' },
  { id: 4, name: 'مسؤول النظام',  role: 'admin',     designation: 'مسؤول النظام' },
];

interface UserContextType {
  user: AppUser;
  setUser: (user: AppUser) => void;
  canManage: boolean;
  isAdmin: boolean;
  canCloseInquiry: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser>(USERS[0]);

  const canManage        = user.role === 'officer' || user.role === 'manager' || user.role === 'admin';
  const isAdmin          = user.role === 'admin';
  const canCloseInquiry  = user.role === 'manager'  || user.role === 'admin';

  return (
    <UserContext.Provider value={{ user, setUser, canManage, isAdmin, canCloseInquiry }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
