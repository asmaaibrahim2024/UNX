import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
/**
 * @param {object} props
 * @param {string} props.lang: Set Lang of page
 * @param {string} props.dir: Set Page direction
 */
// export const useHeaderLanguage = ({ lang, dir }) => {
//   useEffect(() => {
//     document.documentElement.lang = lang;
//   }, [lang]);
//   useEffect(() => {
//     document.documentElement.dir = dir;
//   }, [dir]);
// };

export const useHeaderLanguage = ({ lang, dir }) => {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    
    // Optional: Add language class to body for CSS targeting
    document.body.classList.remove('lang-en', 'lang-ar');
    document.body.classList.add(`lang-${lang}`);
  }, [lang, dir]); // Combined into one effect since they're related
};


export const useI18n = (namespace) => {
  const { t, i18n: i18nInstance } = useTranslation(namespace);
  const direction = i18n.dir(i18nInstance.language);
  const language = i18nInstance.language;


  return { t, direction, language,i18nInstance};
};

