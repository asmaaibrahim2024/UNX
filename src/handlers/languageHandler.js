import { useEffect } from 'react';

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