import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from '@/locales/en.json';
import af from '@/locales/af.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';
const supportedLng = ['en', 'af'].includes(deviceLanguage) ? deviceLanguage : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    af: { translation: af },
  },
  lng: supportedLng,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
