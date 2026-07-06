import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import fr from './locales/fr.json';
import vi from './locales/vi.json';
import ko from './locales/ko.json';
import ms from './locales/ms.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'zh-CN', label: '中文（简体）', short: '中' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'vi', label: 'Tiếng Việt', short: 'VN' },
  { code: 'ko', label: '한국어', short: '한' },
  { code: 'ms', label: 'Bahasa Melayu', short: 'MS' },
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-CN': { translation: zhCN },
      fr: { translation: fr },
      vi: { translation: vi },
      ko: { translation: ko },
      ms: { translation: ms },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-CN', 'fr', 'vi', 'ko', 'ms'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ybls_lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
