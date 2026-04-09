import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';
export const ENTITLEMENT_ID = 'Birthdayz Pro';

let initialized = false;

export async function initRevenueCat(userId?: string): Promise<void> {
  if (initialized) return;
  if (!API_KEY) {
    console.warn('RevenueCat API key not configured, skipping init');
    return;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
    }

    Purchases.configure({ apiKey: API_KEY, appUserID: userId });
    initialized = true;
  } catch (e) {
    console.error('RevenueCat init failed:', e);
  }
}

export async function checkPremiumEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch (e) {
    console.error('RevenueCat entitlement check failed:', e);
    return false;
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
