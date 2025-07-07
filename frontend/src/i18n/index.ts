import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import nl from './locales/nl.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';
import ru from './locales/ru.json';

const resources = {
  fr: {
    translation: fr
  },
  en: {
    translation: en
  },
  es: {
    translation: es
  },
  nl: {
    translation: nl
  },
  de: {
    translation: de
  },
  it: {
    translation: it
  },
  pt: {
    translation: pt
  },
  zh: {
    translation: zh
  },
  ar: {
    translation: ar
  },
  ru: {
    translation: ru
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;