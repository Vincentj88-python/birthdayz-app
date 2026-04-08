import React, { createContext, useContext, useEffect, useState } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { User } from '@/types/database';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = makeRedirectUri();

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  profileChecked: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        setProfileChecked(false);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfileChecked(true);
        setIsLoading(false);
      }
    });

    // Listen for deep link redirects (OAuth callback)
    const linkingSub = Linking.addEventListener('url', async ({ url }) => {
      if (url.includes('access_token') || url.includes('code=')) {
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, []);

  async function fetchUserProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUser(data as User);
    }
    setProfileChecked(true);
    setIsLoading(false);
  }

  async function refreshUser() {
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error('No OAuth URL returned');

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri,
    );

    if (result.type === 'success') {
      const params = new URLSearchParams(
        result.url.split('#')[1] || result.url.split('?')[1] || ''
      );
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUri },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfileChecked(false);
  }

  return (
    <AuthContext.Provider
      value={{ session, user, isLoading, profileChecked, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
