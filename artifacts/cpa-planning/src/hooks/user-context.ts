import { createContext } from "react";

export type UserRole = 'employee' | 'officer' | 'manager' | 'admin';

export interface AppUser {
  id: number;
  name: string;
  username?: string;
  role: UserRole;
  designation: string;
}

export interface UserContextType {
  user: AppUser | null;
  setUser: (user: AppUser) => void;
  login: (user: AppUser) => void;
  logout: () => void;
  canManage: boolean;
  isAdmin: boolean;
  canCloseInquiry: boolean;
  isLoading: boolean;
}

export type AuthenticatedContext = Omit<UserContextType, "user"> & { user: AppUser };

export const UserContext = createContext<UserContextType | null>(null);
