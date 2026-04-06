import { Linking } from 'react-native';

export function sendViaWhatsApp(phone: string, message: string) {
  const encoded = encodeURIComponent(message);
  Linking.openURL(`https://wa.me/${phone}?text=${encoded}`);
}

export function sendViaSMS(phone: string, message: string) {
  const encoded = encodeURIComponent(message);
  Linking.openURL(`sms:${phone}?body=${encoded}`);
}
