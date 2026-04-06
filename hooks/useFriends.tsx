import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Friend } from '@/types/database';

type NewFriend = {
  name: string;
  phone?: string | null;
  birthday?: string | null;
  birthday_source?: string | null;
  notes?: string | null;
  relationship?: string | null;
};

interface FriendsContextType {
  friends: Friend[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addFriend: (data: NewFriend) => Promise<Friend | null>;
  updateFriend: (id: string, data: Partial<NewFriend>) => Promise<void>;
  deleteFriend: (id: string) => Promise<void>;
  batchAddFriends: (items: NewFriend[]) => Promise<void>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userId = session?.user?.id;

  const fetchFriends = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    const { data } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (data) {
      setFriends(data as Friend[]);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  async function refresh() {
    setIsLoading(true);
    await fetchFriends();
  }

  async function addFriend(data: NewFriend): Promise<Friend | null> {
    if (!userId) return null;

    const { data: inserted, error } = await supabase
      .from('friends')
      .insert({ ...data, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    const friend = inserted as Friend;
    setFriends((prev) => [...prev, friend].sort((a, b) => a.name.localeCompare(b.name)));
    return friend;
  }

  async function updateFriend(id: string, data: Partial<NewFriend>): Promise<void> {
    const { error } = await supabase
      .from('friends')
      .update(data)
      .eq('id', id);

    if (error) throw error;

    setFriends((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...data } : f)),
    );
  }

  async function deleteFriend(id: string): Promise<void> {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setFriends((prev) => prev.filter((f) => f.id !== id));
  }

  async function batchAddFriends(items: NewFriend[]): Promise<void> {
    if (!userId || items.length === 0) return;

    const rows = items.map((item) => ({ ...item, user_id: userId }));
    const { data, error } = await supabase
      .from('friends')
      .insert(rows)
      .select();

    if (error) throw error;

    if (data) {
      setFriends((prev) =>
        [...prev, ...(data as Friend[])].sort((a, b) => a.name.localeCompare(b.name)),
      );
    }
  }

  return (
    <FriendsContext.Provider
      value={{ friends, isLoading, refresh, addFriend, updateFriend, deleteFriend, batchAddFriends }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
}
