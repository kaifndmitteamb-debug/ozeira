'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { DataStore } from '@/lib/store/data-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOrderManager: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  signup: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    referralCode?: string
  ) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'ozeira_auth_current_user_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Initial local restore
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const fresh = DataStore.getUserById(parsed.id) || parsed;
        setUser(fresh);
      }
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setIsLoaded(true);
    }

    // 2. Supabase Auth state change listener
    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          // Fetch or sync profile from Supabase
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
            setUser(profile);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
          }
        }
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, []);

  const refreshUser = () => {
    if (!user) return;
    const fresh = DataStore.getUserById(user.id);
    if (fresh) {
      setUser(fresh);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fresh));
    }
  };

  const login = async (email: string, password?: string) => {
    // 1. Supabase Auth attempt
    if (isSupabaseConfigured && password) {
      try {
        const { data: authData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authData?.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
          if (profile) {
            if (profile.is_blocked) {
              await supabase.auth.signOut();
              return { success: false, message: 'This account has been restricted by store administration.' };
            }
            setUser(profile);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
            return { success: true, message: `Welcome back, ${profile.full_name}!`, user: profile };
          }
        }
      } catch (err) {
        console.error('Supabase login error:', err);
      }
    }

    // 2. Demo fallback & offline account check
    const existing = DataStore.getUserByEmail(email);
    if (!existing) {
      return { success: false, message: 'No account found with this email address.' };
    }
    if (existing.is_blocked) {
      return { success: false, message: 'This account has been restricted by store administration.' };
    }
    setUser(existing);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(existing));
    return { success: true, message: `Welcome back, ${existing.full_name}!`, user: existing };
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    referralCode?: string
  ) => {
    // 1. Supabase Auth registration
    if (isSupabaseConfigured) {
      try {
        const { data: authData } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone || '',
              role: 'customer',
            },
          },
        });

        if (authData?.user) {
          const newUser = DataStore.createUser(
            {
              id: authData.user.id,
              email,
              full_name: fullName,
              phone,
              role: 'customer',
            },
            referralCode
          );
          setUser(newUser);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
          return {
            success: true,
            message: 'Account created successfully! 250 welcome points credited to your wallet.',
            user: newUser,
          };
        }
      } catch (err) {
        console.error('Supabase signup error:', err);
      }
    }

    // 2. Offline / Local fallback registration
    const existing = DataStore.getUserByEmail(email);
    if (existing) {
      return { success: false, message: 'An account with this email already exists. Please login.' };
    }
    const newUser = DataStore.createUser(
      {
        email,
        full_name: fullName,
        phone,
        role: 'customer',
      },
      referralCode
    );
    setUser(newUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    return {
      success: true,
      message: 'Account created successfully! 250 welcome points credited to your wallet.',
      user: newUser,
    };
  };

  const logout = () => {
    if (isSupabaseConfigured) {
      supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return false;
    const updated = DataStore.saveUser({ ...user, ...data });
    setUser(updated);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    return true;
  };

  const isAdmin = user?.role === 'admin';
  const isOrderManager = user?.role === 'admin' || user?.role === 'order_manager';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isOrderManager,
        login,
        signup,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
