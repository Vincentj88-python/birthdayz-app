import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';

const API_KEY = 'test_YCmuXoFeDRlJtEMHDAlyyeFsxSM';
export const ENTITLEMENT_ID = 'Birthdayz Pro';

let initialized = false;

export async function initRevenueCat(userId?: string): Promise<void> {
  if (initialized) return;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  }

  Purchases.configure({ apiKey: API_KEY, appUserID: userId });
  initialized = true;
}

export async function checkPremiumEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch {
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
