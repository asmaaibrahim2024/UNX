
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Function to dynamically load translations using require.context()
const loadNamespaces = () => {
  const resources = {};

  // Webpack require.context to find locale files dynamically (supporting both "locales" and "locale")
  const context = require.context('../components', true, /(locales|locale)\/.*\.locale\.(ar|en)\.json$/);
  
  context.keys().forEach((filePath) => {
    const matches = filePath.match(/\.\/(.+?)\/(locales|locale)\/(.+?)\.locale\.(\w+)\.json/);
    if (matches) {
      const [, component, , namespace, lang] = matches; // Ignore the second match (locales/locale)
      const translation = context(filePath);

      if (!resources[lang]) resources[lang] = {};
      resources[lang][namespace] = translation;
    }
  });

  return resources;
};


// Load translations once
const resources = loadNamespaces();
console.log(resources,"resources");

// Extract available namespaces based on the default language
const defaultLang = window.appConfig?.app?.defaultLang || 'en';
console.log(defaultLang,"defaultLang");

const namespaces = resources[defaultLang] ? Object.keys(resources[defaultLang]) : [];
console.log(namespaces,"namespaces");


// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    ns: namespaces, // Auto-detect namespaces
    defaultNS: namespaces.includes('common') ? 'common' : namespaces[0], // Fallback to first namespace if 'common' is not found
    interpolation: { escapeValue: false },
  });

export default i18n;


