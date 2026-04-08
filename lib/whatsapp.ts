import { Alert, Linking } from 'react-native';

function sanitizePhone(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (/^\+?\d{8,15}$/.test(cleaned)) return cleaned;
  return null;
}

export async function sendViaWhatsApp(phone: string, message: string) {
  const clean = sanitizePhone(phone);
  if (!clean) {
    Alert.alert('Invalid phone number', 'Please update the phone number and try again.');
    return;
  }
  const encoded = encodeURIComponent(message);
  try {
    await Linking.openURL(`https://wa.me/${clean}?text=${encoded}`);
  } catch {
    Alert.alert('Could not open WhatsApp', 'WhatsApp may not be installed on this device.');
  }
}

export async function sendViaSMS(phone: string, message: string) {
  const clean = sanitizePhone(phone);
  if (!clean) {
    Alert.alert('Invalid phone number', 'Please update the phone number and try again.');
    return;
  }
  const encoded = encodeURIComponent(message);
  try {
    await Linking.openURL(`sms:${clean}?body=${encoded}`);
  } catch {
    Alert.alert('Could not open Messages', 'SMS may not be available on this device.');
  }
}
