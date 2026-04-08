import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CustomerInfo } from 'react-native-purchases';
import { useAuth } from '@/lib/auth-context';
import { hasPremium as checkDbPremium } from '@/lib/premium';
import {
  initRevenueCat,
  checkPremiumEntitlement,
  addCustomerInfoListener,
  ENTITLEMENT_ID,
} from '@/lib/revenuecat';

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!user) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    // Check DB first (trial, referral, ambassador)
    if (checkDbPremium(user)) {
      setIsPremium(true);
      setIsLoading(false);
      return;
    }

    // Then check RevenueCat
    try {
      await initRevenueCat(user.id);
      const hasEntitlement = await checkPremiumEntitlement();
      setIsPremium(hasEntitlement);
    } catch (e) {
      console.error('RevenueCat check failed:', e);
      setIsPremium(false);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Listen for purchase changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = addCustomerInfoListener((info: CustomerInfo) => {
      const active = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      setIsPremium(active || (user ? checkDbPremium(user) : false));
    });

    return unsubscribe;
  }, [user]);

  async function refresh() {
    setIsLoading(true);
    await checkStatus();
  }

  return (
    <PremiumContext.Provider value={{ isPremium, isLoading, refresh }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
